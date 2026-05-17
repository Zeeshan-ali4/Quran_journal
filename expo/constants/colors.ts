export const palette = {
  ink: '#16110B',
  paper: '#F6F1E7',
  sand: '#E9DCC4',
  olive: '#5E6F52',
  forest: '#203328',
  gold: '#C49A53',
  amber: '#E9B86E',
  rose: '#B7795E',
  mist: '#F9F7F2',
  smoke: '#8B8175',
  border: 'rgba(32, 51, 40, 0.12)',
  overlay: 'rgba(22, 17, 11, 0.55)',
  white: '#FFFFFF',
};

const Colors = {
  light: {
    text: palette.ink,
    background: palette.paper,
    tint: palette.forest,
    tabIconDefault: 'rgba(32, 51, 40, 0.4)',
    tabIconSelected: palette.forest,
    card: palette.mist,
    border: palette.border,
    accent: palette.gold,
    muted: palette.smoke,
    heroBodyText: 'rgba(255,255,255,0.78)',
    heroSurface: 'rgba(255,255,255,0.1)',
    heroEyebrow: '#D9C8A4',
    footerCard: '#EFE5D4',
    avatarFollower: '#E7D7BB',
    pillShared: '#EEF4EB',
    pillPrivate: '#F4ECE5',
    pillInactive: '#F3EEE4',
  },
  dark: {
    text: '#EEE3D1', background: '#0F1712', tint: '#9FB87A', tabIconDefault: 'rgba(238,227,209,0.5)', tabIconSelected: '#D6C5A4', card: '#17211A', border: 'rgba(238,227,209,0.16)', accent: '#D7AE6A', muted: '#AF9F8A', heroBodyText: 'rgba(255,245,228,0.82)', heroSurface: 'rgba(255,255,255,0.12)', heroEyebrow: '#D7C6A5', footerCard: '#1B2620', avatarFollower: '#334338', pillShared: '#243328', pillPrivate: '#312C24', pillInactive: '#2A2F27',
  },
  sepia: {
    text: '#3D2E1F', background: '#F2E7D4', tint: '#6E4D2F', tabIconDefault: 'rgba(61,46,31,0.45)', tabIconSelected: '#6E4D2F', card: '#F8F0E2', border: 'rgba(110,77,47,0.18)', accent: '#B78645', muted: '#8D7358', heroBodyText: 'rgba(255,248,236,0.84)', heroSurface: 'rgba(255,255,255,0.12)', heroEyebrow: '#E4D2B6', footerCard: '#E8D8BE', avatarFollower: '#DECCAE', pillShared: '#E8EFE2', pillPrivate: '#EFE5D8', pillInactive: '#E7DDCC',
  },
};

export type AppTheme = keyof typeof Colors;
export type ThemeColors = (typeof Colors)['light'];

export default Colors;
