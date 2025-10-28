import { useCallback, useEffect, useRef, useState } from 'react';

interface UseIframeAutoHeightOptions {
  minHeight?: number;
}

export function useIframeAutoHeight({ minHeight = 720 }: UseIframeAutoHeightOptions = {}) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState(minHeight);

  const updateHeight = useCallback(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }

    try {
      const doc = frame.contentDocument;
      if (!doc) {
        setHeight(minHeight);
        return;
      }

      const body = doc.body;
      const html = doc.documentElement;
      const bodyHeight = body ? body.scrollHeight : 0;
      const htmlHeight = html ? html.scrollHeight : 0;
      const nextHeight = Math.max(bodyHeight, htmlHeight, minHeight);
      setHeight(nextHeight);
    } catch {
      // Accessing the iframe document can fail if the sandbox origin
      // restrictions change.  In that case we fall back to the minimum height.
      setHeight(minHeight);
    }
  }, [minHeight]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }

    frame.addEventListener('load', updateHeight);
    return () => {
      frame.removeEventListener('load', updateHeight);
    };
  }, [updateHeight]);

  return { frameRef, height, updateHeight } as const;
}
