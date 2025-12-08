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
        className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8 lg:p-10"
        dangerouslySetInnerHTML={{ __html: bodyContent }}
      />
    </div>
  );
}
