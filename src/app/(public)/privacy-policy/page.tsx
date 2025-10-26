import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Adatvédelmi tájékoztató',
  description: 'Olvassa el, hogyan kezeljük az Ön adatait és biztosítjuk azok védelmét.',
};

const sections = [
  {
    heading: '1. Bevezetés',
    content:
      'Ez a tájékoztató bemutatja, milyen típusú adatokat gyűjtünk, és hogyan biztosítjuk azok biztonságát.',
  },
  {
    heading: '2. Adatgyűjtés',
    content:
      'Röviden ismertetjük, milyen adatokat gyűjtünk a szolgáltatás biztosítása érdekében, és milyen esetekben tesszük ezt.',
  },
  {
    heading: '3. Adatfelhasználás',
    content:
      'Leírjuk, hogyan használjuk fel az összegyűjtött adatokat, és milyen célból tároljuk azokat.',
  },
  {
    heading: '4. Jogai és lehetőségei',
    content:
      'Összefoglaljuk, milyen jogok illetik meg Önt az adatkezeléssel kapcsolatban, és hogyan élhet ezekkel.',
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
      <header className="space-y-4 text-center">
        <p className="text-sm uppercase tracking-widest text-muted">Adatvédelem</p>
        <h1 className="text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
          Adatvédelmi tájékoztató
        </h1>
        <p className="text-lg text-muted-foreground">
          Az alábbi összefoglaló segít megérteni, hogyan gyűjtjük, használjuk fel és óvjuk az Ön
          adatait.
        </p>
      </header>

      <section className="space-y-12">
        {sections.map((section) => (
          <article key={section.heading} className="space-y-4">
            <h2 className="text-2xl font-semibold text-fg sm:text-3xl">{section.heading}</h2>
            <p className="text-base leading-relaxed text-muted-foreground">{section.content}</p>
          </article>
        ))}
      </section>

      <footer className="rounded-lg bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        További kérdései vannak?{' '}
        <Link
          href="/cookie-policy"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Tekintse meg a sütikezelési tájékoztatót
        </Link>
        .
      </footer>
    </main>
  );
}
