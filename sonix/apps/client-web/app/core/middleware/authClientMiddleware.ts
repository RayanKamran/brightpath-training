import type {MiddlewareFunction} from 'react-router';
import {redirect} from 'react-router';
import {saveAuthRedirectTarget} from '../storage/authRedirectSessionStore';
import {
  AUTH_KERNEL_CONTEXT,
  LOCATION_KERNEL_CONTEXT,
  RESOLVED_LOCATION_CONTEXT,
} from './routerContext';

/**
 * Client middleware that blocks route rendering until auth and location resolve.
 * Runs before every protected route's clientLoader, ensuring location data is available.
 */
export const authClientMiddleware: MiddlewareFunction = async ({context, request}, next) => {
  const authKernel = context.get(AUTH_KERNEL_CONTEXT);
  const locationKernel = context.get(LOCATION_KERNEL_CONTEXT);

  // Wait for auth to resolve
  const auth = await authKernel.waitForResolvedAuth();
  if (auth.status !== 'authenticated' || !auth.userId) {
    saveAuthRedirectTarget(new URL(request.url).pathname);
    throw redirect('/sign-in');
  }

  // Wait for location to resolve
  const location = await locationKernel.waitForResolvedLocation();
  if (location.accessState.kind !== 'ready') {
    throw redirect('/sign-in');
  }

  // Set resolved location for clientLoaders to use
  context.set(RESOLVED_LOCATION_CONTEXT, location.accessState.resolvedLocation);

  return next();
};
