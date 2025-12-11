'use client';

import { useState, useRef, useEffect } from 'react';
import { Share2, Facebook, Twitter, Linkedin, Link as LinkIcon, X } from 'lucide-react';
import { clientLogger } from '@/lib/clientLogger';

interface ShareDropdownProps {
  url: string;
  title: string;
}

export function ShareDropdown({ url, title }: ShareDropdownProps) {
  const [showShare, setShowShare] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowShare(false);
      }
    };

    if (showShare) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShare]);

  const fullUrl = typeof window !== 'undefined' ? window.location.origin + url : url;
  const shareUrl = encodeURIComponent(fullUrl);
  const shareTitle = encodeURIComponent(title);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
    setShowShare(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setShowShare(false);
      // You could add a toast notification here
    } catch (err) {
      clientLogger.error('Failed to copy link', err, { url });
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowShare(!showShare)}
        className="bg-bg text-fg px-6 py-3 rounded-xl font-semibold border-2 border-border hover:border-primary transition-colors flex items-center gap-2 min-h-[44px]"
        aria-expanded={showShare}
        aria-label="Megosztás"
      >
        <Share2 className="w-5 h-5" />
        <span>Megosztás</span>
      </button>

      {showShare && (
        <div className="absolute top-full right-0 mt-2 bg-bg rounded-xl shadow-2xl border border-border p-4 min-w-[250px] z-50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-fg">Megosztás itt:</p>
            <button
              onClick={() => setShowShare(false)}
              className="p-1 hover:bg-bg-muted rounded transition-colors"
              aria-label="Bezárás"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => handleShare('facebook')}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-bg-muted transition-colors"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Facebook className="w-4 h-4 text-primary-ink" />
              </div>
              <span className="text-fg font-medium">Facebook</span>
            </button>
            <button
              onClick={() => handleShare('twitter')}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-bg-muted transition-colors"
            >
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                <Twitter className="w-4 h-4 text-primary-ink" />
              </div>
              <span className="text-fg font-medium">Twitter</span>
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-bg-muted transition-colors"
            >
              <div className="w-8 h-8 bg-cta rounded-full flex items-center justify-center">
                <Linkedin className="w-4 h-4 text-cta-ink" />
              </div>
              <span className="text-fg font-medium">LinkedIn</span>
            </button>
            <div className="pt-2 border-t border-border">
              <button
                onClick={copyLink}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-bg-muted transition-colors"
              >
                <div className="w-8 h-8 bg-primary/80 rounded-full flex items-center justify-center">
                  <LinkIcon className="w-4 h-4 text-primary-ink" />
                </div>
                <span className="text-fg font-medium">Link másolása</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
