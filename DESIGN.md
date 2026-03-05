# VaultNote Design Document

## 1. Purpose

VaultNote is an offline-first mobile notes application focused on privacy and local ownership of data.

Primary goals:

- Keep all user content local to the device
- Provide rich note capabilities (text, checklist, images, voice)
- Offer reliable backup and restore
- Support clean, responsive UX across Android and iOS

Out of scope:

- Cloud sync
- User accounts/authentication
- Multi-device conflict resolution
- Server-side processing

## 2. Product Principles

- Privacy by default
- Offline by default
- Simplicity over feature bloat
- Fast access to core actions
- Safe destructive actions (confirmation dialogs)

## 3. High-Level Architecture

VaultNote is a single React Native app using Expo modules.

Layers:

1. Presentation layer
   - Screens and reusable components
2. Domain/logic layer
   - Checklist parsing, editor behavior, sorting/search behavior
3. Persistence layer
   - SQLite database for metadata/content
   - Device file system for image and voice binaries
4. Services layer
   - Image picker/storage
   - Voice recording/playback
   - Export/import serialization

No backend services are required at runtime.

## 4. Navigation Architecture

Navigation is implemented with React Navigation:

- Root stack
  - Main (tab navigator)
  - NoteEditor
  - ImageViewer (full-screen modal)
  - About
  - Legal
  - Archive
- Bottom tabs in Main
  - Notes
  - Settings

Design notes:

- Primary workflows are reachable within 1–2 taps.
- Modal presentation is used for immersive image viewing.
- Android bottom inset handling is applied to avoid overlap with system navigation buttons.

## 5. Data Model

## 5.1 Core entities

### Note

- `id: string`
- `title: string`
- `body: string`
- `created_at: string`
- `updated_at: string`
- `pinned: boolean`
- `archived: boolean`
- `color?: string`

### NoteImage

- `id: string`
- `note_id: string`
- `uri: string`
- `created_at: string`

### VoiceRecording

- `id: string`
- `note_id: string`
- `uri: string`
- `duration_ms: number`
- `created_at: string`

## 5.2 SQLite schema

Tables:

- `notes`
- `images`
- `voice_recordings`

Indexes:

- `idx_images_note_id`
- `idx_notes_pinned`
- `idx_notes_archived`
- `idx_voice_note_id`

DB configuration:

- `PRAGMA journal_mode = WAL`
- `PRAGMA foreign_keys = ON`

Migration behavior:

- Safe, best-effort migration adds `notes.color` when missing.

## 6. Storage Strategy

- Structured data (notes metadata/content) is in SQLite.
- Binary files (images, audio) are copied into app-local document directories:
  - `vaultnote_images`
  - `vaultnote_voice`
- Database rows store local URIs to these files.
- Deleting notes cascades metadata deletion through foreign keys.
- File cleanup is handled explicitly by services to avoid orphans.

## 7. Feature Design

## 7.1 Notes list

Capabilities:

- Search title/body text
- Sort by:
  - Date created
  - Date edited
  - Pinned first
- Pin/unpin note
- Archive note
- Multi-select delete

Card color priority:

1. Note-specific color
2. Pinned background color
3. Default theme card color

## 7.2 Note editor

Core behavior:

- Debounced auto-save (~1 second)
- Final save on unmount
- Supports new note creation and updates

Content modes:

- Free text
- Parsed checklist segments

Attachments:

- Multiple images per note
- Multiple voice recordings per note

Export actions:

- TXT
- JSON (with embedded base64 media)
- PDF (images embedded, voice represented as count)

Note color behavior:

- Color options are single-value (not light/dark pair)
- Selected color is persisted in `notes.color`
- Selected color is rendered consistently in all theme modes
- Text uses readable dark variants on custom pastel note backgrounds

## 7.3 Archive

- Displays archived notes separately
- Allows unarchive and delete operations
- Reuses card rendering principles from main list

## 7.4 Settings

Appearance:

- Theme: Light, Dark, System (default)
- Accent color selection

Data:

- Export full backup
- Import backup

About/legal:

- About app
- About company/legal links
- Contact support
- Share app action

Danger zone:

- Delete all app data with confirmation

## 8. Backup and Restore Design

## 8.1 Backup format

Current backup version is tracked by `BACKUP_FORMAT_VERSION`.

Payload includes:

- `notes`
- `images` (legacy compatibility)
- `image_files` (base64 file data)
- `voice_recordings` (metadata)
- `voice_files` (base64 file data)
- `exported_at`
- `version`

## 8.2 Export flow

1. Read all notes/images/voice metadata from DB.
2. Convert each binary file to base64 (when available).
3. Build versioned JSON payload.
4. Save to cache path.
5. Share using native share sheet.

## 8.3 Import flow

1. Pick JSON file.
2. Validate JSON structure and version compatibility.
3. Import notes.
4. Prefer modern base64 arrays (`image_files`, `voice_files`).
5. Fallback to legacy URI-based arrays for compatibility.
6. Persist imported media by copying into app-local directories.

Failure strategy:

- Per-file import failures are skipped; successful items continue.
- Validation failures produce user-facing import error messages.

## 9. Theming and UI System

Theme provider manages:

- Theme mode (`light`, `dark`, `system`)
- Accent color
- Derived color tokens

Persistence:

- Theme mode and accent color are saved to AsyncStorage.

Status bar and navigation colors are derived from current theme token set.

## 10. Permissions and Platform APIs

Permissions requested on-demand:

- Media library (image selection)
- Microphone (voice recording)

Platform modules used:

- `expo-sqlite`
- `expo-file-system`
- `expo-image-picker`
- `expo-av`
- `expo-sharing`
- `expo-document-picker`
- `expo-print`
- `expo-web-browser`

## 11. Error Handling Strategy

Patterns used:

- Try/catch around I/O operations
- Best-effort cleanup for local files
- User-facing alerts for failed import/export/reset actions
- Non-critical failures (e.g., optional cleanup) do not crash the app

## 12. Performance Characteristics

- SQLite indexes improve list/archive query speed.
- Debounced auto-save reduces write frequency.
- List rendering uses concise cards and lightweight derived fields.
- Media payload conversion is deferred to explicit export actions.

Potential hotspots:

- Large backup export/import due to base64 conversion
- Many large images during PDF export

## 13. Security and Privacy Considerations

- No application backend and no telemetry pipeline
- Data remains local unless user explicitly shares exports
- Backups can contain full user content; user is responsible for secure storage of exported files
- Links in legal screen open external pages only on user action

## 14. UX Decisions and Rationale

- Bottom tabs for fast switching between notes and settings
- Auto-save minimizes data loss risk
- Confirmation dialogs for destructive operations
- Separate archive to reduce accidental data loss
- Single-value note colors ensure consistent visual identity across themes

## 15. Known Constraints

- No built-in cloud sync
- No account-based recovery
- Import compatibility depends on backup version
- Very large media collections can increase export/import time and file size

## 16. Future Design Extensions (Optional)

- Encrypted-at-rest user option
- Selective backup/restore (per notebook/tag)
- Optional passcode/biometric lock
- Conflict-safe cloud sync architecture (if privacy model expands)
- Structured test coverage and CI pipelines
