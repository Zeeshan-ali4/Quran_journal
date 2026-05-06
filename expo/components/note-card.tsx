import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BookMarked, Globe2, MessageSquareQuote, Trash2, Type } from 'lucide-react-native';

import { palette } from '@/constants/colors';
import type { NoteItem } from '@/types/quran';

interface NoteCardProps {
  note: NoteItem;
  onDelete?: (id: string) => void;
}

function getLabel(note: NoteItem) {
  if (note.target.type === 'chapter') {
    return `Chapter note · Surah ${note.target.surahNumber}`;
  }

  if (note.target.type === 'verse') {
    return `Verse note · Ayah ${note.target.verseNumber}`;
  }

  return `Word note · ${note.target.word}`;
}

function NoteIcon({ type }: { type: NoteItem['target']['type'] }) {
  if (type === 'chapter') {
    return <BookMarked color={palette.forest} size={18} />;
  }

  if (type === 'verse') {
    return <MessageSquareQuote color={palette.forest} size={18} />;
  }

  return <Type color={palette.forest} size={18} />;
}

export function NoteCard({ note, onDelete }: NoteCardProps) {
  return (
    <View style={styles.card} testID={`note-card-${note.id}`}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <NoteIcon type={note.target.type} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.label}>{getLabel(note)}</Text>
          <Text style={styles.subtitle}>
            {note.target.surahName}
            {note.target.verseNumber ? ` · ${note.target.verseNumber}` : ''}
          </Text>
        </View>
        {onDelete ? (
          <Pressable onPress={() => onDelete(note.id)} hitSlop={8} testID={`delete-note-${note.id}`}>
            <Trash2 color={palette.rose} size={18} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.authorRow}>
        <View style={[styles.avatar, note.author.relation === 'you' ? styles.avatarYou : styles.avatarFollower]}>
          <Text style={styles.avatarText}>{note.author.avatar}</Text>
        </View>
        <View style={styles.authorTextWrap}>
          <Text style={styles.authorName}>{note.author.name}</Text>
          <Text style={styles.authorHandle}>{note.author.handle}</Text>
        </View>
        {note.isShared ? (
          <View style={styles.sharedPill}>
            <Globe2 color={palette.forest} size={12} />
            <Text style={styles.sharedPillText}>Shared</Text>
          </View>
        ) : (
          <View style={styles.privatePill}>
            <Text style={styles.privatePillText}>Private</Text>
          </View>
        )}
      </View>

      <Text style={styles.content}>{note.content}</Text>
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
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarYou: {
    backgroundColor: palette.forest,
  },
  avatarFollower: {
    backgroundColor: '#E7D7BB',
  },
  avatarText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '800',
  },
  authorTextWrap: {
    flex: 1,
    gap: 2,
  },
  authorName: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  authorHandle: {
    color: palette.smoke,
    fontSize: 12,
    fontWeight: '500',
  },
  sharedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#EEF4EB',
  },
  sharedPillText: {
    color: palette.forest,
    fontSize: 12,
    fontWeight: '700',
  },
  privatePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#F4ECE5',
  },
  privatePillText: {
    color: palette.smoke,
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    color: palette.ink,
    fontSize: 15,
    lineHeight: 24,
  },
  timestamp: {
    color: palette.smoke,
    fontSize: 12,
    fontWeight: '500',
  },
});