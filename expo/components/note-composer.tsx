import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Eye, EyeOff, Share2 } from 'lucide-react-native';

import { palette } from '@/constants/colors';
import type { NoteTarget } from '@/types/quran';

interface NoteComposerProps {
  visible: boolean;
  target: NoteTarget | null;
  defaultShareEnabled: boolean;
  onClose: () => void;
  onSave: (content: string, shouldShare: boolean) => void;
}

function getTargetLabel(target: NoteTarget | null) {
  if (!target) {
    return '';
  }

  if (target.type === 'chapter') {
    return `Surah ${target.surahNumber} · ${target.surahName}`;
  }

  if (target.type === 'verse') {
    return `Ayah ${target.verseNumber} · ${target.surahName}`;
  }

  return `${target.word} · Ayah ${target.verseNumber}`;
}

export function NoteComposer({
  visible,
  target,
  defaultShareEnabled,
  onClose,
  onSave,
}: NoteComposerProps) {
  const [content, setContent] = useState<string>('');
  const [shareWithFollowers, setShareWithFollowers] = useState<boolean>(defaultShareEnabled);

  useEffect(() => {
    if (!visible) {
      setContent('');
      setShareWithFollowers(defaultShareEnabled);
    }
  }, [defaultShareEnabled, visible]);

  useEffect(() => {
    if (visible) {
      setShareWithFollowers(defaultShareEnabled);
    }
  }, [defaultShareEnabled, visible]);

  const label = useMemo(() => getTargetLabel(target), [target]);

  const handleSave = () => {
    if (!content.trim()) {
      return;
    }

    void Haptics.selectionAsync();
    onSave(content, shareWithFollowers);
    setContent('');
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardShell}
        >
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

            <Pressable
              onPress={() => setShareWithFollowers((current) => !current)}
              style={styles.visibilityCard}
              testID="note-share-toggle"
            >
              <View style={styles.visibilityIconBadge}>
                {shareWithFollowers ? (
                  <Share2 color={palette.forest} size={16} />
                ) : (
                  <EyeOff color={palette.rose} size={16} />
                )}
              </View>
              <View style={styles.visibilityTextWrap}>
                <Text style={styles.visibilityTitle}>
                  {shareWithFollowers ? 'Shared with followers' : 'Private note'}
                </Text>
                <Text style={styles.visibilityBody}>
                  {shareWithFollowers
                    ? 'Followers you trust can see this reflection in their feed.'
                    : 'Only you can see this note.'}
                </Text>
              </View>
              <View style={[styles.pill, shareWithFollowers ? styles.pillActive : styles.pillInactive]}>
                {shareWithFollowers ? (
                  <Eye color={palette.white} size={14} />
                ) : (
                  <EyeOff color={palette.smoke} size={14} />
                )}
              </View>
            </Pressable>

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
  overlay: {
    flex: 1,
    backgroundColor: palette.overlay,
    justifyContent: 'flex-end',
  },
  keyboardShell: {
    width: '100%',
  },
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
    backgroundColor: 'rgba(32, 51, 40, 0.18)',
    marginBottom: 4,
  },
  eyebrow: {
    color: palette.rose,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  title: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
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
  visibilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 24,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
  },
  visibilityIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: palette.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visibilityTextWrap: {
    flex: 1,
    gap: 4,
  },
  visibilityTitle: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  visibilityBody: {
    color: palette.smoke,
    fontSize: 13,
    lineHeight: 19,
  },
  pill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: palette.forest,
  },
  pillInactive: {
    backgroundColor: '#F3EEE4',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: palette.white,
  },
  secondaryButtonText: {
    color: palette.ink,
    fontWeight: '600',
    fontSize: 15,
  },
  primaryButton: {
    flex: 1.3,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: palette.forest,
  },
  primaryButtonText: {
    color: palette.white,
    fontWeight: '700',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
});
