import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sikertörténetek | 500+ Elégedett Ügyfél | Vyndi',
  description:
    'Nézd meg, hogyan érnek el ügyfeleink átlagosan 70%-os hatékonyságnövelést a Vyndi-vel. Több mint 500 cég sikertörténete.',
  openGraph: {
    title: 'Valós Eredmények Valós Ügyfelektől | Vyndi Sikertörténetek',
    description: '500+ cég története: Hogyan takarítanak meg havonta átlagosan 40+ órát',
  },
};

export default function SuccessStoriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
