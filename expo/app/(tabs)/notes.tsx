import React from 'react';
import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff, NotebookPen, Share2, Users } from 'lucide-react-native';

import { NoteCard } from '@/components/note-card';
import { palette } from '@/constants/colors';
import { useNotes } from '@/providers/notes-provider';

function PreferenceToggle({
  title,
  body,
  enabled,
  onPress,
  testID,
}: {
  title: string;
  body: string;
  enabled: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.preferenceCard} testID={testID}>
      <View style={[styles.preferenceIcon, enabled ? styles.preferenceIconActive : styles.preferenceIconMuted]}>
        {enabled ? <Eye color={palette.white} size={16} /> : <EyeOff color={palette.smoke} size={16} />}
      </View>
      <View style={styles.preferenceTextWrap}>
        <Text style={styles.preferenceTitle}>{title}</Text>
        <Text style={styles.preferenceBody}>{body}</Text>
      </View>
      <View style={[styles.preferencePill, enabled ? styles.preferencePillOn : styles.preferencePillOff]}>
        <Text style={[styles.preferencePillText, enabled ? styles.preferencePillTextOn : styles.preferencePillTextOff]}>
          {enabled ? 'On' : 'Off'}
        </Text>
      </View>
    </Pressable>
  );
}

export default function NotesScreen() {
  const {
    notes,
    followerNotes,
    socialFeed,
    socialPreferences,
    deleteNote,
    setShareNotesToFollowers,
    setShowFollowerNotes,
    isLoading,
  } = useNotes();

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} testID="notes-screen">
          <View style={styles.hero}>
            <View style={styles.iconBadge}>
              <NotebookPen color={palette.forest} size={22} />
            </View>
            <Text style={styles.heroTitle}>Your notes, shared with intention</Text>
            <Text style={styles.heroBody}>
              Keep private reflections for yourself, or let trusted followers learn from the notes you choose to share.
            </Text>
            <View style={styles.heroStats}>
              <View style={styles.statPill}>
                <Share2 color={palette.forest} size={14} />
                <Text style={styles.statPillText}>{notes.filter((note) => note.isShared).length} shared</Text>
              </View>
              <View style={styles.statPill}>
                <Users color={palette.forest} size={14} />
                <Text style={styles.statPillText}>{followerNotes.length} from followers</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Sharing preferences</Text>
            <PreferenceToggle
              title="Share my new notes to followers"
              body="You can still make any individual note private before saving it."
              enabled={socialPreferences.shareNotesToFollowers}
              onPress={() => setShareNotesToFollowers(!socialPreferences.shareNotesToFollowers)}
              testID="share-preference-toggle"
            />
            <PreferenceToggle
              title="Show follower notes in the app"
              body="Turn this off when you want a quieter, fully personal reading experience."
              enabled={socialPreferences.showFollowerNotes}
              onPress={() => setShowFollowerNotes(!socialPreferences.showFollowerNotes)}
              testID="followers-visibility-toggle"
            />
          </View>

          {isLoading ? <Text style={styles.helperText}>Loading your saved notes…</Text> : null}

          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>From people you follow</Text>
            {!socialPreferences.showFollowerNotes ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Follower notes are hidden</Text>
                <Text style={styles.emptyBody}>Turn them back on anytime from the controls above.</Text>
              </View>
            ) : null}

            {socialPreferences.showFollowerNotes && followerNotes.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No follower notes yet</Text>
                <Text style={styles.emptyBody}>When people you follow share reflections, they&apos;ll appear here.</Text>
              </View>
            ) : null}

            {socialPreferences.showFollowerNotes
              ? socialFeed
                  .filter((note) => note.author.relation === 'following' || note.author.relation === 'mutual')
                  .map((note) => <NoteCard key={note.id} note={note} />)
              : null}
          </View>

          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Your study notes</Text>
            {!isLoading && notes.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No notes yet</Text>
                <Text style={styles.emptyBody}>
                  Open any surah and tap “Chapter note”, “Ayah note”, or a highlighted word to begin.
                </Text>
              </View>
            ) : null}

            {notes.map((note) => (
              <NoteCard key={note.id} note={note} onDelete={deleteNote} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
    gap: 16,
  },
  hero: {
    backgroundColor: '#F0E5D2',
    borderRadius: 30,
    padding: 22,
    gap: 10,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: 'rgba(32, 51, 40, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: palette.ink,
    fontSize: 28,
    fontWeight: '800',
  },
  heroBody: {
    color: palette.smoke,
    fontSize: 15,
    lineHeight: 23,
  },
  heroStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  statPillText: {
    color: palette.forest,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionWrap: {
    gap: 12,
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  preferenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 26,
    padding: 16,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
  },
  preferenceIcon: {
    width: 40,
    height: 40,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preferenceIconActive: {
    backgroundColor: palette.forest,
  },
  preferenceIconMuted: {
    backgroundColor: '#F4ECE5',
  },
  preferenceTextWrap: {
    flex: 1,
    gap: 4,
  },
  preferenceTitle: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  preferenceBody: {
    color: palette.smoke,
    fontSize: 13,
    lineHeight: 19,
  },
  preferencePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  preferencePillOn: {
    backgroundColor: '#EAF2E7',
  },
  preferencePillOff: {
    backgroundColor: '#F4ECE5',
  },
  preferencePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  preferencePillTextOn: {
    color: palette.forest,
  },
  preferencePillTextOff: {
    color: palette.smoke,
  },
  helperText: {
    color: palette.smoke,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
  emptyCard: {
    marginTop: 2,
    borderRadius: 26,
    padding: 22,
    gap: 8,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
  },
  emptyTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyBody: {
    color: palette.smoke,
    fontSize: 14,
    lineHeight: 22,
  },
});