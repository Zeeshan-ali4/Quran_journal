import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { palette } from '@/constants/colors';
import type { NoteTag } from '@/types/quran';

const TAG_OPTIONS: NoteTag[] = ['reflection', 'action', 'question', "du'a", 'theme'];

interface NoteComposerProps {
  visible: boolean;
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  onClose: () => void;
  onSave: (content: string, tags: string[]) => void;
}

export function NoteComposer({ visible, surahNumber, ayahNumber, surahName, onClose, onSave }: NoteComposerProps) {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<NoteTag[]>(['reflection']);

  useEffect(() => {
    if (!visible) {
      setContent('');
      setTags(['reflection']);
    }
  }, [visible]);

  const label = useMemo(() => `Surah ${surahNumber}:${ayahNumber} · ${surahName}`, [ayahNumber, surahName, surahNumber]);

  const toggleTag = (tag: NoteTag) => {
    setTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  };

  const handleSave = () => {
    if (!content.trim()) {
      return;
    }

    void Haptics.selectionAsync();
    onSave(content, tags);
    setContent('');
    setTags(['reflection']);
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardShell}>
          <View style={styles.sheet}>
            <View style={styles.grabber} />
            <Text style={styles.eyebrow}>New note</Text>
            <Text style={styles.title}>{label}</Text>
            <TextInput
              multiline
              autoFocus
              placeholder="Write a reflection, tafsir insight, memorization cue, or a personal dua..."
              placeholderTextColor={palette.smoke}
              style={styles.input}
              value={content}
              onChangeText={setContent}
              testID="note-composer-input"
            />

            <View style={styles.tagsRow}>
              {TAG_OPTIONS.map((tag) => {
                const selected = tags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    style={[styles.tagChip, selected ? styles.tagChipSelected : null]}
                    testID={`note-tag-${tag}`}
                  >
                    <Text style={[styles.tagText, selected ? styles.tagTextSelected : null]}>{tag}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.actions}>
              <Pressable onPress={onClose} style={styles.secondaryButton} testID="note-cancel-button">
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={[styles.primaryButton, !content.trim() ? styles.buttonDisabled : null]}
                disabled={!content.trim()}
                testID="note-save-button"
              >
                <Text style={styles.primaryButtonText}>Save note</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: palette.overlay, justifyContent: 'flex-end' },
  keyboardShell: { width: '100%' },
  sheet: {
    backgroundColor: palette.paper,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    gap: 14,
  },
  grabber: {
    alignSelf: 'center',
    width: 56,
    height: 5,
    borderRadius: 999,
    backgroundColor: palette.border,
    marginBottom: 4,
  },
  eyebrow: { color: palette.rose, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.1 },
  title: { color: palette.ink, fontSize: 22, fontWeight: '700', lineHeight: 28 },
  input: {
    minHeight: 180,
    borderRadius: 24,
    backgroundColor: palette.white,
    padding: 18,
    color: palette.ink,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { borderRadius: 999, backgroundColor: palette.mist, paddingHorizontal: 12, paddingVertical: 8 },
  tagChipSelected: { backgroundColor: palette.sand },
  tagText: { color: palette.smoke, fontWeight: '600' },
  tagTextSelected: { color: palette.forest, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12 },
  secondaryButton: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: palette.white,
  },
  secondaryButtonText: { color: palette.ink, fontWeight: '600', fontSize: 15 },
  primaryButton: {
    flex: 1.3,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: palette.forest,
  },
  primaryButtonText: { color: palette.white, fontWeight: '700', fontSize: 15 },
  buttonDisabled: { opacity: 0.45 },
});
