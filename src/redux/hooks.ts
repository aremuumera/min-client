import { useDispatch, useSelector, useStore } from 'react-redux';
import type { AppDispatch, RootState, AppStore } from './store';

/**
 * Typed Redux hooks for use throughout the application
 * Use these instead of plain `useDispatch` and `useSelector`
 */

// Typed dispatch hook
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

// Typed selector hook
export const useAppSelector = useSelector.withTypes<RootState>();

// Typed store hook
export const useAppStore = useStore.withTypes<AppStore>();
