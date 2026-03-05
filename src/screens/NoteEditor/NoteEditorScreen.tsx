import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { createNote, getNote, updateNote, getImagesForNote, getVoiceRecordingsForNote } from '../../database';
import { pickImages, attachImagesToNote, removeImage } from '../../services';
import {
  startRecording,
  stopRecording,
  cancelRecording,
  attachVoiceToNote,
  removeVoiceRecording,
  stopPlayback,
} from '../../services/voiceService';
import { exportSingleNote } from '../../services/exportService';
import { ChecklistItemRow, VoiceRecordingRow, RecordingIndicator } from '../../components';
import {
  parseBody,
  serializeBody,
  toggleChecklistItem,
  updateChecklistItemText,
  removeChecklistItem,
  addChecklistItem,
  type BodySegment,
} from '../../utils/checklist';
import { NOTE_COLOR_OPTIONS } from '../../constants';
import type { Note, NoteImage, VoiceRecording, RootStackParamList, ExportFormat } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'NoteEditor'>;

export default function NoteEditorScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { theme } = useTheme();
  const { colors } = theme;
  const noteId = route.params?.noteId as string | undefined;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [images, setImages] = useState<NoteImage[]>([]);
  const [currentNoteId, setCurrentNoteId] = useState<string | undefined>(noteId);
  const [saving, setSaving] = useState(false);

  // Checklist state
  const [segments, setSegments] = useState<BodySegment[]>([]);
  const [lastAddedIndex, setLastAddedIndex] = useState<number | null>(null);

  // Voice recording state
  const [voiceRecordings, setVoiceRecordings] = useState<VoiceRecording[]>([]);
  const [recording, setRecording] = useState(false);

  // Note color state
  const [noteColor, setNoteColor] = useState<string | undefined>(undefined);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const noteColorRef = useRef(noteColor);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const titleRef = useRef(title);
  const bodyRef = useRef(body);
  const currentNoteIdRef = useRef(currentNoteId);

  // Keep refs in sync
  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { bodyRef.current = body; }, [body]);
  useEffect(() => { currentNoteIdRef.current = currentNoteId; }, [currentNoteId]);
  useEffect(() => { noteColorRef.current = noteColor; }, [noteColor]);

  // Load existing note
  useEffect(() => {
    if (noteId) {
      (async () => {
        const note = await getNote(noteId);
        if (note) {
          setTitle(note.title);
          setBody(note.body);
          setSegments(parseBody(note.body));
          setNoteColor(note.color);
        }
        const imgs = await getImagesForNote(noteId);
        setImages(imgs);
        const voices = await getVoiceRecordingsForNote(noteId);
        setVoiceRecordings(voices);
      })();
    }
  }, [noteId]);

  // Auto-save with debounce
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      await saveNote();
    }, 1000);
  }, []);

  const saveNote = async () => {
    const t = titleRef.current;
    const b = bodyRef.current;
    const id = currentNoteIdRef.current;
    const c = noteColorRef.current;

    if (!t.trim() && !b.trim()) return;

    setSaving(true);
    try {
      if (id) {
        await updateNote(id, { title: t, body: b, color: c });
      } else {
        const newNote = await createNote({ title: t, body: b, pinned: false, archived: false, color: c });
        setCurrentNoteId(newNote.id);
      }
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  // Save on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      // Final save
      const t = titleRef.current;
      const b = bodyRef.current;
      const id = currentNoteIdRef.current;
      const c = noteColorRef.current;
      if (t.trim() || b.trim()) {
        if (id) {
          updateNote(id, { title: t, body: b, color: c }).catch(() => {});
        } else {
          createNote({ title: t, body: b, pinned: false, archived: false, color: c }).catch(() => {});
        }
      }
    };
  }, []);

  const handleTitleChange = (text: string) => {
    setTitle(text);
    triggerAutoSave();
  };

  const handleBodyChange = (text: string) => {
    setBody(text);
    setSegments(parseBody(text));
    triggerAutoSave();
  };

  // ─── Checklist handlers ──────────────────────────────────────
  const syncBodyFromSegments = (newSegments: BodySegment[]) => {
    setSegments(newSegments);
    const newBody = serializeBody(newSegments);
    setBody(newBody);
    bodyRef.current = newBody;
    triggerAutoSave();
  };

  const handleToggleCheck = (globalIndex: number) => {
    const updated = toggleChecklistItem(segments, globalIndex);
    syncBodyFromSegments(updated);
  };

  const handleCheckTextChange = (globalIndex: number, text: string) => {
    const updated = updateChecklistItemText(segments, globalIndex, text);
    syncBodyFromSegments(updated);
  };

  const handleDeleteCheckItem = (globalIndex: number) => {
    const updated = removeChecklistItem(segments, globalIndex);
    syncBodyFromSegments(updated);
  };

  const handleAddCheckItem = () => {
    const updated = addChecklistItem(segments);
    // Calculate total checklist items to find the new last index
    let total = 0;
    for (const seg of updated) {
      if (seg.type === 'checklist' && seg.items) total += seg.items.length;
    }
    setLastAddedIndex(total - 1);
    syncBodyFromSegments(updated);
  };

  const handleCheckSubmitEditing = (globalIndex: number) => {
    // When pressing enter/return on a checklist item, add a new one after it
    handleAddCheckItem();
  };

  // Image handling
  const handleAddImages = async () => {
    try {
      // Ensure note is saved first
      let id = currentNoteIdRef.current;
      if (!id) {
        const t = titleRef.current || 'Untitled';
        const b = bodyRef.current;
        const newNote = await createNote({ title: t, body: b, pinned: false, archived: false });
        id = newNote.id;
        setCurrentNoteId(id);
      }

      const uris = await pickImages();
      if (uris.length > 0) {
        const newImages = await attachImagesToNote(id, uris);
        setImages((prev) => [...prev, ...newImages]);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add images.');
    }
  };

  const handleDeleteImage = async (image: NoteImage) => {
    Alert.alert('Delete Image', 'Remove this image from the note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeImage(image);
          setImages((prev) => prev.filter((i) => i.id !== image.id));
        },
      },
    ]);
  };

  const handleViewImage = (index: number) => {
    navigation.navigate('ImageViewer', { images, initialIndex: index });
  };

  // Voice recording handlers
  const handleStartRecording = async () => {
    try {
      await startRecording();
      setRecording(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to start recording.');
    }
  };

  const handleStopRecording = async () => {
    try {
      const { uri, durationMs } = await stopRecording();
      setRecording(false);

      // Ensure note is saved first
      let id = currentNoteIdRef.current;
      if (!id) {
        const t = titleRef.current || 'Untitled';
        const b = bodyRef.current;
        const newNote = await createNote({ title: t, body: b, pinned: false, archived: false });
        id = newNote.id;
        setCurrentNoteId(id);
      }

      const rec = await attachVoiceToNote(id, uri, durationMs);
      setVoiceRecordings((prev) => [...prev, rec]);
    } catch (e: any) {
      setRecording(false);
      Alert.alert('Error', e.message || 'Failed to save recording.');
    }
  };

  const handleCancelRecording = async () => {
    await cancelRecording();
    setRecording(false);
  };

  const handleDeleteVoice = (rec: VoiceRecording) => {
    Alert.alert('Delete Recording', 'Remove this voice recording?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await stopPlayback();
          await removeVoiceRecording(rec);
          setVoiceRecordings((prev) => prev.filter((r) => r.id !== rec.id));
        },
      },
    ]);
  };

  // Export
  const handleExport = () => {
    if (!currentNoteId) {
      Alert.alert('Save First', 'Please add some content before exporting.');
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Export as TXT', 'Export as PDF', 'Export as JSON'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          const formats: ExportFormat[] = ['txt', 'pdf', 'json'];
          if (buttonIndex > 0) {
            exportSingleNote(currentNoteId, formats[buttonIndex - 1]).catch((e) =>
              Alert.alert('Export Error', e.message)
            );
          }
        }
      );
    } else {
      Alert.alert('Export Note', 'Choose format:', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'TXT', onPress: () => exportSingleNote(currentNoteId, 'txt').catch((e) => Alert.alert('Error', e.message)) },
        { text: 'PDF', onPress: () => exportSingleNote(currentNoteId, 'pdf').catch((e) => Alert.alert('Error', e.message)) },
        { text: 'JSON', onPress: () => exportSingleNote(currentNoteId, 'json').catch((e) => Alert.alert('Error', e.message)) },
      ]);
    }
  };

  // Header buttons
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowColorPicker((v) => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="color-fill" size={22} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAddCheckItem} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="checkbox-outline" size={22} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleStartRecording} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="mic-outline" size={22} color={recording ? colors.danger : colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAddImages} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="image-outline" size={22} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExport} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="share-outline" size={22} color={colors.accent} />
          </TouchableOpacity>
        </View>
      ),
      headerTitle: () => (
        <View style={styles.headerCenter}>
          {saving && <Text style={[styles.savingText, { color: colors.textSecondary }]}>Saving...</Text>}
        </View>
      ),
    });
  }, [navigation, colors, saving, currentNoteId, segments, recording, noteColor, showColorPicker]);

  // Compute note background tint (picked color overrides theme)
  const editorBg = noteColor || colors.background;
  // Use dark text on custom pastel backgrounds for readability
  const editorTextColor = noteColor ? '#1A1A1A' : colors.text;
  const editorPlaceholderColor = noteColor ? '#777777' : colors.placeholder;
  const editorSecondaryColor = noteColor ? '#555555' : colors.textSecondary;

  const handleColorSelect = (opt: typeof NOTE_COLOR_OPTIONS[0]) => {
    setNoteColor(opt.color || undefined);
    triggerAutoSave();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: editorBg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Color Picker Bar */}
      {showColorPicker && (
        <View style={[styles.colorPickerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {NOTE_COLOR_OPTIONS.map((opt) => {
            const isSelected =
              (!noteColor && !opt.color) ||
              noteColor === opt.color;
            return (
              <TouchableOpacity
                key={opt.label}
                onPress={() => handleColorSelect(opt)}
                activeOpacity={0.7}
                style={[
                  styles.noteColorSwatch,
                  {
                    backgroundColor: opt.color || colors.card,
                    borderColor: isSelected ? colors.accent : colors.border,
                    borderWidth: isSelected ? 2.5 : 1,
                  },
                ]}
              >
                {isSelected && <Ionicons name="checkmark" size={14} color={colors.accent} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <TextInput
          style={[styles.titleInput, { color: editorTextColor }]}
          placeholder="Title"
          placeholderTextColor={editorPlaceholderColor}
          value={title}
          onChangeText={handleTitleChange}
          multiline
          maxLength={200}
          returnKeyType="next"
        />

        {/* Body – rendered as segments (text blocks + checklists) */}
        {segments.length === 0 ? (
          <TextInput
            style={[styles.bodyInput, { color: editorTextColor }]}
            placeholder="Start writing..."
            placeholderTextColor={editorPlaceholderColor}
            value={body}
            onChangeText={handleBodyChange}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
          />
        ) : (
          <View>
            {(() => {
              let globalCheckIndex = 0;
              return segments.map((seg, segIdx) => {
                if (seg.type === 'text') {
                  return (
                    <TextInput
                      key={`text-${segIdx}`}
                      style={[styles.bodyInput, { color: editorTextColor, minHeight: seg.content.length === 0 ? 40 : undefined }]}
                      placeholder={segIdx === 0 ? 'Start writing...' : ''}
                      placeholderTextColor={editorPlaceholderColor}
                      value={seg.content}
                      onChangeText={(text) => {
                        const newSegments = [...segments];
                        newSegments[segIdx] = { ...seg, content: text };
                        syncBodyFromSegments(newSegments);
                      }}
                      multiline
                      textAlignVertical="top"
                      scrollEnabled={false}
                    />
                  );
                }

                if (seg.type === 'checklist' && seg.items) {
                  const startIndex = globalCheckIndex;
                  const itemsJsx = seg.items.map((item, itemIdx) => {
                    const gi = startIndex + itemIdx;
                    return (
                      <ChecklistItemRow
                        key={`check-${gi}`}
                        item={item}
                        onToggle={() => handleToggleCheck(gi)}
                        onChangeText={(text) => handleCheckTextChange(gi, text)}
                        onDelete={() => handleDeleteCheckItem(gi)}
                        onSubmitEditing={() => handleCheckSubmitEditing(gi)}
                        autoFocus={lastAddedIndex === gi}
                      />
                    );
                  });
                  globalCheckIndex += seg.items.length;

                  return (
                    <View key={`checklist-${segIdx}`} style={styles.checklistSection}>
                      {itemsJsx}
                      <TouchableOpacity
                        onPress={handleAddCheckItem}
                        style={styles.addCheckItemBtn}
                        activeOpacity={0.6}
                      >
                        <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
                        <Text style={[styles.addCheckItemText, { color: colors.accent }]}>Add item</Text>
                      </TouchableOpacity>
                    </View>
                  );
                }

                return null;
              });
            })()}
          </View>
        )}

        {/* Recording Indicator */}
        {recording && (
          <RecordingIndicator onStop={handleStopRecording} onCancel={handleCancelRecording} />
        )}

        {/* Voice Recordings */}
        {voiceRecordings.length > 0 && (
          <View style={styles.voiceSection}>
            <Text style={[styles.voiceSectionTitle, { color: editorSecondaryColor }]}>
              Voice Recordings ({voiceRecordings.length})
            </Text>
            {voiceRecordings.map((rec) => (
              <VoiceRecordingRow
                key={rec.id}
                recording={rec}
                onDelete={handleDeleteVoice}
              />
            ))}
          </View>
        )}

        {/* Images */}
        {images.length > 0 && (
          <View style={styles.imagesSection}>
            <Text style={[styles.imagesSectionTitle, { color: editorSecondaryColor }]}>
              Attachments ({images.length})
            </Text>
            <View style={styles.imagesGrid}>
              {images.map((img, index) => (
                <View key={img.id} style={styles.imageWrapper}>
                  <TouchableOpacity onPress={() => handleViewImage(index)} activeOpacity={0.8}>
                    <Image source={{ uri: img.uri }} style={[styles.imageThumbnail, { borderColor: colors.border }]} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteImage(img)}
                    style={[styles.imageDeleteBtn, { backgroundColor: colors.danger }]}
                  >
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                onPress={handleAddImages}
                style={[styles.addImageBtn, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}
              >
                <Ionicons name="add" size={28} color={colors.placeholder} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 32,
  },
  bodyInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerCenter: {
    alignItems: 'center',
  },
  savingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  colorPickerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  noteColorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagesSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#333',
  },
  imagesSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageWrapper: {
    position: 'relative',
  },
  imageThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  imageDeleteBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageBtn: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checklistSection: {
    marginVertical: 8,
    paddingVertical: 4,
  },
  addCheckItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingLeft: 4,
  },
  addCheckItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  voiceSection: {
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: '#333',
  },
  voiceSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
