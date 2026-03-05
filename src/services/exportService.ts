import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Print from 'expo-print';
import {
  getAllNotesForExport,
  getAllImages,
  getAllVoiceRecordings,
  importNote,
  importImage,
  importVoiceRecording,
  getNote,
  getImagesForNote,
  getVoiceRecordingsForNote,
  addImage,
  addVoiceRecording,
} from '../database';
import { saveImageLocally } from './imageService';
import { saveVoiceLocally } from './voiceService';
import type { BackupData, BackupImageData, BackupVoiceData, Note, NoteImage, VoiceRecording, ExportFormat } from '../types';
import { BACKUP_FORMAT_VERSION } from '../constants';

// ─── Base64 Helpers ──────────────────────────────────────────
async function fileToBase64(uri: string): Promise<string | null> {
  try {
    const file = new File(uri);
    if (!file.exists) return null;
    return await file.base64();
  } catch {
    return null;
  }
}

function base64ToFile(base64: string, filename: string): string {
  const file = new File(Paths.cache, filename);
  file.write(base64, { encoding: 'base64' });
  return file.uri;
}

// ─── Full Backup Export ──────────────────────────────────────
export async function exportFullBackup(): Promise<void> {
  const notes = await getAllNotesForExport();
  const images = await getAllImages();
  const voiceRecordings = await getAllVoiceRecordings();

  // Encode images as base64
  const imageFiles: BackupImageData[] = [];
  for (const img of images) {
    const b64 = await fileToBase64(img.uri);
    if (b64) {
      const ext = img.uri.split('.').pop() || 'jpg';
      imageFiles.push({
        id: img.id,
        note_id: img.note_id,
        filename: `${img.id}.${ext}`,
        base64: b64,
        created_at: img.created_at,
      });
    }
  }

  // Encode voice recordings as base64
  const voiceFiles: BackupVoiceData[] = [];
  for (const rec of voiceRecordings) {
    const b64 = await fileToBase64(rec.uri);
    if (b64) {
      const ext = rec.uri.split('.').pop() || 'm4a';
      voiceFiles.push({
        id: rec.id,
        note_id: rec.note_id,
        filename: `${rec.id}.${ext}`,
        base64: b64,
        duration_ms: rec.duration_ms,
        created_at: rec.created_at,
      });
    }
  }

  const backup: BackupData = {
    version: BACKUP_FORMAT_VERSION,
    exported_at: new Date().toISOString(),
    notes,
    images,
    image_files: imageFiles,
    voice_recordings: voiceRecordings,
    voice_files: voiceFiles,
  };

  const jsonStr = JSON.stringify(backup, null, 2);
  const filename = `vaultnote_backup_${Date.now()}.json`;
  const file = new File(Paths.cache, filename);
  file.write(jsonStr);

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export VaultNote Backup',
      UTI: 'public.json',
    });
  }
}

// ─── Single Note Export ──────────────────────────────────────
export async function exportSingleNote(noteId: string, format: ExportFormat): Promise<void> {
  const note = await getNote(noteId);
  if (!note) throw new Error('Note not found');

  const images = await getImagesForNote(noteId);
  const voices = await getVoiceRecordingsForNote(noteId);

  let fileUri: string;
  let mimeType: string;

  switch (format) {
    case 'txt': {
      const content = `${note.title}\n\n${note.body}\n\nCreated: ${note.created_at}\nEdited: ${note.updated_at}\n\nImages: ${images.length}\nVoice Recordings: ${voices.length}`;
      const filename = `${sanitizeFilename(note.title)}.txt`;
      const file = new File(Paths.cache, filename);
      file.write(content);
      fileUri = file.uri;
      mimeType = 'text/plain';
      break;
    }
    case 'json': {
      // Include base64 images in single note export
      const imageFiles: BackupImageData[] = [];
      for (const img of images) {
        const b64 = await fileToBase64(img.uri);
        if (b64) {
          const ext = img.uri.split('.').pop() || 'jpg';
          imageFiles.push({
            id: img.id,
            note_id: img.note_id,
            filename: `${img.id}.${ext}`,
            base64: b64,
            created_at: img.created_at,
          });
        }
      }
      const voiceFiles: BackupVoiceData[] = [];
      for (const rec of voices) {
        const b64 = await fileToBase64(rec.uri);
        if (b64) {
          const ext = rec.uri.split('.').pop() || 'm4a';
          voiceFiles.push({
            id: rec.id,
            note_id: rec.note_id,
            filename: `${rec.id}.${ext}`,
            base64: b64,
            duration_ms: rec.duration_ms,
            created_at: rec.created_at,
          });
        }
      }
      const data = { note, images, image_files: imageFiles, voice_recordings: voices, voice_files: voiceFiles };
      const jsonStr = JSON.stringify(data, null, 2);
      const filename = `${sanitizeFilename(note.title)}.json`;
      const file = new File(Paths.cache, filename);
      file.write(jsonStr);
      fileUri = file.uri;
      mimeType = 'application/json';
      break;
    }
    case 'pdf': {
      // Build image HTML with embedded base64
      let imagesHtml = '';
      for (const img of images) {
        const b64 = await fileToBase64(img.uri);
        if (b64) {
          const ext = img.uri.split('.').pop() || 'jpg';
          const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
          const imgMime = mimeMap[ext] || 'image/jpeg';
          imagesHtml += `<img src="data:${imgMime};base64,${b64}" style="max-width:100%;margin:8px 0;border-radius:8px;" />`;
        }
      }

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: -apple-system, sans-serif; padding: 40px; color: #1A1A1A; }
              h1 { font-size: 24px; margin-bottom: 8px; }
              .meta { color: #888; font-size: 12px; margin-bottom: 24px; }
              .body { font-size: 16px; line-height: 1.6; white-space: pre-wrap; }
              .images { margin-top: 24px; }
              .voice-info { margin-top: 16px; color: #888; font-size: 12px; }
            </style>
          </head>
          <body>
            <h1>${escapeHtml(note.title || 'Untitled')}</h1>
            <div class="meta">Created: ${new Date(note.created_at).toLocaleString()} | Edited: ${new Date(note.updated_at).toLocaleString()}</div>
            <div class="body">${escapeHtml(note.body)}</div>
            ${imagesHtml ? `<div class="images"><h3>Attachments</h3>${imagesHtml}</div>` : ''}
            ${voices.length > 0 ? `<div class="voice-info">${voices.length} voice recording(s) attached (not embeddable in PDF)</div>` : ''}
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      fileUri = uri;
      mimeType = 'application/pdf';
      break;
    }
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: `Share Note` });
  }
}

