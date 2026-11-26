import {Outlet} from 'react-router';
import {authClientMiddleware} from '../core/middleware/authClientMiddleware';

export const clientMiddleware = [authClientMiddleware];

export default function ProtectedLayout() {
  return <Outlet />;
}
