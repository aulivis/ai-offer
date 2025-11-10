/**
 * Mapping of testimonial author names to their image paths
 * Images are located in /public/images/
 */
export const AUTHOR_IMAGE_MAP: Record<string, string> = {
  'Kiss Júlia': '/images/kjulia_creative_agency.png',
  'Nagy Péter': '/images/npeter_tech_solutions.png',
  'Szabó Anna': '/images/szanna_growth_partners.png',
};

/**
 * Get the image path for a testimonial author
 * @param authorName - The full name of the author
 * @returns The image path, or a fallback path if not found
 */
export function getAuthorImage(authorName: string): string {
  return (
    AUTHOR_IMAGE_MAP[authorName] || `/images/${authorName.toLowerCase().replace(/\s+/g, '_')}.png`
  );
}
