import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { NoteCard } from '@/components/note-card';
import { NoteComposer } from '@/components/note-composer';
import { palette } from '@/constants/colors';
import { REFLECTION_PROMPTS } from '@/constants/reflection-prompts';
import { fetchSurahDetail } from '@/data/api/quran';
import { useNotes } from '@/providers/notes-provider';
import type { NoteTag, UserNote } from '@/types/quran';

function AyahCard({ arabic, translation, onPress }: { arabic: string; translation: string; onPress: () => void }) {
  return (
    <Pressable style={styles.ayahCard} onPress={onPress}>
      <Text style={styles.arabic}>{arabic}</Text>
      <Text>{translation}</Text>
    </Pressable>
  );
}

function ReflectionPanel({ selectedAyah, onPromptPress, onOpenComposer }: {
  selectedAyah: number;
  onPromptPress: (prompt: string) => void;
  onOpenComposer: () => void;
}) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Ayah {selectedAyah} — My Reflection</Text>
      <View style={styles.promptsRow}>
        {REFLECTION_PROMPTS.map((prompt, index) => (
          <Pressable key={prompt} style={styles.promptChip} onPress={() => onPromptPress(prompt)} testID={`prompt-chip-${index}`}>
            <Text style={styles.promptText}>{prompt}</Text>
          </Pressable>
        ))}
      </View>
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
  const [composerInitialContent, setComposerInitialContent] = useState('');
  const [composerInitialTags, setComposerInitialTags] = useState<NoteTag[] | undefined>(undefined);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const { notesForAyah, addNote, updateNote, deleteNote } = useNotes();

  const selectedNotes = selectedAyah ? notesForAyah(surahNumber, selectedAyah) : [];

  const openComposer = () => {
    setEditingNoteId(null);
    setComposerInitialContent('');
    setComposerInitialTags(undefined);
    setComposerVisible(true);
  };

  const handlePromptPress = (prompt: string) => {
    const promptContent = `${prompt}\n\n`;
    setEditingNoteId(null);
    setComposerInitialTags(undefined);
    setComposerInitialContent((current) => (current ? `${current}\n\n${promptContent}` : promptContent));
    setComposerVisible(true);
  };

  const handleEditNote = (note: UserNote) => {
    setEditingNoteId(note.id);
    setComposerInitialContent(note.content);
    setComposerInitialTags(note.tags);
    setComposerVisible(true);
  };

  const handleSaveNote = (content: string, tags: string[]) => {
    if (!selectedAyah) {
      return;
    }

    if (editingNoteId) {
      void updateNote(editingNoteId, { content, tags: tags as NoteTag[] });
      setEditingNoteId(null);
    } else {
      void addNote({
        referenceType: 'ayah',
        surahNumber,
        ayahNumber: selectedAyah,
        content,
        tags: tags as NoteTag[],
      });
    }

    setComposerInitialContent('');
    setComposerInitialTags(undefined);
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
          <ReflectionPanel selectedAyah={selectedAyah} onPromptPress={handlePromptPress} onOpenComposer={openComposer} />

          {selectedNotes.map((note) => (
            <NoteRow key={note.id}>
              <NoteCard note={note} onDelete={deleteNote} onEdit={handleEditNote} />
            </NoteRow>
          ))}
        </>
      ) : null}

      <NoteComposer
        visible={composerVisible}
        surahNumber={surahNumber}
        ayahNumber={selectedAyah ?? 1}
        surahName={query.data?.englishName || 'Surah'}
        initialContent={composerInitialContent}
        initialTags={composerInitialTags}
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
  promptsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  promptChip: {
    borderRadius: 999,
    backgroundColor: palette.sand,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  promptText: {
    color: palette.forest,
    fontWeight: '600',
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
