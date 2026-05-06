import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, BookOpenText, MapPin, UserPlus, Users } from 'lucide-react-native';

import { NoteCard } from '@/components/note-card';
import { palette } from '@/constants/colors';
import { useNotes, useProfile } from '@/providers/notes-provider';

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const profile = useProfile(params.id);
  const { followerNotes, toggleFollowProfile } = useNotes();

  const profileNotes = useMemo(() => {
    if (!profile) {
      return [];
    }

    return followerNotes.filter((note) => note.author.id === profile.id);
  }, [followerNotes, profile]);

  const isFollowing = profile?.relation === 'following' || profile?.relation === 'mutual';

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={[palette.forest, '#314D3B', '#6A6049']} style={styles.headerBackdrop}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.iconButton} testID="profile-back-button">
              <ArrowLeft color={palette.white} size={20} />
            </Pressable>
            <Text style={styles.topBarTitle}>Profile</Text>
            <View style={styles.iconButtonPlaceholder} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} testID="profile-screen">
        {!profile ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Profile not found</Text>
            <Text style={styles.emptyBody}>Try returning to the People tab and opening a different person.</Text>
          </View>
        ) : (
          <>
            <View style={styles.heroCard}>
              <View style={[styles.avatar, isFollowing ? styles.avatarFollowing : styles.avatarIdle]}>
                <Text style={styles.avatarText}>{profile.avatar}</Text>
              </View>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.handle}>{profile.handle}</Text>
              <Text style={styles.bio}>{profile.bio}</Text>

              <View style={styles.inlineMetaRow}>
                <View style={styles.inlineMetaPill}>
                  <MapPin color={palette.olive} size={14} />
                  <Text style={styles.inlineMetaText}>{profile.city}</Text>
                </View>
                <View style={styles.inlineMetaPill}>
                  <BookOpenText color={palette.olive} size={14} />
                  <Text style={styles.inlineMetaText}>{profile.favoriteSurah}</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{profile.followersCount}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{profile.followingCount}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{profile.notesSharedCount}</Text>
                  <Text style={styles.statLabel}>Shared notes</Text>
                </View>
              </View>

              <Pressable style={[styles.followButton, isFollowing ? styles.followingButton : styles.followIdleButton]} onPress={() => toggleFollowProfile(profile.id)} testID={`profile-follow-button-${profile.id}`}>
                <UserPlus color={isFollowing ? palette.forest : palette.white} size={16} />
                <Text style={[styles.followButtonText, isFollowing ? styles.followingButtonText : styles.followIdleButtonText]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.sectionHeader}>
              <Users color={palette.forest} size={16} />
              <Text style={styles.sectionTitle}>Shared notes</Text>
            </View>

            {profileNotes.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No shared notes yet</Text>
                <Text style={styles.emptyBody}>Follow this person to see any shared notes they publish into your reading flow.</Text>
              </View>
            ) : null}

            {profileNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  headerBackdrop: {
    paddingBottom: 10,
  },
  safeArea: {
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPlaceholder: {
    width: 42,
    height: 42,
  },
  topBarTitle: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  heroCard: {
    borderRadius: 30,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 22,
    gap: 14,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFollowing: {
    backgroundColor: palette.forest,
  },
  avatarIdle: {
    backgroundColor: '#E8D8BD',
  },
  avatarText: {
    color: palette.white,
    fontSize: 28,
    fontWeight: '800',
  },
  name: {
    color: palette.ink,
    fontSize: 28,
    fontWeight: '800',
  },
  handle: {
    color: palette.smoke,
    fontSize: 15,
    fontWeight: '600',
    marginTop: -6,
  },
  bio: {
    color: palette.ink,
    fontSize: 15,
    lineHeight: 23,
  },
  inlineMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  inlineMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: '#F5EFE4',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  inlineMetaText: {
    color: palette.olive,
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#FBF6EC',
    padding: 14,
    gap: 4,
  },
  statValue: {
    color: palette.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: palette.smoke,
    fontSize: 12,
    fontWeight: '600',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    paddingVertical: 14,
  },
  followIdleButton: {
    backgroundColor: palette.forest,
  },
  followingButton: {
    backgroundColor: '#EEF4EB',
  },
  followButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  followIdleButtonText: {
    color: palette.white,
  },
  followingButtonText: {
    color: palette.forest,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  emptyCard: {
    borderRadius: 26,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 22,
    gap: 8,
  },
  emptyTitle: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyBody: {
    color: palette.smoke,
    fontSize: 14,
    lineHeight: 21,
  },
});