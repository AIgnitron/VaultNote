import { File, Paths, Directory } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { IMAGE_DIRECTORY } from '../constants';
import { addImage, deleteImage as deleteImageFromDb, getImagesForNote } from '../database';
import type { NoteImage } from '../types';

// ─── Directory Setup ─────────────────────────────────────────
function getImageDir(): Directory {
  return new Directory(Paths.document, IMAGE_DIRECTORY);
}

export async function ensureImageDirectory(): Promise<void> {
  const dir = getImageDir();
  if (!dir.exists) {
    dir.create();
  }
}

// ─── Pick Images ─────────────────────────────────────────────
export async function pickImages(): Promise<string[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library permission is required to attach images.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.8,
  });

  if (result.canceled || !result.assets) return [];
  return result.assets.map((a) => a.uri);
}

// ─── Save Image Locally ──────────────────────────────────────
export async function saveImageLocally(sourceUri: string): Promise<string> {
  await ensureImageDirectory();
  const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
  const destFile = new File(getImageDir(), filename);
  const sourceFile = new File(sourceUri);
  sourceFile.copy(destFile);
  return destFile.uri;
}

// ─── Attach Images to Note ───────────────────────────────────
export async function attachImagesToNote(noteId: string, sourceUris: string[]): Promise<NoteImage[]> {
  const images: NoteImage[] = [];
  for (const uri of sourceUris) {
    const localUri = await saveImageLocally(uri);
    const img = await addImage(noteId, localUri);
    images.push(img);
  }
  return images;
}

// ─── Delete Image (file + db) ────────────────────────────────
export async function removeImage(image: NoteImage): Promise<void> {
  try {
    const file = new File(image.uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // File may already be deleted
  }
  await deleteImageFromDb(image.id);
}

// ─── Delete All Images for Note ──────────────────────────────
export async function removeAllImagesForNote(noteId: string): Promise<void> {
  const images = await getImagesForNote(noteId);
  for (const img of images) {
    try {
      const file = new File(img.uri);
      if (file.exists) {
        file.delete();
      }
    } catch {
      // Continue
    }
  }
}

// ─── Clear All Image Files ───────────────────────────────────
export async function clearAllImageFiles(): Promise<void> {
  const dir = getImageDir();
  if (dir.exists) {
    dir.delete();
  }
}