// ─── Import Backup ───────────────────────────────────────────
export async function importBackup(): Promise<{ notesImported: number; imagesImported: number; voiceImported: number }> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return { notesImported: 0, imagesImported: 0, voiceImported: 0 };
  }

  const pickedUri = result.assets[0].uri;
  const pickedFile = new File(pickedUri);
  const content = pickedFile.textSync();

  let data: BackupData;
  try {
    data = JSON.parse(content);
  } catch {
    throw new Error('Invalid JSON file. Please select a valid VaultNote backup.');
  }

  // Validate structure
  if (!data.version || !Array.isArray(data.notes)) {
    throw new Error('Invalid backup format. Missing required fields.');
  }

  if (data.version > BACKUP_FORMAT_VERSION) {
    throw new Error(`Backup version ${data.version} is not supported. Please update VaultNote.`);
  }

  let notesImported = 0;
  let imagesImported = 0;
  let voiceImported = 0;

  for (const note of data.notes) {
    if (isValidNote(note)) {
      await importNote(note);
      notesImported++;
    }
  }

  // Import images with base64 data (v2+)
  if (Array.isArray(data.image_files) && data.image_files.length > 0) {
    for (const imgData of data.image_files) {
      try {
        // Decode base64 to a temp file, then save locally
        const tempUri = base64ToFile(imgData.base64, imgData.filename);
        const localUri = await saveImageLocally(tempUri);
        await addImage(imgData.note_id, localUri);
        imagesImported++;
      } catch {
        // Skip failed images
      }
    }
  } else if (Array.isArray(data.images)) {
    // Fallback: v1 format – import image records (URIs may not work cross-device)
    for (const image of data.images) {
      if (isValidImage(image)) {
        await importImage(image);
        imagesImported++;
      }
    }
  }

  // Import voice recordings with base64 data (v2+)
  if (Array.isArray(data.voice_files) && data.voice_files.length > 0) {
    for (const voiceData of data.voice_files) {
      try {
        const tempUri = base64ToFile(voiceData.base64, voiceData.filename);
        const localUri = saveVoiceLocally(tempUri);
        await addVoiceRecording(voiceData.note_id, localUri, voiceData.duration_ms);
        voiceImported++;
      } catch {
        // Skip failed voice recordings
      }
    }
  } else if (Array.isArray(data.voice_recordings)) {
    // Fallback: import records (URIs may not work cross-device)
    for (const rec of data.voice_recordings) {
      if (isValidVoiceRecording(rec)) {
        await importVoiceRecording(rec);
        voiceImported++;
      }
    }
  }

  return { notesImported, imagesImported, voiceImported };
}

// ─── Validation ──────────────────────────────────────────────
function isValidNote(note: any): note is Note {
  return (
    typeof note === 'object' &&
    typeof note.id === 'string' &&
    typeof note.title === 'string' &&
    typeof note.body === 'string' &&
    typeof note.created_at === 'string' &&
    typeof note.updated_at === 'string'
  );
}

function isValidImage(image: any): image is NoteImage {
  return (
    typeof image === 'object' &&
    typeof image.id === 'string' &&
    typeof image.note_id === 'string' &&
    typeof image.uri === 'string' &&
    typeof image.created_at === 'string'
  );
}

function isValidVoiceRecording(rec: any): rec is VoiceRecording {
  return (
    typeof rec === 'object' &&
    typeof rec.id === 'string' &&
    typeof rec.note_id === 'string' &&
    typeof rec.uri === 'string' &&
    typeof rec.duration_ms === 'number' &&
    typeof rec.created_at === 'string'
  );
}

// ─── Helpers ─────────────────────────────────────────────────
function sanitizeFilename(name: string): string {
  return (name || 'untitled').replace(/[^a-zA-Z0-9_\- ]/g, '').substring(0, 50).trim() || 'untitled';
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
