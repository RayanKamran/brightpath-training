import type {RouteConfig} from '@react-router/dev/routes';
import {index, layout, prefix, route} from '@react-router/dev/routes';

export default [
  // Public routes (no authentication required)
  route('sign-in', './pages/SignIn.tsx'),
  route('callback', './pages/Callback.tsx'),

  // Protected routes (require authentication via middleware)
  layout('./pages/ProtectedLayout.tsx', [
    layout('./components/Layout.tsx', [
      index('./app.tsx'),

      // Parts
      ...prefix('parts', [
        index('./pages/parts/PartList.tsx'),
        route(':partNumber', './pages/parts/PartDetail.tsx'),
      ]),

      // Admin
      route('locations', './pages/locations/LocationList.tsx'),
      route('locations/create', './pages/locations/LocationCreate.tsx'),
      route('locations/:id', './pages/locations/LocationDetail.tsx'),

      // User profile
      route('user-settings', './pages/UserSettings.tsx'),

      // Catch-all: true 404 for unknown routes
      route('*', './pages/NotFound.tsx'),
    ]),
  ]),
] satisfies RouteConfig;
