import { create } from 'zustand';

export type Appearance = 'system' | 'light' | 'dark';

interface SettingsState {
  appearance: Appearance;
  setAppearance: (a: Appearance) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  appearance: 'system',
  setAppearance: (appearance) => set({ appearance }),
}));
