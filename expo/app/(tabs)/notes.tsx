import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { palette } from '@/constants/colors';
import { useNotes } from '@/providers/notes-provider';

export default function NotesScreen() {
  const { searchNotes, isLoading } = useNotes();
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
          <View key={note.id} style={styles.card}>
            <Text style={styles.metaText}>
              Surah {note.surahNumber} Ayah {note.ayahNumber}
            </Text>
            <Text>{note.content}</Text>
            <Text style={styles.metaText}>{note.tags.join(', ') || 'untagged'}</Text>
          </View>
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
  metaText: {
    color: palette.smoke,
    fontSize: 12,
  },
  emptyText: {
    color: palette.smoke,
  },
});
