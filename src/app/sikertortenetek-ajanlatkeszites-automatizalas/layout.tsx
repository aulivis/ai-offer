import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Valós sikertörténetek | 200+ cég 70%-kal gyorsabb ajánlatkészítés - Vyndi',
  description:
    'Nézd meg, hogyan segített a Vyndi 200+ magyar cégnek 70%-kal gyorsabb ajánlatkészítést és 35%-kal magasabb konverziót elérni. Valós sikertörténetek és eredmények.',
  keywords: 'ajánlatkészítés, automatizáció, CRM, sales, Magyarország',
  openGraph: {
    title: 'Valós sikertörténetek | 200+ cég 70%-kal gyorsabb ajánlatkészítés - Vyndi',
    description:
      'Nézd meg, hogyan segített a Vyndi 200+ magyar cégnek 70%-kal gyorsabb ajánlatkészítést és 35%-kal magasabb konverziót elérni. Valós sikertörténetek és eredmények.',
  },
};

export default function SuccessStoriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
