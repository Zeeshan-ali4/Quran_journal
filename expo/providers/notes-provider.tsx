import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import type { NoteAuthor, NoteItem, NoteTarget, SocialPreferences, SocialProfile, SocialRelation } from '@/types/quran';

const STORAGE_KEY = 'quran-notes';
const SOCIAL_PREFERENCES_KEY = 'quran-social-preferences';
const SOCIAL_PROFILES_KEY = 'quran-social-profiles';

const currentUser: NoteAuthor = {
  id: 'me',
  name: 'You',
  handle: '@you',
  avatar: 'Y',
  relation: 'you',
};

const defaultSocialPreferences: SocialPreferences = {
  shareNotesToFollowers: true,
  showFollowerNotes: true,
};

const socialProfilesSeed: SocialProfile[] = [
  {
    id: 'follower-zaynab',
    name: 'Zaynab Ali',
    handle: '@zaynab',
    avatar: 'Z',
    bio: 'Collector of tafsir notes, quiet fajr reader, and study-circle host.',
    city: 'Toronto',
    favoriteSurah: 'Al-Fatihah',
    followersCount: 482,
    followingCount: 119,
    notesSharedCount: 18,
    relation: 'mutual',
  },
  {
    id: 'follower-maryam',
    name: 'Maryam Noor',
    handle: '@maryam',
    avatar: 'M',
    bio: 'Building a daily Qur’an journaling habit one ayah at a time.',
    city: 'London',
    favoriteSurah: 'Maryam',
    followersCount: 316,
    followingCount: 201,
    notesSharedCount: 12,
    relation: 'following',
  },
  {
    id: 'follower-hassan',
    name: 'Hassan Idris',
    handle: '@hassan',
    avatar: 'H',
    bio: 'Memorization focused, with short reflection notes for revision sessions.',
    city: 'Abuja',
    favoriteSurah: 'Yusuf',
    followersCount: 190,
    followingCount: 78,
    notesSharedCount: 9,
    relation: 'follower',
  },
  {
    id: 'follower-safiya',
    name: 'Safiya Khan',
    handle: '@safiya',
    avatar: 'S',
    bio: 'Writes thematic notes across long surahs and shares what stands out.',
    city: 'Dubai',
    favoriteSurah: 'Al-Baqarah',
    followersCount: 521,
    followingCount: 144,
    notesSharedCount: 24,
    relation: 'mutual',
  },
  {
    id: 'follower-omar',
    name: 'Omar Suleiman',
    handle: '@omarstudy',
    avatar: 'O',
    bio: 'Reads with structure, color codes themes, and keeps concise verse notes.',
    city: 'Istanbul',
    favoriteSurah: 'Ar-Rahman',
    followersCount: 268,
    followingCount: 85,
    notesSharedCount: 14,
    relation: 'none',
  },
  {
    id: 'follower-aisha',
    name: 'Aisha Rahman',
    handle: '@aisha',
    avatar: 'A',
    bio: 'Interested in language patterns, recurring words, and practical reminders.',
    city: 'Kuala Lumpur',
    favoriteSurah: 'An-Nur',
    followersCount: 403,
    followingCount: 176,
    notesSharedCount: 16,
    relation: 'none',
  },
];

