import { Audio } from 'expo-av';
import { File, Paths, Directory } from 'expo-file-system';
import { VOICE_DIRECTORY } from '../constants';
import {
  addVoiceRecording,
  deleteVoiceRecording as deleteVoiceRecordingFromDb,
  getVoiceRecordingsForNote,
} from '../database';
import type { VoiceRecording } from '../types';

// ─── Directory Setup ─────────────────────────────────────────
function getVoiceDir(): Directory {
  return new Directory(Paths.document, VOICE_DIRECTORY);
}

export function ensureVoiceDirectory(): void {
  const dir = getVoiceDir();
  if (!dir.exists) {
    dir.create();
  }
}

// ─── Recording ───────────────────────────────────────────────
let currentRecording: Audio.Recording | null = null;

export async function startRecording(): Promise<void> {
  // Request permission
  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Microphone permission is required to record audio.');
  }

  // Configure audio mode
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  // Start recording
  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );
  currentRecording = recording;
}

export async function stopRecording(): Promise<{ uri: string; durationMs: number }> {
  if (!currentRecording) {
    throw new Error('No recording in progress.');
  }

  await currentRecording.stopAndUnloadAsync();

  // Reset audio mode
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
  });

  const uri = currentRecording.getURI();
  if (!uri) {
    currentRecording = null;
    throw new Error('Recording failed – no audio URI.');
  }

  const status = await currentRecording.getStatusAsync();
  const durationMs = status.durationMillis ?? 0;

  currentRecording = null;
  return { uri, durationMs };
}

export async function cancelRecording(): Promise<void> {
  if (!currentRecording) return;
  try {
    await currentRecording.stopAndUnloadAsync();
  } catch {
    // Already stopped
  }
  const uri = currentRecording.getURI();
  currentRecording = null;
  if (uri) {
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch {
      // Cleanup is best-effort
    }
  }
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
}

export function isRecording(): boolean {
  return currentRecording !== null;
}

// ─── Save Voice File Locally ─────────────────────────────────
export function saveVoiceLocally(sourceUri: string): string {
  ensureVoiceDirectory();
  const ext = sourceUri.split('.').pop() || 'm4a';
  const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const destFile = new File(getVoiceDir(), filename);
  const sourceFile = new File(sourceUri);
  sourceFile.copy(destFile);
  return destFile.uri;
}

// ─── Attach Recording to Note ────────────────────────────────
export async function attachVoiceToNote(
  noteId: string,
  sourceUri: string,
  durationMs: number
): Promise<VoiceRecording> {
  const localUri = saveVoiceLocally(sourceUri);
  return addVoiceRecording(noteId, localUri, durationMs);
}

// ─── Delete Voice Recording (file + db) ──────────────────────
export async function removeVoiceRecording(recording: VoiceRecording): Promise<void> {
  try {
    const file = new File(recording.uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // File may already be deleted
  }
  await deleteVoiceRecordingFromDb(recording.id);
}

// ─── Remove All Voice Files for Note ─────────────────────────
export async function removeAllVoiceForNote(noteId: string): Promise<void> {
  const recordings = await getVoiceRecordingsForNote(noteId);
  for (const rec of recordings) {
    try {
      const file = new File(rec.uri);
      if (file.exists) file.delete();
    } catch {
      // Continue
    }
  }
}

// ─── Clear All Voice Files ───────────────────────────────────
export async function clearAllVoiceFiles(): Promise<void> {
  const dir = getVoiceDir();
  if (dir.exists) {
    dir.delete();
  }
}

// ─── Playback ────────────────────────────────────────────────
let currentSound: Audio.Sound | null = null;

export async function playVoice(uri: string): Promise<Audio.Sound> {
  // Stop any existing playback
  await stopPlayback();

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
  });

  const { sound } = await Audio.Sound.createAsync({ uri });
  currentSound = sound;
  await sound.playAsync();
  return sound;
}

export async function stopPlayback(): Promise<void> {
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch {
      // Already disposed
    }
    currentSound = null;
  }
}

// ─── Format Duration ─────────────────────────────────────────
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
