import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { CONSENT_VERSION } from '@/lib/consent/constants';
import { ManageCookiesButton } from '@/components/cookies/ManageCookiesButton';

export const metadata: Metadata = {
  title: 'Sütikezelési tájékoztató',
  description: 'Áttekintés a weboldalon használt sütikről és azok kezeléséről.',
};

type Section = {
  heading: string;
  content: ReactNode;
};

type CookieEntry = {
  name: string;
  purpose: string;
  duration: string;
  provider: string;
};

const cookieCategories: Section = {
  heading: '1. Sütik kategóriái',
  content: (
    <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
      <p>A Propono három sütikategóriát különböztet meg:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Szükséges sütik:</strong> biztosítják a bejelentkezést, a munkamenetet és az oldal
          biztonságát. Ezek nélkül a szolgáltatás nem működne.
        </li>
        <li>
          <strong>Analitikai sütik:</strong> segítenek megérteni, hogyan használják a látogatók az
          oldalt, hogy fejleszthessük a felhasználói élményt. Csak hozzájárulás után kerülnek
          beállításra.
        </li>
        <li>
          <strong>Marketing sütik:</strong> személyre szabott üzenetek és ajánlatok megjelenítésére
          szolgálnak. Ezeket kizárólag hozzájárulással használjuk, és minden változás esetén
          frissítjük ezt a tájékoztatót.
        </li>
      </ul>
    </div>
  ),
};

const cookieInventory: CookieEntry[] = [
  {
    name: 'propono_at',
    purpose:
      'Hitelesítési munkamenet-süti, amely biztosítja a bejelentkezett felhasználók számára a Propono felülethez való hozzáférést.',
    duration: 'Munkamenet (a böngésző bezárásáig)',
    provider: 'Propono Labs Kft.',
  },
  {
    name: 'propono_rt',
    purpose:
      'A munkamenet frissítéséhez szükséges süti, amely segít megtartani az aktív bejelentkezést és csökkenti az újbóli belépések számát.',
    duration: 'Munkamenet (a böngésző bezárásáig)',
    provider: 'Propono Labs Kft.',
  },
  {
    name: 'XSRF-TOKEN',
    purpose:
      'Védelmet nyújt a keresztoldali kéréshamisítás (CSRF) ellen az űrlapok és API-hívások biztonságos kezelése érdekében.',
    duration: 'Munkamenet (a böngésző bezárásáig)',
    provider: 'Propono Labs Kft.',
  },
  {
    name: 'consent',
    purpose:
      'Eltárolja az Ön sütibeállításait, beleértve a hozzájárulás dátumát és verzióját, hogy bizonyítható legyen a választása.',
    duration: '180 nap',
    provider: 'Propono Labs Kft.',
  },
];

const sections: Section[] = [
  cookieCategories,
  {
    heading: '2. Milyen sütiket helyezünk el?',
    content: (
      <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
        <p>
          Az alábbi táblázat részletezi a jelenleg használt sütiket. Analitikai és marketing sütiket
          csak akkor állítunk be, ha Ön engedélyezi őket; a szolgáltatás jelen verziójában ilyen
          sütit még nem használunk.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] table-fixed border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-muted uppercase tracking-wider">
                <th className="rounded-l-lg bg-muted/50 px-4 py-2 font-semibold">Név</th>
                <th className="bg-muted/50 px-4 py-2 font-semibold">Cél</th>
                <th className="bg-muted/50 px-4 py-2 font-semibold">Időtartam</th>
                <th className="rounded-r-lg bg-muted/50 px-4 py-2 font-semibold">Szolgáltató</th>
              </tr>
            </thead>
            <tbody>
              {cookieInventory.map((cookie) => (
                <tr key={cookie.name} className="align-top">
                  <td className="rounded-l-lg bg-muted/20 px-4 py-3 font-medium text-fg">
                    {cookie.name}
                  </td>
                  <td className="bg-muted/20 px-4 py-3 text-muted-foreground">{cookie.purpose}</td>
                  <td className="bg-muted/20 px-4 py-3 text-muted-foreground">{cookie.duration}</td>
                  <td className="rounded-r-lg bg-muted/20 px-4 py-3 text-muted-foreground">
                    {cookie.provider}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    heading: '3. Hozzájárulás visszavonása és módosítása',
    content: (
      <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
        <p>
          Hozzájárulását bármikor visszavonhatja vagy módosíthatja. Használja a{' '}
          <Link
            href="#manage-cookies"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Manage Cookies
          </Link>{' '}
          hivatkozást, ahol újra megadhatja preferenciáit, illetve törölheti a választható sütikre
          adott engedélyét.
        </p>
        <p>
          A hozzájárulás visszavonása nem érinti a visszavonás előtt végrehajtott adatkezelés
          jogszerűségét, de előfordulhat, hogy bizonyos funkciók csak szükséges sütikkel működnek
          tovább.
        </p>
      </div>
    ),
  },
  {
    heading: '4. Do Not Track (DNT) jelzések',
    content: (
      <p className="text-base leading-relaxed text-muted-foreground">
        A böngészője beállíthatja a Do Not Track jelzést; jelenleg nem változtatjuk meg
        automatikusan a sütibeállításokat ilyen jelzés alapján. A hozzájárulását a saját
        preferenciaközpontunkon keresztül kezelheti, amely minden felülbírálást pontosan rögzít.
      </p>
    ),
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
        <div className="flex justify-center">
          <span className="inline-flex items-center rounded-full border border-muted-foreground/40 bg-muted/40 px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Policy version {CONSENT_VERSION}
          </span>
        </div>
        <p className="text-lg text-muted-foreground">
          Tudjon meg többet arról, hogyan használjuk a sütiket, és hogyan tudja módosítani a
          beállításait.
        </p>
      </header>

      <section className="space-y-12">
        {sections.map((section) => (
          <article key={section.heading} className="space-y-4">
            <h2 className="text-2xl font-semibold text-fg sm:text-3xl">{section.heading}</h2>
            {section.content}
          </article>
        ))}
      </section>

      <footer
        id="manage-cookies"
        className="rounded-lg bg-muted/30 p-6 text-center text-sm text-muted-foreground"
      >
        <p className="mb-3">Nyissa meg a sütikezelőt és állítsa be újra a preferenciáit:</p>
        <ManageCookiesButton label="Sütibeállítások kezelése" />
      </footer>
    </main>
  );
}
