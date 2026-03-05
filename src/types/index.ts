// ─── Note Model ───────────────────────────────────────────────
export interface Note {
  id: string;
  title: string;
  body: string;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  pinned: boolean;
  archived: boolean;
  color?: string; // optional background color
}

export type NoteCreate = Omit<Note, 'id' | 'created_at' | 'updated_at'>;
export type NoteUpdate = Partial<Omit<Note, 'id' | 'created_at'>>;

// ─── Image Model ──────────────────────────────────────────────
export interface NoteImage {
  id: string;
  note_id: string;
  uri: string;
  created_at: string; // ISO 8601
}

// ─── Voice Recording Model ───────────────────────────────────
export interface VoiceRecording {
  id: string;
  note_id: string;
  uri: string;
  duration_ms: number; // duration in milliseconds
  created_at: string; // ISO 8601
}

// ─── Theme Types ──────────────────────────────────────────────
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  accent: string;
  border: string;
  danger: string;
  dangerBackground: string;
  pinnedBackground: string;
  inputBackground: string;
  placeholder: string;
  icon: string;
  statusBar: 'light-content' | 'dark-content';
}

export interface AppTheme {
  mode: ThemeMode;
  colors: ThemeColors;
}

// ─── Settings ─────────────────────────────────────────────────
export interface AppSettings {
  themeMode: ThemeMode;
  accentColor: string;
}

// ─── Sort Options ─────────────────────────────────────────────
export type SortOption = 'date_created' | 'date_edited' | 'pinned_first';

// ─── Export / Import ──────────────────────────────────────────
export interface BackupImageData {
  id: string;
  note_id: string;
  filename: string;
  base64: string;
  created_at: string;
}

export interface BackupVoiceData {
  id: string;
  note_id: string;
  filename: string;
  base64: string;
  duration_ms: number;
  created_at: string;
}

export interface BackupData {
  version: number;
  exported_at: string;
  notes: Note[];
  images: NoteImage[];           // v1 compat (URI only)
  image_files?: BackupImageData[]; // v2+ (base64 encoded)
  voice_recordings?: VoiceRecording[];    // metadata
  voice_files?: BackupVoiceData[]; // v2+ (base64 encoded)
}

export type ExportFormat = 'txt' | 'pdf' | 'json';

// ─── Navigation ───────────────────────────────────────────────
export type RootStackParamList = {
  Main: undefined;
  NoteEditor: { noteId?: string };
  ImageViewer: { images: NoteImage[]; initialIndex: number };
  About: undefined;
  Legal: undefined;
  Archive: undefined;
};
