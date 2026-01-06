'use client';

import { useEffect, useRef } from 'react';

type ToggleFunction = () => void;

const toggleFunctions = new Set<() => void>();

export function useSectionToggle(toggleFn: ToggleFunction | null) {
  const toggleRef = useRef(toggleFn);

  useEffect(() => {
    toggleRef.current = toggleFn;
  }, [toggleFn]);

  useEffect(() => {
    if (!toggleFn) return;

    const wrappedToggle = () => {
      const currentToggle = toggleRef.current;
      if (currentToggle) {
        currentToggle();
      }
    };

    toggleFunctions.add(wrappedToggle);

    return () => {
      toggleFunctions.delete(wrappedToggle);
    };
  }, [toggleFn]);
}

export function useGlobalToggleShortcut() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + H to toggle all sections
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'H') {
        event.preventDefault();
        toggleFunctions.forEach(toggle => toggle());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}

