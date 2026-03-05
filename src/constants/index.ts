export const APP_NAME = 'VaultNote';
export const APP_VERSION = '1.0.0';
export const DATABASE_NAME = 'vaultnote.db';
export const DATABASE_VERSION = 1;
export const BACKUP_FORMAT_VERSION = 2;
export const IMAGE_DIRECTORY = 'vaultnote_images';
export const VOICE_DIRECTORY = 'vaultnote_voice';

export const PRIVACY_STATEMENT =
  'VaultNote stores all data locally on your device. No data is collected, transmitted, or stored externally.';

export const DEFAULT_ACCENT_COLOR = '#2E7D6E';

export const ACCENT_COLOR_OPTIONS = [
  '#2E7D6E', // Muted Emerald (default)
  '#4A90D9', // Soft Blue
  '#D4A843', // Warm Gold
  '#C75C5C', // Muted Red
  '#7B68AE', // Soft Purple
  '#E07C4F', // Sunset Orange
  '#4CAF93', // Teal
  '#8B6DAE', // Lavender
];

// Per-note background color options (single color regardless of theme mode)
export const NOTE_COLOR_OPTIONS: { label: string; color: string }[] = [
  { label: 'Default',  color: ''        },
  { label: 'Yellow',   color: '#FFF9C4' },
  { label: 'Green',    color: '#C8E6C9' },
  { label: 'Blue',     color: '#BBDEFB' },
  { label: 'Purple',   color: '#E1BEE7' },
  { label: 'Pink',     color: '#F8BBD0' },
  { label: 'Orange',   color: '#FFE0B2' },
  { label: 'Teal',     color: '#B2DFDB' },
];
