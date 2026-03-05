# VaultNote

Private. Offline. Yours.

VaultNote is a privacy-first note app that works fully offline. Your notes, images, and voice recordings stay on your device.

## What VaultNote can do

- Create and edit notes with auto-save
- Add checklist items inside notes
- Attach images from your gallery
- Record and attach voice notes
- Pin, archive, search, and sort notes
- Change note card color (same picked color in light/dark mode)
- Export individual notes (TXT, JSON, PDF)
- Export and import full app backups (JSON)
- Share the app from Settings

## Privacy

- No account required
- No cloud sync
- No analytics
- No ads
- No tracking
- No user data collection

All content is stored locally on your device.

## Install and open

If you received an APK file:

1. Copy `VaultNote.apk` to your Android device.
2. Open the file and allow installation from unknown sources if prompted.
3. Install and open VaultNote.

## Quick start

1. Tap **+** to create a note.
2. Enter title and content (saved automatically).
3. Use toolbar actions in the editor to:
	- Add checklist items
	- Add images
	- Record voice notes
	- Choose note color
	- Export note
4. From the main list, long-press a note to multi-select.

## Backup and restore

Open **Settings → Data**:

- **Export Data**: Creates a full backup JSON you can save/share.
- **Import Data**: Restores notes, images, and voice recordings from a backup JSON.

Tip: Keep a backup copy in a safe place before changing devices.

## Appearance settings

Open **Settings → Appearance**:

- Theme: Light / Dark / System
- Accent color selection

Note colors you assign in the editor override theme card colors and remain the same in all modes.

## Permissions used

VaultNote may ask for:

- **Photos/Media**: to attach images
- **Microphone**: to record voice notes
- **File access**: to import/export backups

Permissions are only used for app features you choose.

## Troubleshooting

- **Import failed**: Make sure the file is a valid VaultNote backup JSON.
- **Can’t attach image**: Check photo permission in Android settings.
- **Can’t record audio**: Check microphone permission.
- **Missing backups**: Use file manager search for `vaultnote_backup_*.json`.

## Support

- Open **Settings → About Aignitron → Contact Support**
- Or email: support@aignitron.com

## Version

Current app version: **1.0.0**

## Developer setup (quick)

For contributors and local development:

1. Install dependencies:
	- `npm install`
2. Run Android dev build:
	- `npx expo run:android`
3. Run iOS dev build (macOS + Xcode):
	- `npx expo run:ios`
4. Build Android release APK:
	- `cd android && ./gradlew assembleRelease`

Release APK output:

- `android/app/build/outputs/apk/release/app-release.apk`

