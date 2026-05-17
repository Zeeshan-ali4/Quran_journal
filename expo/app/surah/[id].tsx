import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { palette } from '@/constants/colors';
import { fetchSurahDetail } from '@/data/api/quran';
import { NoteCard } from '@/components/note-card';
import { NoteComposer } from '@/components/note-composer';
import { useNotes } from '@/providers/notes-provider';
import type { NoteTag } from '@/types/quran';

const PROMPTS = [
  'What does this ayah teach me about Allah?',
  'What action can I take from this ayah?',
  'What guidance, warning, or comfort is here?',
  'What question do I want to study further?',
];

function AyahCard({ arabic, translation, onPress }: { arabic: string; translation: string; onPress: () => void }) {
  return (
    <Pressable style={styles.ayahCard} onPress={onPress}>
      <Text style={styles.arabic}>{arabic}</Text>
      <Text>{translation}</Text>
    </Pressable>
  );
}

function ReflectionPanel({ selectedAyah, onOpenComposer }: { selectedAyah: number; onOpenComposer: () => void }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Ayah {selectedAyah} — My Reflection</Text>
      {PROMPTS.map((prompt) => (
        <Text key={prompt} style={styles.prompt}>
          • {prompt}
        </Text>
      ))}
      <Pressable onPress={onOpenComposer}>
        <Text style={styles.buttonText}>Add Reflection Note</Text>
      </Pressable>
    </View>
  );
}

function NoteRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.noteRow}>{children}</View>;
}

export default function SurahScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const surahNumber = Number(id || 1);
  const query = useQuery({
    queryKey: ['surah', surahNumber],
    queryFn: () => fetchSurahDetail(surahNumber),
  });

  const [selectedAyah, setSelectedAyah] = useState<number | null>(null);
  const [composerVisible, setComposerVisible] = useState(false);
  const { notesForAyah, addNote, deleteNote } = useNotes();

  const selectedNotes = selectedAyah ? notesForAyah(surahNumber, selectedAyah) : [];

  const handleSaveNote = (content: string, tags: string[]) => {
    if (!selectedAyah) {
      return;
    }

    addNote({
      referenceType: 'ayah',
      surahNumber,
      ayahNumber: selectedAyah,
      content,
      tags: tags as NoteTag[],
    });
    setComposerVisible(false);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{query.data?.englishName || 'Surah'}</Text>

      {query.data?.verses.map((verse) => (
        <AyahCard
          key={verse.numberInSurah}
          arabic={verse.arabic}
          translation={verse.translation}
          onPress={() => setSelectedAyah(verse.numberInSurah)}
        />
      ))}

      {selectedAyah ? (
        <>
          <ReflectionPanel selectedAyah={selectedAyah} onOpenComposer={() => setComposerVisible(true)} />

          {selectedNotes.map((note) => (
            <NoteRow key={note.id}>
              <NoteCard note={note} onDelete={deleteNote} />
            </NoteRow>
          ))}
        </>
      ) : null}

      <NoteComposer
        visible={composerVisible}
        surahNumber={surahNumber}
        ayahNumber={selectedAyah ?? 1}
        surahName={query.data?.englishName || 'Surah'}
        onClose={() => setComposerVisible(false)}
        onSave={handleSaveNote}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  content: {
    padding: 16,
    gap: 10,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
  },
  ayahCard: {
    backgroundColor: palette.white,
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  arabic: {
    fontSize: 22,
    textAlign: 'right',
  },
  panel: {
    backgroundColor: palette.mist,
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  title: {
    fontWeight: '700',
  },
  prompt: {
    color: palette.smoke,
  },
  buttonText: {
    backgroundColor: palette.forest,
    color: palette.white,
    padding: 10,
    borderRadius: 8,
    overflow: 'hidden',
    textAlign: 'center',
  },
  noteRow: {
    borderRadius: 8,
  },
});
