'use client';

/**
 * Component that displays visual margin guides over the PDF preview
 * to help users see the content safe area matching PDF margins
 * (20mm top/bottom, 15mm left/right)
 */
export function PreviewMarginGuides({ enabled = true }: { enabled?: boolean }) {
  if (!enabled) return null;

  // A4 dimensions: 210mm x 297mm
  // Margins: 20mm top/bottom, 15mm left/right
  // Convert mm to approximate percentage for responsive display
  const topMarginPercent = (20 / 297) * 100;
  const bottomMarginPercent = (20 / 297) * 100;
  const leftMarginPercent = (15 / 210) * 100;
  const rightMarginPercent = (15 / 210) * 100;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10"
      aria-hidden="true"
      style={{
        background: `
          linear-gradient(to right, 
            rgba(59, 130, 246, 0.1) 0%, 
            rgba(59, 130, 246, 0.1) ${leftMarginPercent}%, 
            transparent ${leftMarginPercent}%, 
            transparent ${100 - rightMarginPercent}%, 
            rgba(59, 130, 246, 0.1) ${100 - rightMarginPercent}%
          ),
          linear-gradient(to bottom, 
            rgba(59, 130, 246, 0.1) 0%, 
            rgba(59, 130, 246, 0.1) ${topMarginPercent}%, 
            transparent ${topMarginPercent}%, 
            transparent ${100 - bottomMarginPercent}%, 
            rgba(59, 130, 246, 0.1) ${100 - bottomMarginPercent}%
          )
        `,
      }}
    >
      {/* Corner indicators */}
      <div
        className="absolute border-t-2 border-l-2 border-blue-400 opacity-50"
        style={{
          top: `${topMarginPercent}%`,
          left: `${leftMarginPercent}%`,
          width: '20px',
          height: '20px',
        }}
      />
      <div
        className="absolute border-t-2 border-r-2 border-blue-400 opacity-50"
        style={{
          top: `${topMarginPercent}%`,
          right: `${rightMarginPercent}%`,
          width: '20px',
          height: '20px',
        }}
      />
      <div
        className="absolute border-b-2 border-l-2 border-blue-400 opacity-50"
        style={{
          bottom: `${bottomMarginPercent}%`,
          left: `${leftMarginPercent}%`,
          width: '20px',
          height: '20px',
        }}
      />
      <div
        className="absolute border-b-2 border-r-2 border-blue-400 opacity-50"
        style={{
          bottom: `${bottomMarginPercent}%`,
          right: `${rightMarginPercent}%`,
          width: '20px',
          height: '20px',
        }}
      />
    </div>
  );
}
