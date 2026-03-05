import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME } from '../constants';
import type { Note, NoteCreate, NoteUpdate, NoteImage, VoiceRecording, SortOption } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

// ─── Initialization ──────────────────────────────────────────
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync(`PRAGMA journal_mode = WAL;`);
  await db.execAsync(`PRAGMA foreign_keys = ON;`);
  await createTables();
  return db;
}

async function createTables(): Promise<void> {
  const database = db!;
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
      archived INTEGER NOT NULL DEFAULT 0
    );
  `);
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY NOT NULL,
      note_id TEXT NOT NULL,
      uri TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
    );
  `);
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_images_note_id ON images(note_id);
  `);
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(pinned);
  `);
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_notes_archived ON notes(archived);
  `);
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS voice_recordings (
      id TEXT PRIMARY KEY NOT NULL,
      note_id TEXT NOT NULL,
      uri TEXT NOT NULL,
      duration_ms INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
    );
  `);
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_voice_note_id ON voice_recordings(note_id);
  `);

  // ── Migration: add color column if missing ───────────────
  try {
    await database.execAsync(`ALTER TABLE notes ADD COLUMN color TEXT DEFAULT NULL`);
  } catch {
    // Column already exists — ignore
  }
}

// ─── UUID Generation ─────────────────────────────────────────
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Notes CRUD ──────────────────────────────────────────────
export async function createNote(data: NoteCreate): Promise<Note> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  const id = generateId();
  const note: Note = {
    id,
    title: data.title,
    body: data.body,
    created_at: now,
    updated_at: now,
    pinned: data.pinned ?? false,
    archived: data.archived ?? false,
    color: data.color ?? undefined,
  };
  await database.runAsync(
    `INSERT INTO notes (id, title, body, created_at, updated_at, pinned, archived, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [note.id, note.title, note.body, note.created_at, note.updated_at, note.pinned ? 1 : 0, note.archived ? 1 : 0, note.color ?? null]
  );
  return note;
}

export async function updateNote(id: string, data: NoteUpdate): Promise<void> {
  const database = await getDatabase();
  const sets: string[] = [];
  const values: (string | number)[] = [];

  if (data.title !== undefined) { sets.push('title = ?'); values.push(data.title); }
  if (data.body !== undefined) { sets.push('body = ?'); values.push(data.body); }
  if (data.pinned !== undefined) { sets.push('pinned = ?'); values.push(data.pinned ? 1 : 0); }
  if (data.archived !== undefined) { sets.push('archived = ?'); values.push(data.archived ? 1 : 0); }
  if (data.color !== undefined) { sets.push('color = ?'); values.push(data.color || ''); }

  if (sets.length === 0) return;
  sets.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await database.runAsync(`UPDATE notes SET ${sets.join(', ')} WHERE id = ?`, values);
}

export async function deleteNote(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM notes WHERE id = ?', [id]);
}

export async function deleteMultipleNotes(ids: string[]): Promise<void> {
  const database = await getDatabase();
  const placeholders = ids.map(() => '?').join(',');
  await database.runAsync(`DELETE FROM notes WHERE id IN (${placeholders})`, ids);
}

export async function getNote(id: string): Promise<Note | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<any>('SELECT * FROM notes WHERE id = ?', [id]);
  return row ? mapRowToNote(row) : null;
}

export async function getNotes(
  sort: SortOption = 'date_edited',
  includeArchived = false,
  searchQuery?: string
): Promise<Note[]> {
  const database = await getDatabase();
  let query = 'SELECT * FROM notes';
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (!includeArchived) {
    conditions.push('archived = 0');
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    conditions.push('(title LIKE ? OR body LIKE ?)');
    const like = `%${searchQuery.trim()}%`;
    params.push(like, like);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  switch (sort) {
    case 'date_created':
      query += ' ORDER BY created_at DESC';
      break;
    case 'pinned_first':
      query += ' ORDER BY pinned DESC, updated_at DESC';
      break;
    case 'date_edited':
    default:
      query += ' ORDER BY updated_at DESC';
      break;
  }

  const rows = await database.getAllAsync<any>(query, params);
  return rows.map(mapRowToNote);
}

export async function getArchivedNotes(searchQuery?: string): Promise<Note[]> {
  const database = await getDatabase();
  let query = 'SELECT * FROM notes WHERE archived = 1';
  const params: (string | number)[] = [];

  if (searchQuery && searchQuery.trim().length > 0) {
    query += ' AND (title LIKE ? OR body LIKE ?)';
    const like = `%${searchQuery.trim()}%`;
    params.push(like, like);
  }

  query += ' ORDER BY updated_at DESC';
  const rows = await database.getAllAsync<any>(query, params);
  return rows.map(mapRowToNote);
}

export async function getAllNotesForExport(): Promise<Note[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>('SELECT * FROM notes ORDER BY created_at ASC');
  return rows.map(mapRowToNote);
}

// ─── Images CRUD ─────────────────────────────────────────────
export async function addImage(noteId: string, uri: string): Promise<NoteImage> {
  const database = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  const image: NoteImage = { id, note_id: noteId, uri, created_at: now };
  await database.runAsync(
    'INSERT INTO images (id, note_id, uri, created_at) VALUES (?, ?, ?, ?)',
    [image.id, image.note_id, image.uri, image.created_at]
  );
  return image;
}

export async function getImagesForNote(noteId: string): Promise<NoteImage[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM images WHERE note_id = ? ORDER BY created_at ASC',
    [noteId]
  );
  return rows.map(mapRowToImage);
}

