import type {LogtoConfig} from '@logto/react';
import {LogtoProvider, UserScope} from '@logto/react';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import {ThemeProvider} from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import {useEffect, useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import type {LinksFunction, MetaFunction} from 'react-router';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from 'react-router';
import {AppLoading} from './components/AppLoading';
import {ColorModeProvider, useColorMode} from './contexts/ColorModeContext';
import {API_CONFIG} from './core/config/api';
import {AUTH_CONFIG} from './core/config/auth';
import {AuthProvider} from './core/contexts/auth/AuthProvider';
import {LocationChangeGuardProvider} from './core/contexts/location/LocationChangeGuardContext';
import {LocationProvider} from './core/contexts/location/LocationProvider';
import {QueryProvider} from './core/queries/QueryProvider';
import {createAppTheme} from './theme';
import './i18n';

const logtoConfig: LogtoConfig = {
  endpoint: AUTH_CONFIG.endpoint,
  appId: AUTH_CONFIG.appId,
  resources: [API_CONFIG.resourceIdentifier],
  scopes: [UserScope.Organizations, UserScope.OrganizationRoles],
};

export const meta: MetaFunction = () => [
  {
    title: 'DMS Sonix',
  },
  {
    httpEquiv: 'Content-Security-Policy',
    content: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https: http://localhost:*; connect-src 'self' ${AUTH_CONFIG.endpoint} ${new URL(API_CONFIG.baseUrl).origin}`,
  },
];

export const links: LinksFunction = () => [
  {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
];

function ThemedApp({children}: {children: React.ReactNode}) {
  const {mode} = useColorMode();
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  // Set color-scheme on <html> so native browser elements (scrollbars, form controls)
  // respect the current theme mode
  useEffect(() => {
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export function Layout({children}: {children: React.ReactNode}) {
  const {t, i18n} = useTranslation();

  useEffect(() => {
    document.title = t('appName');
  }, [t]);

  const baseLanguage = i18n.language?.split('-')[0] || 'en';

  return (
    <html lang={baseLanguage}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ColorModeProvider>
          <ThemedApp>
            <LogtoProvider config={logtoConfig}>
              <QueryProvider>
                <AuthProvider>
                  <LocationProvider>
                    <LocationChangeGuardProvider>
                      {children}
                      <ScrollRestoration />
                      <Scripts />
                    </LocationChangeGuardProvider>
                  </LocationProvider>
                </AuthProvider>
              </QueryProvider>
            </LogtoProvider>
          </ThemedApp>
        </ColorModeProvider>
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let title = 'Something went wrong';
  let detail = 'An unexpected error occurred.';

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    detail = error.data?.toString() ?? 'No details available.';
  } else if (error instanceof Error) {
    detail = error.message;
  }

  const theme = createAppTheme('light');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          p: 4,
          textAlign: 'center',
        }}
      >
        <ErrorOutlineIcon sx={{fontSize: 64, color: 'error.main', mb: 2}} />
        <Typography variant="h5" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{mb: 3, maxWidth: 480}}>
          {detail}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </Box>
    </ThemeProvider>
  );
}

export function HydrateFallback() {
  return <AppLoading />;
}

export default function App() {
  return <Outlet />;
}
