import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  darkMode: boolean;
  onboardingDone: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  toggleDarkMode: () => void;
  setOnboardingDone: () => void;
}

function applyDark(dark: boolean) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}

const savedDark = typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark';

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  darkMode: savedDark,
  onboardingDone: typeof window !== 'undefined' && !!localStorage.getItem('onboarding-done'),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleDarkMode: () => set((s) => {
    const next = !s.darkMode;
    applyDark(next);
    return { darkMode: next };
  }),
  setOnboardingDone: () => {
    if (typeof window !== 'undefined') localStorage.setItem('onboarding-done', '1');
    set({ onboardingDone: true });
  },
}));