const followerNotesSeed: NoteItem[] = [
  {
    id: 'follow-1',
    target: {
      type: 'chapter',
      surahNumber: 1,
      surahName: 'Al-Fatihah',
    },
    content: 'I read this surah as a daily reset. The opening feels like intention-setting before every action.',
    createdAt: '2026-03-01T08:15:00.000Z',
    author: {
      id: 'follower-zaynab',
      name: 'Zaynab Ali',
      handle: '@zaynab',
      avatar: 'Z',
      relation: 'mutual',
    },
    isShared: true,
  },
  {
    id: 'follow-2',
    target: {
      type: 'verse',
      surahNumber: 1,
      surahName: 'Al-Fatihah',
      verseNumber: 5,
    },
    content: 'This ayah always recenters me on dependence and discipline together.',
    createdAt: '2026-03-02T19:22:00.000Z',
    author: {
      id: 'follower-maryam',
      name: 'Maryam Noor',
      handle: '@maryam',
      avatar: 'M',
      relation: 'following',
    },
    isShared: true,
  },
  {
    id: 'follow-3',
    target: {
      type: 'word',
      surahNumber: 1,
      surahName: 'Al-Fatihah',
      verseNumber: 5,
      word: 'نَعْبُدُ',
    },
    content: 'I highlighted this word because worship here feels active, not abstract.',
    createdAt: '2026-03-03T07:10:00.000Z',
    author: {
      id: 'follower-hassan',
      name: 'Hassan Idris',
      handle: '@hassan',
      avatar: 'H',
      relation: 'follower',
    },
    isShared: true,
  },
  {
    id: 'follow-4',
    target: {
      type: 'chapter',
      surahNumber: 2,
      surahName: 'Al-Baqarah',
    },
    content: 'I use this surah for long-form study and keep coming back to its rhythm of guidance and warning.',
    createdAt: '2026-03-04T21:30:00.000Z',
    author: {
      id: 'follower-safiya',
      name: 'Safiya Khan',
      handle: '@safiya',
      avatar: 'S',
      relation: 'mutual',
    },
    isShared: true,
  },
  {
    id: 'follow-5',
    target: {
      type: 'verse',
      surahNumber: 55,
      surahName: 'Ar-Rahman',
      verseNumber: 13,
    },
    content: 'This repetition feels like a pause for gratitude, not just emphasis.',
    createdAt: '2026-03-05T16:05:00.000Z',
    author: {
      id: 'follower-omar',
      name: 'Omar Suleiman',
      handle: '@omarstudy',
      avatar: 'O',
      relation: 'none',
    },
    isShared: true,
  },
  {
    id: 'follow-6',
    target: {
      type: 'chapter',
      surahNumber: 24,
      surahName: 'An-Nur',
    },
    content: 'I keep notes here around inner clarity and what it looks like in practice.',
    createdAt: '2026-03-06T09:42:00.000Z',
    author: {
      id: 'follower-aisha',
      name: 'Aisha Rahman',
      handle: '@aisha',
      avatar: 'A',
      relation: 'none',
    },
    isShared: true,
  },
];

function createNoteId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function matchesTarget(noteTarget: NoteTarget, target: NoteTarget) {
  if (noteTarget.type !== target.type) {
    return false;
  }

  if (noteTarget.surahNumber !== target.surahNumber) {
    return false;
  }

  if ((noteTarget.verseNumber ?? null) !== (target.verseNumber ?? null)) {
    return false;
  }

  return (noteTarget.word ?? null) === (target.word ?? null);
}

function parseProfiles(raw: string | null) {
  if (!raw) {
    return socialProfilesSeed;
  }

  try {
    const parsed = JSON.parse(raw) as SocialProfile[];
    if (!Array.isArray(parsed)) {
      return socialProfilesSeed;
    }

    return parsed;
  } catch (error) {
    console.log('[Social] Failed to parse social profiles payload', { error });
    return socialProfilesSeed;
  }
}

function isFollowingRelation(relation: SocialRelation) {
  return relation === 'following' || relation === 'mutual';
}

function isFollowerRelation(relation: SocialRelation) {
  return relation === 'follower' || relation === 'mutual';
}

function updateRelationOnFollow(relation: SocialRelation): SocialRelation {
  if (relation === 'follower') {
    return 'mutual';
  }

  if (relation === 'you') {
    return 'you';
  }

  return 'following';
}

function updateRelationOnUnfollow(relation: SocialRelation): SocialRelation {
  if (relation === 'mutual') {
    return 'follower';
  }

  if (relation === 'you') {
    return 'you';
  }

  return 'none';
}

