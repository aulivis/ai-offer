import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Erőforrások | Útmutatók, Cikkek, Videók | Vyndi',
  description:
    'Hozzáférhetsz útmutatókhoz, sablonokhoz, cikkekhez és videókhoz az ajánlatkészítésről. 50+ útmutató, 100+ cikk, 25+ videó.',
  openGraph: {
    title: 'Erőforrások | Vyndi',
    description:
      'Hozzáférhetsz útmutatókhoz, sablonokhoz, cikkekhez és videókhoz az ajánlatkészítésről',
  },
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
