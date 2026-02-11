'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/lib/store/ui-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  useEffect(() => {
    setMounted(true);
    useUIStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const stored = window.localStorage.getItem('polymarket-trader-ui');
    if (!stored) {
      setTheme('light');
    }
  }, [mounted, setTheme]);

  useEffect(() => {
    if (!mounted || typeof document === 'undefined') return;

    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [mounted, theme]);

  return <>{children}</>;
}
