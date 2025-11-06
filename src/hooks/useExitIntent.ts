'use client';

import { useEffect, useState, useRef } from 'react';

export function useExitIntent() {
  const [showPopup, setShowPopup] = useState(false);
  const hasShownRef = useRef(false);
  const listenerAddedRef = useRef(false);

  useEffect(() => {
    // Check if popup was already shown in this session
    if (typeof window === 'undefined') return;

    // Check sessionStorage immediately
    const popupShown = sessionStorage.getItem('exitIntentPopupShown');
    if (popupShown === 'true') {
      hasShownRef.current = true;
      return;
    }

    // Don't add listener if already added or popup was shown
    if (listenerAddedRef.current || hasShownRef.current) {
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse is moving upward (toward top of page)
      // and popup hasn't been shown yet
      if (e.clientY <= 0 && !hasShownRef.current) {
        hasShownRef.current = true;
        sessionStorage.setItem('exitIntentPopupShown', 'true');
        setShowPopup(true);
        // Remove listener immediately after showing
        document.removeEventListener('mouseleave', handleMouseLeave);
        listenerAddedRef.current = false;
      }
    };

    // Add event listener only once
    listenerAddedRef.current = true;
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      listenerAddedRef.current = false;
    };
  }, []);

  return { showPopup, setShowPopup };
}