export async function getAllImages(): Promise<NoteImage[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>('SELECT * FROM images ORDER BY created_at ASC');
  return rows.map(mapRowToImage);
}

export async function deleteImage(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM images WHERE id = ?', [id]);
}

export async function deleteImagesForNote(noteId: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM images WHERE note_id = ?', [noteId]);
}

// ─── Voice Recordings CRUD ───────────────────────────────────
export async function addVoiceRecording(noteId: string, uri: string, durationMs: number): Promise<VoiceRecording> {
  const database = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  const recording: VoiceRecording = { id, note_id: noteId, uri, duration_ms: durationMs, created_at: now };
  await database.runAsync(
    'INSERT INTO voice_recordings (id, note_id, uri, duration_ms, created_at) VALUES (?, ?, ?, ?, ?)',
    [recording.id, recording.note_id, recording.uri, recording.duration_ms, recording.created_at]
  );
  return recording;
}

export async function getVoiceRecordingsForNote(noteId: string): Promise<VoiceRecording[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM voice_recordings WHERE note_id = ? ORDER BY created_at ASC',
    [noteId]
  );
  return rows.map(mapRowToVoiceRecording);
}

export async function getAllVoiceRecordings(): Promise<VoiceRecording[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>('SELECT * FROM voice_recordings ORDER BY created_at ASC');
  return rows.map(mapRowToVoiceRecording);
}

export async function deleteVoiceRecording(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM voice_recordings WHERE id = ?', [id]);
}

export async function deleteVoiceRecordingsForNote(noteId: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM voice_recordings WHERE note_id = ?', [noteId]);
}

export async function importVoiceRecording(recording: VoiceRecording): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR IGNORE INTO voice_recordings (id, note_id, uri, duration_ms, created_at) VALUES (?, ?, ?, ?, ?)',
    [recording.id, recording.note_id, recording.uri, recording.duration_ms, recording.created_at]
  );
}

// ─── Note Voice Recording Count (for list previews) ─────────
export async function getVoiceCountForNotes(noteIds: string[]): Promise<Record<string, number>> {
  if (noteIds.length === 0) return {};
  const database = await getDatabase();
  const placeholders = noteIds.map(() => '?').join(',');
  const rows = await database.getAllAsync<any>(
    `SELECT note_id, COUNT(*) as count FROM voice_recordings WHERE note_id IN (${placeholders}) GROUP BY note_id`,
    noteIds
  );
  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.note_id] = row.count;
  }
  return result;
}

// ─── Bulk Operations ─────────────────────────────────────────
export async function clearAllData(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync('DELETE FROM voice_recordings');
  await database.execAsync('DELETE FROM images');
  await database.execAsync('DELETE FROM notes');
}

export async function importNote(note: Note): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR IGNORE INTO notes (id, title, body, created_at, updated_at, pinned, archived, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [note.id, note.title, note.body, note.created_at, note.updated_at, note.pinned ? 1 : 0, note.archived ? 1 : 0, note.color ?? null]
  );
}

export async function importImage(image: NoteImage): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR IGNORE INTO images (id, note_id, uri, created_at) VALUES (?, ?, ?, ?)',
    [image.id, image.note_id, image.uri, image.created_at]
  );
}

// ─── Helpers ─────────────────────────────────────────────────
function mapRowToNote(row: any): Note {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    created_at: row.created_at,
    updated_at: row.updated_at,
    pinned: row.pinned === 1,
    archived: row.archived === 1,
    color: row.color || undefined,
  };
}

function mapRowToImage(row: any): NoteImage {
  return {
    id: row.id,
    note_id: row.note_id,
    uri: row.uri,
    created_at: row.created_at,
  };
}

function mapRowToVoiceRecording(row: any): VoiceRecording {
  return {
    id: row.id,
    note_id: row.note_id,
    uri: row.uri,
    duration_ms: row.duration_ms,
    created_at: row.created_at,
  };
}
