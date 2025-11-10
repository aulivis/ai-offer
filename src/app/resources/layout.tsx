import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Erőforrások - Vyndi',
  description:
    'Hozzáférhetsz útmutatókhoz, sablonokhoz, cikkekhez és videókhoz az ajánlatkészítésről',
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
