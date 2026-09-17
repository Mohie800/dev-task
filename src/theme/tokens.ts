/**
 * DevTask design tokens.
 * Visual direction: Linear / Things / Raycast restraint — hairline borders,
 * minimal shadow, color used for MEANING only (status), never decoration.
 */

export type StatusKey = 'todo' | 'in_progress' | 'blocked' | 'done' | 'overdue';

export interface Colors {
  bg: string;
  bgSubtle: string;
  elevated: string;
  overlay: string;

  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  border: string;
  borderStrong: string;

  accent: string;
  accentSoft: string;

  status: Record<StatusKey, string>;
  statusSoft: Record<StatusKey, string>;
}

export type Theme = {
  colors: Colors;
  spacing: typeof spacing;
  radius: typeof radius;
  type: typeof typeScale;
  shadows: typeof shadows;
};

// ---------- Color ----------

const status: Record<StatusKey, string> = {
  todo: '#8B8D98',
  in_progress: '#2F7CF6',
  blocked: '#E8833A',
  done: '#2FA36B',
  overdue: '#DE3B40',
};

const lightColors: Colors = {
  bg: '#FFFFFF',
  bgSubtle: '#F6F7F8',
  elevated: '#FFFFFF',
  overlay: 'rgba(15, 16, 20, 0.44)',

  text: '#17181C',
  textSecondary: '#5A5C66',
  textTertiary: '#8B8D98',
  textInverse: '#FFFFFF',

  border: '#E9EAEE',
  borderStrong: '#D8DAE1',

  accent: '#2F7CF6',
  accentSoft: 'rgba(47, 124, 246, 0.10)',

  status,
  statusSoft: {
    todo: 'rgba(139, 141, 152, 0.12)',
    in_progress: 'rgba(47, 124, 246, 0.12)',
    blocked: 'rgba(232, 131, 58, 0.14)',
    done: 'rgba(47, 163, 107, 0.13)',
    overdue: 'rgba(222, 59, 64, 0.12)',
  },
};

const darkColors: Colors = {
  bg: '#0E0F12',
  bgSubtle: '#15171C',
  elevated: '#1A1C22',
  overlay: 'rgba(0, 0, 0, 0.6)',

  text: '#F2F3F5',
  textSecondary: '#9BA0AB',
  textTertiary: '#636874',
  textInverse: '#101114',

  border: '#232630',
  borderStrong: '#2F333F',

  accent: '#4F8FF8',
  accentSoft: 'rgba(79, 143, 248, 0.14)',

  status,
  statusSoft: {
    todo: 'rgba(155, 160, 171, 0.14)',
    in_progress: 'rgba(79, 143, 248, 0.16)',
    blocked: 'rgba(235, 145, 74, 0.16)',
    done: 'rgba(64, 179, 122, 0.16)',
    overdue: 'rgba(232, 91, 95, 0.16)',
  },
};

// ---------- Spacing (4pt grid) ----------

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

// ---------- Radius ----------

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
} as const;

// ---------- Typography ----------

const inter = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export const typeScale = {
  font: inter,
  display: { fontSize: 28, lineHeight: 34, fontFamily: inter.extrabold },
  title1: { fontSize: 22, lineHeight: 28, fontFamily: inter.bold },
  title2: { fontSize: 17, lineHeight: 24, fontFamily: inter.semibold },
  headline: { fontSize: 15, lineHeight: 20, fontFamily: inter.semibold },
  body: { fontSize: 15, lineHeight: 21, fontFamily: inter.regular },
  callout: { fontSize: 14, lineHeight: 19, fontFamily: inter.regular },
  calloutMedium: { fontSize: 14, lineHeight: 19, fontFamily: inter.medium },
  subhead: { fontSize: 13, lineHeight: 18, fontFamily: inter.regular },
  subheadMedium: { fontSize: 13, lineHeight: 18, fontFamily: inter.medium },
  footnote: { fontSize: 12, lineHeight: 16, fontFamily: inter.medium },
  caption: { fontSize: 11, lineHeight: 14, fontFamily: inter.medium },
} as const;

// ---------- Shadows (restrained) ----------

export const shadows = {
  card: {
    shadowColor: '#0F1014',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sheet: {
    shadowColor: '#0F1014',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
  fab: {
    shadowColor: '#0F1014',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
} as const;

export const themes = {
  light: { colors: lightColors, spacing, radius, type: typeScale, shadows },
  dark: { colors: darkColors, spacing, radius, type: typeScale, shadows },
} as const;
