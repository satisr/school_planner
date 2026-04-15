'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import IconButton from '@mui/material/IconButton';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import Tooltip from '@mui/material/Tooltip';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Uniknięcie błędu hydracji
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Rendrujemy pusty element w tych samych wymiarach, żeby uniknąć layout shift
    return <IconButton disabled sx={{ width: 40, height: 40 }} />;
  }

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <Tooltip title={isDark ? "Przełącz na tryb jasny" : "Przełącz na tryb ciemny"}>
      <IconButton onClick={toggleTheme} color="inherit" aria-label="Zmień motyw">
        {isDark ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
