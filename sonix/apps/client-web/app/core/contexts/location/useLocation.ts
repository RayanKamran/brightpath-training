import {useContext} from 'react';
import {LocationContext} from './LocationProvider';

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
}
