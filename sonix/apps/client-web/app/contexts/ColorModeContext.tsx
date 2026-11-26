import type {PaletteMode} from '@mui/material';
import {createContext, useCallback, useContext, useMemo, useState} from 'react';

type ColorModeContextType = {
  mode: PaletteMode;
  toggleColorMode: () => void;
};

export const ColorModeContext = createContext<ColorModeContextType>({
  mode: 'light',
  toggleColorMode: () => {},
});

export function useColorMode() {
  return useContext(ColorModeContext);
}

const STORAGE_KEY = 'ids_color_mode';

function getInitialMode(): PaletteMode {
  if (typeof window === 'undefined') {
    return 'light';
  }
  return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

export function ColorModeProvider({children}: {children: React.ReactNode}) {
  const [mode, setMode] = useState<PaletteMode>(getInitialMode);

  const toggleColorMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({mode, toggleColorMode}), [mode, toggleColorMode]);

  return <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>;
}
