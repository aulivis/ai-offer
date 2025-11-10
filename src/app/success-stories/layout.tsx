import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sikertörténetek - Vyndi',
  description:
    'Nézd meg, hogyan segítettünk más vállalatoknak növelni az ajánlatkészítési hatékonyságukat',
};

export default function SuccessStoriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
