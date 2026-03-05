import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Animated,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { getNotes, deleteNote, deleteMultipleNotes, updateNote, getVoiceCountForNotes } from '../../database';
import { removeAllImagesForNote, removeAllVoiceForNote } from '../../services';
import { EmptyState, ConfirmDialog, ChecklistPreview } from '../../components';
import { formatDate, truncateText } from '../../utils';
import { getChecklistSummary } from '../../utils/checklist';
import type { Note, RootStackParamList, SortOption } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function NotesListScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useTheme();
  const { colors } = theme;
  // @ts-ignore - navigation typed via RootStackParamList

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('pinned_first');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [voiceCounts, setVoiceCounts] = useState<Record<string, number>>({});

  // Multi-select
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Swipe delete
  const [swipeNoteId, setSwipeNoteId] = useState<string | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const loadNotes = useCallback(async () => {
    try {
      const data = await getNotes(sortOption, false, searchQuery);
      setNotes(data);
      // Fetch voice recording counts
      const ids = data.map((n) => n.id);
      const counts = await getVoiceCountForNotes(ids);
      setVoiceCounts(counts);
    } catch (e) {
      console.error('Failed to load notes:', e);
    } finally {
      setLoading(false);
    }
  }, [sortOption, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [loadNotes])
  );

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      loadNotes();
    }, 300);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery, loadNotes]);

  const handleCreateNote = () => {
    navigation.navigate('NoteEditor', {});
  };

  const handleOpenNote = (noteId: string) => {
    if (multiSelect) {
      toggleSelect(noteId);
      return;
    }
    navigation.navigate('NoteEditor', { noteId });
  };

  const handleLongPress = (noteId: string) => {
    if (!multiSelect) {
      setMultiSelect(true);
      setSelectedIds(new Set([noteId]));
    }
  };

  const toggleSelect = (noteId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) next.delete(noteId);
      else next.add(noteId);
      if (next.size === 0) setMultiSelect(false);
      return next;
    });
  };

  const cancelMultiSelect = () => {
    setMultiSelect(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    try {
      const ids = Array.from(selectedIds);
      for (const id of ids) {
        await removeAllImagesForNote(id);
        await removeAllVoiceForNote(id);
      }
      await deleteMultipleNotes(ids);
      cancelMultiSelect();
      await loadNotes();
    } catch (e) {
      Alert.alert('Error', 'Failed to delete notes.');
    }
    setShowDeleteConfirm(false);
  };

  const handleSwipeDelete = async (noteId: string) => {
    try {
      await removeAllImagesForNote(noteId);
      await removeAllVoiceForNote(noteId);
      await deleteNote(noteId);
      await loadNotes();
    } catch {
      Alert.alert('Error', 'Failed to delete note.');
    }
    setSwipeNoteId(null);
  };

  const handleTogglePin = async (note: Note) => {
    await updateNote(note.id, { pinned: !note.pinned });
    await loadNotes();
  };

  const handleArchive = async (note: Note) => {
    await updateNote(note.id, { archived: true });
    await loadNotes();
  };

  const sortLabels: Record<SortOption, string> = {
    date_created: 'Date Created',
    date_edited: 'Date Edited',
    pinned_first: 'Pinned First',
  };

  const renderNoteItem = ({ item }: { item: Note }) => {
    const isSelected = selectedIds.has(item.id);
    // Determine card background: note color > pinned > default
    const hasCustomColor = !!item.color;
    const cardBg = item.color
      ? item.color
      : item.pinned
        ? colors.pinnedBackground
        : colors.card;
    // Use dark text on custom pastel backgrounds for readability
    const cardTextColor = hasCustomColor ? '#1A1A1A' : colors.text;
    const cardSecondaryColor = hasCustomColor ? '#555555' : colors.textSecondary;
    const cardPlaceholderColor = hasCustomColor ? '#777777' : colors.placeholder;

    return (
      <TouchableOpacity
        onPress={() => handleOpenNote(item.id)}
        onLongPress={() => handleLongPress(item.id)}
        activeOpacity={0.7}
        style={[
          styles.noteCard,
          {
            backgroundColor: cardBg,
            borderColor: isSelected ? colors.accent : colors.border,
            borderWidth: isSelected ? 2 : 0.5,
          },
        ]}
      >
        <View style={styles.noteHeader}>
          <View style={styles.noteTitleRow}>
            {multiSelect && (
              <Ionicons
                name={isSelected ? 'checkbox' : 'square-outline'}
                size={22}
                color={isSelected ? colors.accent : colors.placeholder}
                style={{ marginRight: 10 }}
              />
            )}
            {item.pinned && (
              <Ionicons name="pin" size={14} color={colors.accent} style={{ marginRight: 6 }} />
            )}
            <Text style={[styles.noteTitle, { color: cardTextColor }]} numberOfLines={1}>
              {item.title || 'Untitled'}
            </Text>
          </View>
          {!multiSelect && (
            <View style={styles.noteActions}>
              <TouchableOpacity onPress={() => handleTogglePin(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons
                  name={item.pinned ? 'pin' : 'pin-outline'}
                  size={18}
                  color={item.pinned ? colors.accent : colors.icon}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleArchive(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="archive-outline" size={18} color={colors.icon} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setSwipeNoteId(item.id);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        {item.body.length > 0 && (
          <Text style={[styles.noteBody, { color: cardSecondaryColor }]} numberOfLines={2}>
            {truncateText(item.body.replace(/^- \[[ x]\] /gm, ''), 120)}
          </Text>
        )}
        {(() => {
          const summary = getChecklistSummary(item.body);
          if (summary) {
            return <ChecklistPreview total={summary.total} checked={summary.checked} />;
          }
          return null;
        })()}
        {voiceCounts[item.id] > 0 && (
          <View style={styles.voiceIndicator}>
            <Ionicons name="mic" size={13} color={colors.accent} />
            <Text style={[styles.voiceIndicatorText, { color: cardSecondaryColor }]}>
              {voiceCounts[item.id]} recording{voiceCounts[item.id] > 1 ? 's' : ''}
            </Text>
          </View>
        )}
        <Text style={[styles.noteDate, { color: cardPlaceholderColor }]}>
          {formatDate(item.updated_at)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>VaultNote</Text>
        {multiSelect ? (
          <View style={styles.headerRight}>
            <Text style={[styles.selectedCount, { color: colors.accent }]}>
              {selectedIds.size} selected
            </Text>
            <TouchableOpacity onPress={() => setShowDeleteConfirm(true)}>
              <Ionicons name="trash-outline" size={22} color={colors.danger} />
            </TouchableOpacity>
            <TouchableOpacity onPress={cancelMultiSelect}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => navigation.navigate('Archive')}>
              <Ionicons name="archive-outline" size={22} color={colors.icon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSortMenu(!showSortMenu)}>
              <Ionicons name="funnel-outline" size={22} color={colors.icon} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Sort Menu */}
      {showSortMenu && (
        <View style={[styles.sortMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {(Object.keys(sortLabels) as SortOption[]).map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => {
                setSortOption(option);
                setShowSortMenu(false);
              }}
              style={[
                styles.sortOption,
                sortOption === option && { backgroundColor: colors.pinnedBackground },
              ]}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  { color: sortOption === option ? colors.accent : colors.text },
                ]}
              >
                {sortLabels[option]}
              </Text>
              {sortOption === option && (
                <Ionicons name="checkmark" size={18} color={colors.accent} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.placeholder} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search notes..."
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.placeholder} />
          </TouchableOpacity>
        )}
      </View>

      {/* Notes List */}
      {loading ? (
        <EmptyState title="" loading />
      ) : notes.length === 0 ? (
        <EmptyState
          icon="🔒"
          title={searchQuery ? 'No matching notes' : 'No notes yet'}
          subtitle={searchQuery ? 'Try a different search term' : 'Tap + to create your first private note'}
        />
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={renderNoteItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      {/* FAB */}
      {!multiSelect && (
        <TouchableOpacity
          onPress={handleCreateNote}
          activeOpacity={0.8}
          style={[styles.fab, { backgroundColor: colors.accent }]}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={swipeNoteId !== null}
        title="Delete Note"
        message="This note and its images will be permanently deleted."
        confirmLabel="Delete"
        onConfirm={() => swipeNoteId && handleSwipeDelete(swipeNoteId)}
        onCancel={() => setSwipeNoteId(null)}
        danger
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete Selected"
        message={`Delete ${selectedIds.size} note(s)? This cannot be undone.`}
        confirmLabel="Delete All"
        onConfirm={handleDeleteSelected}
        onCancel={() => setShowDeleteConfirm(false)}
        danger
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  sortMenu: {
    marginHorizontal: 16,
    borderRadius: 10,
    borderWidth: 0.5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sortOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 0.5,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  noteCard: {
    borderRadius: 12,
    padding: 16,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  noteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  noteBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
  },
  voiceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  voiceIndicatorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
