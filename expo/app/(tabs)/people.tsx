import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ArrowUpRight, Search, UserPlus, Users } from 'lucide-react-native';

import { palette } from '@/constants/colors';
import { useNotes, usePeopleSearch } from '@/providers/notes-provider';
import type { SocialProfile } from '@/types/quran';

function ProfileCard({
  profile,
  onPress,
  onToggleFollow,
}: {
  profile: SocialProfile;
  onPress: () => void;
  onToggleFollow: () => void;
}) {
  const isFollowing = profile.relation === 'following' || profile.relation === 'mutual';

  return (
    <Pressable style={styles.profileCard} onPress={onPress} testID={`profile-card-${profile.id}`}>
      <View style={styles.profileHeaderRow}>
        <View style={[styles.avatar, isFollowing ? styles.avatarFollowing : styles.avatarIdle]}>
          <Text style={styles.avatarText}>{profile.avatar}</Text>
        </View>
        <View style={styles.profileTextWrap}>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileHandle}>{profile.handle}</Text>
        </View>
        <ArrowUpRight color={palette.smoke} size={18} />
      </View>

      <Text style={styles.profileBio}>{profile.bio}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <Text style={styles.metaPillText}>{profile.city}</Text>
        </View>
        <View style={styles.metaPill}>
          <Text style={styles.metaPillText}>{profile.favoriteSurah}</Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.countText}>{profile.followersCount} followers</Text>
        <Pressable style={[styles.followButton, isFollowing ? styles.followingButton : styles.followIdleButton]} onPress={onToggleFollow} testID={`toggle-follow-${profile.id}`}>
          <UserPlus color={isFollowing ? palette.forest : palette.white} size={14} />
          <Text style={[styles.followButtonText, isFollowing ? styles.followingButtonText : styles.followIdleButtonText]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function PeopleScreen() {
  const router = useRouter();
  const [query, setQuery] = useState<string>('');
  const { following, followers, toggleFollowProfile } = useNotes();
  const profiles = usePeopleSearch(query);

  const featuredProfiles = useMemo(() => profiles.slice(0, 8), [profiles]);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} testID="people-screen">
          <LinearGradient colors={['#203328', '#314D3B', '#6A6049']} style={styles.hero}>
            <View style={styles.heroBadge}>
              <Users color={palette.white} size={18} />
            </View>
            <Text style={styles.heroTitle}>Find people whose reflections you want in your reading flow.</Text>
            <Text style={styles.heroBody}>
              Search by name, handle, city, or favorite surah. Follow people to bring their shared notes into your study space.
            </Text>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatPill}>
                <Text style={styles.heroStatValue}>{following.length}</Text>
                <Text style={styles.heroStatLabel}>Following</Text>
              </View>
              <View style={styles.heroStatPill}>
                <Text style={styles.heroStatValue}>{followers.length}</Text>
                <Text style={styles.heroStatLabel}>Followers</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.searchShell}>
            <Search color={palette.smoke} size={18} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search people or favorite surah"
              placeholderTextColor={palette.smoke}
              style={styles.searchInput}
              testID="people-search-input"
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{query.trim() ? 'Search results' : 'Suggested people'}</Text>
            <Text style={styles.sectionMeta}>{featuredProfiles.length} shown</Text>
          </View>

          {featuredProfiles.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No people found</Text>
              <Text style={styles.emptyBody}>Try another name, handle, city, or surah.</Text>
            </View>
          ) : null}

          {featuredProfiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onPress={() => router.push({ pathname: '/profile/[id]', params: { id: profile.id } })}
              onToggleFollow={() => toggleFollowProfile(profile.id)}
            />
          ))}
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
    paddingBottom: 36,
    gap: 16,
  },
  hero: {
    borderRadius: 30,
    padding: 22,
    gap: 12,
  },
  heroBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: palette.white,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  heroBody: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    lineHeight: 22,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  heroStatPill: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: 14,
    gap: 2,
  },
  heroStatValue: {
    color: palette.white,
    fontSize: 20,
    fontWeight: '800',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    fontWeight: '600',
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 22,
    backgroundColor: palette.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: palette.ink,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  sectionMeta: {
    color: palette.smoke,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyCard: {
    borderRadius: 24,
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
  profileCard: {
    borderRadius: 28,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 18,
    gap: 14,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
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
    fontSize: 18,
    fontWeight: '800',
  },
  profileTextWrap: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  profileHandle: {
    color: palette.smoke,
    fontSize: 13,
    fontWeight: '600',
  },
  profileBio: {
    color: palette.ink,
    fontSize: 14,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaPill: {
    borderRadius: 999,
    backgroundColor: '#F5EFE4',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaPillText: {
    color: palette.olive,
    fontSize: 12,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  countText: {
    color: palette.smoke,
    fontSize: 13,
    fontWeight: '600',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  followIdleButton: {
    backgroundColor: palette.forest,
  },
  followingButton: {
    backgroundColor: '#EEF4EB',
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  followIdleButtonText: {
    color: palette.white,
  },
  followingButtonText: {
    color: palette.forest,
  },
});