'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <MUIThemeWrapper>{children}</MUIThemeWrapper>
    </NextThemesProvider>
  );
}

function MUIThemeWrapper({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Wymuszamy domyślny wygląd dopóki się nie zamontuje komponent (uniknięcie hydration mismatch)
  const isDark = mounted ? resolvedTheme === 'dark' : false;

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDark ? 'dark' : 'light',
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#9c27b0',
          },
        },
      }),
    [isDark]
  );

  // Dodajemy klucz (key), by wymusić przerysowanie po hydracji (lub można też po prostu nic nie renderować zanim 'mounted' nie jest true, ale tu chcemy minimalizować opóźnienie)
  // Przekazanie children od razu jest lepsze dla SEO
  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}
