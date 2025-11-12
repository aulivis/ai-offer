import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ingyenes ajánlat sablonok | Vyndi',
  description:
    'Böngészd át ingyenes, letölthető ajánlat sablonjainkat. Professzionális, testreszabható sablonok különböző iparágakhoz és projekttípusokhoz. Azonnal használható, PDF formátumban.',
  openGraph: {
    title: 'Ingyenes ajánlat sablonok | Vyndi',
    description: 'Professzionális, letölthető ajánlat sablonok ingyen.',
    type: 'website',
  },
};

export default function TemplatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
