import React, { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { NoteCard } from '@/components/note-card';
import { NoteComposer } from '@/components/note-composer';
import { palette } from '@/constants/colors';
import { useNotes } from '@/providers/notes-provider';
import type { NoteTag, UserNote } from '@/types/quran';

const NOTE_TAGS: NoteTag[] = ['reflection', 'action', 'question', "du'a", 'theme'];

export default function NotesScreen() {
  const { searchNotes, isLoading, deleteNote, updateNote } = useNotes();
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<NoteTag | null>(null);
  const [editingNote, setEditingNote] = useState<UserNote | null>(null);

  const results = useMemo(() => {
    const searched = searchNotes(query);
    if (!activeTag) return searched;
    return searched.filter((n) => n.tags.includes(activeTag));
  }, [searchNotes, query, activeTag]);

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>My Reflection Notes</Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Search notes offline"
          value={query}
          onChangeText={setQuery}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <Pressable
            style={[styles.filterPill, activeTag === null && styles.filterPillActive]}
            onPress={() => setActiveTag(null)}
          >
            <Text style={[styles.filterPillText, activeTag === null && styles.filterPillTextActive]}>All</Text>
          </Pressable>

          {NOTE_TAGS.map((tag) => (
            <Pressable
              key={tag}
              style={[styles.filterPill, activeTag === tag && styles.filterPillActive]}
              onPress={() => setActiveTag((curr) => (curr === tag ? null : tag))}
            >
              <Text style={[styles.filterPillText, activeTag === tag && styles.filterPillTextActive]}>{tag}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {isLoading ? <Text>Loading notes…</Text> : null}

        {results.length === 0 ? (
          <Text style={styles.emptyText}>No notes yet. Open a surah and tap an ayah to reflect.</Text>
        ) : (
          results.map((note) => (
            <Pressable
              key={note.id}
              onPress={() =>
                router.push({
                  pathname: '/surah/[id]',
                  params: {
                    id: String(note.surahNumber),
                    ayah: note.ayahNumber ? String(note.ayahNumber) : undefined,
                  },
                })
              }
            >
              <NoteCard note={note} onDelete={(id) => void deleteNote(id)} onEdit={setEditingNote} />
            </Pressable>
          ))
        )}
      </ScrollView>

      {editingNote ? (
        <NoteComposer
          visible={editingNote !== null}
          referenceType={editingNote.referenceType}
          surahNumber={editingNote.surahNumber}
          ayahNumber={editingNote.ayahNumber}
          wordIndex={editingNote.wordIndex}
          surahName={`Surah ${editingNote.surahNumber}`}
          initialContent={editingNote.content}
          initialTags={editingNote.tags as NoteTag[]}
          onClose={() => setEditingNote(null)}
          onSave={(content, tags) => {
            void updateNote(editingNote.id, { content, tags: tags as NoteTag[] });
            setEditingNote(null);
          }}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 12,
    padding: 16,
    backgroundColor: palette.paper,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
  },
  searchInput: {
    backgroundColor: palette.white,
    borderRadius: 12,
    padding: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: palette.sand,
  },
  filterPillActive: {
    backgroundColor: palette.forest,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.smoke,
  },
  filterPillTextActive: {
    color: palette.white,
  },
  emptyText: {
    color: palette.smoke,
  },
});
