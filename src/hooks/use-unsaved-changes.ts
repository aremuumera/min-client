'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UseUnsavedChangesOptions {
  isDirty: boolean;
  isSubmitting?: boolean;
}

/**
 * Hook to guard against accidental page reloads, tab closes,
 * and in-app navigation when form has unsaved modifications
 * or when an async submission is currently in flight.
 */
export function useUnsavedChanges({ isDirty, isSubmitting = false }: UseUnsavedChangesOptions) {
  const router = useRouter();
  const [showPrompt, setShowPrompt] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const isNavigatingRef = useRef(false);

  // Keep state accessible synchronously in event listeners
  const isDirtyRef = useRef(isDirty);
  const isSubmittingRef = useRef(isSubmitting);
  useEffect(() => {
    isDirtyRef.current = isDirty;
    isSubmittingRef.current = isSubmitting;
  }, [isDirty, isSubmitting]);

  // 1. Browser tab close / reload guard (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if ((isDirtyRef.current || isSubmittingRef.current) && !isNavigatingRef.current) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // 2. In-app navigation guard (captures link clicks inside the app)
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      if (!isDirtyRef.current && !isSubmittingRef.current) return;
      if (isNavigatingRef.current) return;

      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      // Skip non-navigating links
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('javascript:') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        target.getAttribute('target') === '_blank'
      ) {
        return;
      }

      // Skip if navigating to the current exact URL
      const currentPath = window.location.pathname;
      if (href === currentPath || href === window.location.pathname + window.location.search) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      setPendingUrl(href);
      setShowPrompt(true);
    };

    document.addEventListener('click', handleAnchorClick, true);
    return () => {
      document.removeEventListener('click', handleAnchorClick, true);
    };
  }, []);

  // 3. Browser Back / Forward button navigation guard (popstate)
  useEffect(() => {
    if (!isDirty && !isSubmitting) return;

    const handlePopState = () => {
      if (isNavigatingRef.current) return;

      // Re-push current state to prevent browser moving backward/forward
      window.history.pushState(null, '', window.location.href);
      setPendingUrl(null); // Indicates history navigation
      setShowPrompt(true);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isDirty, isSubmitting]);

  const confirmLeave = useCallback(() => {
    isNavigatingRef.current = true;
    setShowPrompt(false);
    if (pendingUrl) {
      router.push(pendingUrl);
    } else {
      window.history.back();
    }
  }, [pendingUrl, router]);

  const stayOnPage = useCallback(() => {
    setShowPrompt(false);
    setPendingUrl(null);
  }, []);

  const allowNavigation = useCallback(() => {
    isNavigatingRef.current = true;
  }, []);

  return {
    showPrompt,
    isSubmitting,
    confirmLeave,
    stayOnPage,
    allowNavigation,
  };
}
