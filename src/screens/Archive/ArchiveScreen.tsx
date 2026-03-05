import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { getArchivedNotes, updateNote, deleteNote } from '../../database';
import { removeAllImagesForNote, removeAllVoiceForNote } from '../../services';
import { EmptyState, ConfirmDialog } from '../../components';
import { formatDate, truncateText } from '../../utils';
import type { Note, RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ArchiveScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useTheme();
  const { colors } = theme;

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    try {
      const data = await getArchivedNotes();
      setNotes(data);
    } catch (e) {
      console.error('Failed to load archived notes:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [loadNotes])
  );

  const handleUnarchive = async (note: Note) => {
    try {
      await updateNote(note.id, { archived: false });
      await loadNotes();
    } catch {
      Alert.alert('Error', 'Failed to unarchive note.');
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await removeAllImagesForNote(noteId);
      await removeAllVoiceForNote(noteId);
      await deleteNote(noteId);
      await loadNotes();
    } catch {
      Alert.alert('Error', 'Failed to delete note.');
    }
    setDeleteNoteId(null);
  };

  const handleOpenNote = (noteId: string) => {
    navigation.navigate('NoteEditor', { noteId });
  };

  const renderNoteItem = ({ item }: { item: Note }) => {
    const hasCustomColor = !!item.color;
    const cardBg = item.color ? item.color : colors.card;
    const cardTextColor = hasCustomColor ? '#1A1A1A' : colors.text;
    const cardSecondaryColor = hasCustomColor ? '#555555' : colors.textSecondary;
    const cardPlaceholderColor = hasCustomColor ? '#777777' : colors.placeholder;

    return (
      <TouchableOpacity
        onPress={() => handleOpenNote(item.id)}
        activeOpacity={0.7}
        style={[styles.noteCard, { backgroundColor: cardBg, borderColor: colors.border }]}
      >
        <View style={styles.noteHeader}>
          <Text style={[styles.noteTitle, { color: cardTextColor }]} numberOfLines={1}>
            {item.title || 'Untitled'}
          </Text>
          <View style={styles.noteActions}>
            <TouchableOpacity
              onPress={() => handleUnarchive(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-undo-outline" size={18} color={colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setDeleteNoteId(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
        {item.body.length > 0 && (
          <Text style={[styles.noteBody, { color: cardSecondaryColor }]} numberOfLines={2}>
            {truncateText(item.body.replace(/^- \[[ x]\] /gm, ''), 120)}
          </Text>
        )}
        <Text style={[styles.noteDate, { color: cardPlaceholderColor }]}>
          {formatDate(item.updated_at)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <EmptyState title="" loading />
      ) : notes.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No archived notes"
          subtitle="Notes you archive will appear here"
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

      <ConfirmDialog
        visible={deleteNoteId !== null}
        title="Delete Note"
        message="This note and its images will be permanently deleted."
        confirmLabel="Delete"
        onConfirm={() => deleteNoteId && handleDelete(deleteNoteId)}
        onCancel={() => setDeleteNoteId(null)}
        danger
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  noteCard: {
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 16,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
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
});
