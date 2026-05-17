import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BookMarked, MessageSquareQuote, Trash2, Type } from 'lucide-react-native';

import { palette } from '@/constants/colors';
import type { UserNote } from '@/types/quran';

interface NoteCardProps {
  note: UserNote;
  onDelete?: (id: string) => void;
}

function getLabel(note: UserNote) {
  if (note.referenceType === 'surah') {
    return `Surah note · Surah ${note.surahNumber}`;
  }

  if (note.referenceType === 'ayah') {
    return `Ayah note · Surah ${note.surahNumber}${note.ayahNumber ? `:${note.ayahNumber}` : ''}`;
  }

  return `Word note · Surah ${note.surahNumber}${note.ayahNumber ? `:${note.ayahNumber}` : ''}`;
}

function NoteIcon({ type }: { type: UserNote['referenceType'] }) {
  if (type === 'surah') {
    return <BookMarked color={palette.forest} size={18} />;
  }

  if (type === 'ayah') {
    return <MessageSquareQuote color={palette.forest} size={18} />;
  }

  return <Type color={palette.forest} size={18} />;
}

export function NoteCard({ note, onDelete }: NoteCardProps) {
  return (
    <View style={styles.card} testID={`note-card-${note.id}`}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <NoteIcon type={note.referenceType} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.label}>{getLabel(note)}</Text>
          <Text style={styles.subtitle}>{note.ayahNumber ? `Ayah ${note.ayahNumber}` : 'Surah reflection'}</Text>
        </View>
        {onDelete ? (
          <Pressable onPress={() => onDelete(note.id)} hitSlop={8} testID={`delete-note-${note.id}`}>
            <Trash2 color={palette.rose} size={18} />
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.content}>{note.content}</Text>

      <View style={styles.tagsRow}>
        {note.tags.length > 0 ? (
          note.tags.map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))
        ) : (
          <View style={styles.tagChip}>
            <Text style={styles.tagText}>untagged</Text>
          </View>
        )}
      </View>

      <Text style={styles.timestamp}>{new Date(note.createdAt).toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    backgroundColor: palette.white,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: palette.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    color: palette.smoke,
    fontSize: 13,
    fontWeight: '500',
  },
  content: {
    color: palette.ink,
    fontSize: 15,
    lineHeight: 24,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    borderRadius: 999,
    backgroundColor: palette.mist,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    color: palette.smoke,
    fontSize: 12,
    fontWeight: '700',
  },
  timestamp: {
    color: palette.smoke,
    fontSize: 12,
    fontWeight: '500',
  },
});
