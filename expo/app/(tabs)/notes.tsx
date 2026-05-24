import React, { useState } from 'react';
import { router } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { palette } from '@/constants/colors';
import { useNotes } from '@/providers/notes-provider';

export default function NotesScreen() {
  const { searchNotes, isLoading, deleteNote } = useNotes();
  const [query, setQuery] = useState('');
  const results = searchNotes(query);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>My Reflection Notes</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search notes offline"
        value={query}
        onChangeText={setQuery}
      />

      {isLoading ? <Text>Loading notes…</Text> : null}

      {results.length === 0 ? (
        <Text style={styles.emptyText}>No notes yet. Open a surah and tap an ayah to reflect.</Text>
      ) : (
        results.map((note) => (
          <Pressable
            key={note.id}
            style={styles.card}
            onPress={() => router.push({ pathname: '/surah/[id]', params: { id: String(note.surahNumber), ayah: note.ayahNumber ? String(note.ayahNumber) : undefined } })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.metaText}>
                Surah {note.surahNumber}{note.ayahNumber ? ` Ayah ${note.ayahNumber}` : ''}
              </Text>
              <Pressable onPress={() => void deleteNote(note.id)} hitSlop={8}>
                <Trash2 size={16} color={palette.smoke} />
              </Pressable>
            </View>
            <Text>{note.content}</Text>
            <Text style={styles.metaText}>{note.tags.join(', ') || 'untagged'}</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
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
  card: {
    backgroundColor: palette.white,
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaText: {
    color: palette.smoke,
    fontSize: 12,
  },
  emptyText: {
    color: palette.smoke,
  },
});
