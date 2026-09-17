import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { themes, type Theme } from './tokens';
import { useSettingsStore } from '@/stores/settings';

const ThemeContext = createContext<Theme>(themes.light);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const override = useSettingsStore((s) => s.appearance);
  const scheme = override !== 'system' ? override : system === 'dark' ? 'dark' : 'light';
  const theme = useMemo(() => themes[scheme], [scheme]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
