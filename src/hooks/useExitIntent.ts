'use client';

import { useEffect, useState } from 'react';

export function useExitIntent() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Check if popup was already shown in this session
    const popupShown = sessionStorage.getItem('exitIntentPopupShown');
    if (popupShown === 'true') {
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse is moving upward (toward top of page)
      if (e.clientY <= 0) {
        setShowPopup(true);
        sessionStorage.setItem('exitIntentPopupShown', 'true');
      }
    };

    // Add event listener
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return { showPopup, setShowPopup };
}

