'use client';

interface OfferDisplayProps {
  html: string;
}

/**
 * Client component that displays offer HTML.
 *
 * The new template system generates complete HTML documents with inline styles,
 * so no style extraction or injection is needed.
 * The renderer returns safe, complete HTML, so no refiltering is required.
 */
export function OfferDisplay({ html }: OfferDisplayProps) {
  // Extract body content from full HTML document
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;

  return (
    <div className="mb-8 flex justify-center px-4 sm:px-6 lg:px-8">
      <div
        id="offer-content-container"
        className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden"
        style={{
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div
          className="offer-content-wrapper"
          style={{
            padding: 'clamp(1.5rem, 4vw, 3rem)',
          }}
          dangerouslySetInnerHTML={{ __html: bodyContent }}
        />
      </div>
    </div>
  );
}