export const [NotesProvider, useNotes] = createContextHook(() => {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [socialPreferences, setSocialPreferences] = useState<SocialPreferences>(defaultSocialPreferences);
  const [profiles, setProfiles] = useState<SocialProfile[]>(socialProfilesSeed);

  const notesQuery = useQuery<NoteItem[]>({
    queryKey: ['notes'],
    queryFn: async () => {
      console.log('[Notes] Loading persisted notes');
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }

      try {
        const parsed = JSON.parse(raw) as NoteItem[];
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.log('[Notes] Failed to parse notes payload', { error });
        return [];
      }
    },
  });

  const socialPreferencesQuery = useQuery<SocialPreferences>({
    queryKey: ['social-preferences'],
    queryFn: async () => {
      console.log('[Notes] Loading social preferences');
      const raw = await AsyncStorage.getItem(SOCIAL_PREFERENCES_KEY);
      if (!raw) {
        return defaultSocialPreferences;
      }

      try {
        const parsed = JSON.parse(raw) as Partial<SocialPreferences>;
        return {
          shareNotesToFollowers: parsed.shareNotesToFollowers ?? defaultSocialPreferences.shareNotesToFollowers,
          showFollowerNotes: parsed.showFollowerNotes ?? defaultSocialPreferences.showFollowerNotes,
        };
      } catch (error) {
        console.log('[Notes] Failed to parse social preferences payload', { error });
        return defaultSocialPreferences;
      }
    },
  });

  const socialProfilesQuery = useQuery<SocialProfile[]>({
    queryKey: ['social-profiles'],
    queryFn: async () => {
      console.log('[Social] Loading social profiles');
      const raw = await AsyncStorage.getItem(SOCIAL_PROFILES_KEY);
      return parseProfiles(raw);
    },
  });

  const syncNotesMutation = useMutation({
    mutationFn: async (nextNotes: NoteItem[]) => {
      console.log('[Notes] Persisting notes', { count: nextNotes.length });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextNotes));
      return nextNotes;
    },
  });

  const syncSocialPreferencesMutation = useMutation({
    mutationFn: async (nextPreferences: SocialPreferences) => {
      console.log('[Notes] Persisting social preferences', nextPreferences);
      await AsyncStorage.setItem(SOCIAL_PREFERENCES_KEY, JSON.stringify(nextPreferences));
      return nextPreferences;
    },
  });

  const syncSocialProfilesMutation = useMutation({
    mutationFn: async (nextProfiles: SocialProfile[]) => {
      console.log('[Social] Persisting social profiles', { count: nextProfiles.length });
      await AsyncStorage.setItem(SOCIAL_PROFILES_KEY, JSON.stringify(nextProfiles));
      return nextProfiles;
    },
  });

  useEffect(() => {
    if (notesQuery.data) {
      setNotes(notesQuery.data);
    }
  }, [notesQuery.data]);

  useEffect(() => {
    if (socialPreferencesQuery.data) {
      setSocialPreferences(socialPreferencesQuery.data);
    }
  }, [socialPreferencesQuery.data]);

  useEffect(() => {
    if (socialProfilesQuery.data) {
      setProfiles(socialProfilesQuery.data);
    }
  }, [socialProfilesQuery.data]);

  const addNote = useCallback(
    (target: NoteTarget, content: string, shouldShare?: boolean) => {
      const nextNote: NoteItem = {
        id: createNoteId(),
        target,
        content: content.trim(),
        createdAt: new Date().toISOString(),
        author: currentUser,
        isShared: shouldShare ?? socialPreferences.shareNotesToFollowers,
      };

      console.log('[Notes] Adding note', {
        targetType: target.type,
        surahNumber: target.surahNumber,
        verseNumber: target.verseNumber,
        isShared: nextNote.isShared,
      });

      const nextNotes = [nextNote, ...notes];
      setNotes(nextNotes);
      syncNotesMutation.mutate(nextNotes);
      return nextNote;
    },
    [notes, socialPreferences.shareNotesToFollowers, syncNotesMutation]
  );

  const deleteNote = useCallback(
    (id: string) => {
      console.log('[Notes] Deleting note', { id });
      const nextNotes = notes.filter((note) => note.id !== id);
      setNotes(nextNotes);
      syncNotesMutation.mutate(nextNotes);
    },
    [notes, syncNotesMutation]
  );

  const updateNote = useCallback(
    (id: string, content: string) => {
      console.log('[Notes] Updating note', { id });
      const nextNotes = notes.map((note) =>
        note.id === id ? { ...note, content: content.trim() } : note
      );
      setNotes(nextNotes);
      syncNotesMutation.mutate(nextNotes);
    },
    [notes, syncNotesMutation]
  );

  const setShareNotesToFollowers = useCallback(
    (value: boolean) => {
      console.log('[Notes] Toggling note sharing', { value });
      const nextPreferences: SocialPreferences = {
        ...socialPreferences,
        shareNotesToFollowers: value,
      };
      setSocialPreferences(nextPreferences);
      syncSocialPreferencesMutation.mutate(nextPreferences);
    },
    [socialPreferences, syncSocialPreferencesMutation]
  );

  const setShowFollowerNotes = useCallback(
    (value: boolean) => {
      console.log('[Notes] Toggling follower notes visibility', { value });
      const nextPreferences: SocialPreferences = {
        ...socialPreferences,
        showFollowerNotes: value,
      };
      setSocialPreferences(nextPreferences);
      syncSocialPreferencesMutation.mutate(nextPreferences);
    },
    [socialPreferences, syncSocialPreferencesMutation]
  );

  const followProfile = useCallback(
    (profileId: string) => {
      console.log('[Social] Following profile', { profileId });
      const nextProfiles = profiles.map((profile) => {
        if (profile.id !== profileId) {
          return profile;
        }

        return {
          ...profile,
          relation: updateRelationOnFollow(profile.relation),
          followersCount: profile.followersCount + (isFollowingRelation(profile.relation) ? 0 : 1),
        };
      });

      setProfiles(nextProfiles);
      syncSocialProfilesMutation.mutate(nextProfiles);
    },
    [profiles, syncSocialProfilesMutation]
  );

  const unfollowProfile = useCallback(
    (profileId: string) => {
      console.log('[Social] Unfollowing profile', { profileId });
      const nextProfiles = profiles.map((profile) => {
        if (profile.id !== profileId) {
          return profile;
        }

        return {
          ...profile,
          relation: updateRelationOnUnfollow(profile.relation),
          followersCount: Math.max(0, profile.followersCount - (isFollowingRelation(profile.relation) ? 1 : 0)),
        };
      });

      setProfiles(nextProfiles);
      syncSocialProfilesMutation.mutate(nextProfiles);
    },
    [profiles, syncSocialProfilesMutation]
  );

  const toggleFollowProfile = useCallback(
    (profileId: string) => {
      const profile = profiles.find((item) => item.id === profileId);
      if (!profile) {
        return;
      }

      if (isFollowingRelation(profile.relation)) {
        unfollowProfile(profileId);
        return;
      }

      followProfile(profileId);
    },
    [followProfile, profiles, unfollowProfile]
  );

  const following = useMemo(
    () => profiles.filter((profile) => isFollowingRelation(profile.relation)),
    [profiles]
  );

  const followers = useMemo(
    () => profiles.filter((profile) => isFollowerRelation(profile.relation)),
    [profiles]
  );

  const sharedNotes = useMemo(
    () => notes.filter((note) => note.isShared),
    [notes]
  );

  const visibleFollowerNotes = useMemo(() => {
    if (!socialPreferences.showFollowerNotes) {
      return [];
    }

    const followedProfileIds = new Set(following.map((profile) => profile.id));

    return followerNotesSeed
      .filter((note) => followedProfileIds.has(note.author.id))
      .map((note) => {
        const matchingProfile = profiles.find((profile) => profile.id === note.author.id);
        return matchingProfile
          ? {
              ...note,
              author: {
                ...note.author,
                relation: matchingProfile.relation,
              },
            }
          : note;
      });
  }, [following, profiles, socialPreferences.showFollowerNotes]);

  const socialFeed = useMemo(
    () => [...visibleFollowerNotes, ...sharedNotes].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [sharedNotes, visibleFollowerNotes]
  );

  const profileById = useMemo(() => {
    const entries = profiles.map((profile) => [profile.id, profile] as const);
    return Object.fromEntries(entries) as Record<string, SocialProfile>;
  }, [profiles]);

  const value = useMemo(
    () => ({
      notes,
      profiles,
      profileById,
      following,
      followers,
      sharedNotes,
      followerNotes: visibleFollowerNotes,
      socialFeed,
      socialPreferences,
      addNote,
      deleteNote,
      updateNote,
      setShareNotesToFollowers,
      setShowFollowerNotes,
      followProfile,
      unfollowProfile,
      toggleFollowProfile,
      isLoading:
        notesQuery.isLoading || socialPreferencesQuery.isLoading || socialProfilesQuery.isLoading,
      isSaving:
        syncNotesMutation.isPending ||
        syncSocialPreferencesMutation.isPending ||
        syncSocialProfilesMutation.isPending,
    }),
    [
      addNote,
      deleteNote,
      followProfile,
      followers,
      following,
      notes,
      notesQuery.isLoading,
      profileById,
      profiles,
      setShareNotesToFollowers,
      setShowFollowerNotes,
      sharedNotes,
      socialFeed,
      socialPreferences,
      socialPreferencesQuery.isLoading,
      socialProfilesQuery.isLoading,
      syncNotesMutation.isPending,
      syncSocialPreferencesMutation.isPending,
      syncSocialProfilesMutation.isPending,
      toggleFollowProfile,
      unfollowProfile,
      updateNote,
      visibleFollowerNotes,
    ]
  );

  return value;
});

export function useNotesForTarget(target: NoteTarget) {
  const { notes } = useNotes();

  return useMemo(() => notes.filter((note) => matchesTarget(note.target, target)), [notes, target]);
}

export function useFollowerNotesForTarget(target: NoteTarget) {
  const { followerNotes } = useNotes();

  return useMemo(
    () => followerNotes.filter((note) => matchesTarget(note.target, target)),
    [followerNotes, target]
  );
}

export function usePeopleSearch(query: string) {
  const { profiles } = useNotes();

  return useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return profiles;
    }

    return profiles.filter((profile) => {
      return (
        profile.name.toLowerCase().includes(normalizedQuery) ||
        profile.handle.toLowerCase().includes(normalizedQuery) ||
        profile.bio.toLowerCase().includes(normalizedQuery) ||
        profile.favoriteSurah.toLowerCase().includes(normalizedQuery) ||
        profile.city.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [profiles, query]);
}

export function useProfile(profileId?: string) {
  const { profiles } = useNotes();

  return useMemo(() => profiles.find((profile) => profile.id === profileId) ?? null, [profileId, profiles]);
}