import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sütikezelési tájékoztató',
  description: 'Áttekintés a weboldalon használt sütikről és azok kezeléséről.',
};

const sections = [
  {
    heading: '1. Mi az a süti?',
    content:
      'A sütik kis adatfájlok, amelyek segítenek a weboldal használatának támogatásában és személyre szabásában.',
  },
  {
    heading: '2. Milyen sütiket használunk?',
    content:
      'A működéshez szükséges, analitikai és marketing sütiket alkalmazunk. Ezekről itt olvashat rövid összefoglalót.',
  },
  {
    heading: '3. Hogyan kezelheti a sütiket?',
    content:
      'Böngészőjében vagy a weboldalon található sütikezelő felületen bármikor módosíthatja a sütibeállításait.',
  },
  {
    heading: '4. Kapcsolatfelvétel',
    content:
      'Ha kérdése merül fel a sütihasználattal kapcsolatban, vegye fel velünk a kapcsolatot az ügyfélszolgálaton keresztül.',
  },
];

export default function CookiePolicyPage() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
      <header className="space-y-4 text-center">
        <p className="text-sm uppercase tracking-widest text-muted">Sütikezelés</p>
        <h1 className="text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
          Sütikezelési tájékoztató
        </h1>
        <p className="text-lg text-muted-foreground">
          Tudjon meg többet arról, hogyan használjuk a sütiket, és hogyan tudja módosítani a
          beállításait.
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

      <footer
        id="manage-cookies"
        className="rounded-lg bg-muted/30 p-6 text-center text-sm text-muted-foreground"
      >
        Szeretné módosítani a sütibeállításokat?{' '}
        <Link href="#" className="font-medium text-primary underline-offset-4 hover:underline">
          Nyissa meg a sütikezelőt
        </Link>
        .
      </footer>
    </main>
  );
}
