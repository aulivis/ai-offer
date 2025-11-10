import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '10 tipp a tökéletes ajánlathoz | Vyndi Blog',
  description:
    'Gyakorlati tanácsok és tippek, amelyek segítenek jobb, konverzióoptimalizált ajánlatokat készíteni. Tanuld meg a professzionális ajánlatkészítés titkait.',
  openGraph: {
    title: '10 tipp a tökéletes ajánlathoz | Vyndi Blog',
    description: 'Gyakorlati tanácsok a tökéletes ajánlatok készítéséhez.',
    type: 'article',
  },
};

export default function TenTipsPage() {
  const tips = [
    {
      number: 1,
      title: 'Ismerd meg az ügyfelet',
      content:
        'Mielőtt elkezdenél dolgozni az ajánlaton, tölts időt az ügyfél megértésével. Kérdezz rá problémáikra, céljaikra és elvárásaikra. Minél jobban ismered az ügyfelet, annál relevánsabb és hatékonyabb ajánlatot tudsz készíteni.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
    {
      number: 2,
      title: 'Fókuszálj az értékajánlatra',
      content:
        'Ne csak a szolgáltatásaidat listázd, hanem mutasd be, milyen értéket adsz az ügyfélnek. Hangsúlyozd az eredményeket, a megoldásokat és a pozitív kimeneteket. Az ügyfél nem a szolgáltatást vásárolja, hanem az értéket.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      number: 3,
      title: 'Használj konkrét számokat',
      content:
        'Kerüld a floskulákat és a homályos kijelentéseket. Használj konkrét számokat, százalékokat, időtartamokat és mérhető eredményeket. Például "50%-os növekedés" sokkal hatékonyabb, mint "jelentős növekedés".',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      number: 4,
      title: 'Törj le az árakat',
      content:
        'Ne csak egy összeggel dobd be az árat. Törj le az árakat konkrét szolgáltatásokra vagy fázisokra. Ez segít az ügyfélnek megérteni, mit kap, és növeli a transzparenciát és a bizalmat.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      number: 5,
      title: 'Mutasd be a ROI-t',
      content:
        'Számold ki és mutasd be a megtérülési időt (ROI). Az ügyfelek számára fontos tudni, hogy a befektetés mennyi idő alatt térül meg. Konkrét számokkal és számításokkal segíts nekik megérteni az értéket.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
    },
    {
      number: 6,
      title: 'Használj social proof-ot',
      content:
        'Vélemények, értékelések, referenciák és esettanulmányok jelentősen növelhetik az ajánlat hitelességét. Mutasd be korábbi sikeres projekteidet és elégedett ügyfeleid véleményeit.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ),
    },
    {
      number: 7,
      title: 'Készíts határidős ajánlatot',
      content:
        'Határidő vagy korlátozott ideig érvényes ajánlat segíthet az ügyfelekben sürgősség érzését kelteni. Ez növelheti a konverzió rátát, de csak akkor használd, ha valóban korlátozott az idő.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      number: 8,
      title: 'Egyértelmű call-to-action',
      content:
        'Minden ajánlatnak egyértelműen kell kommunikálnia, mit kell tennie az ügyfélnek tovább. Használj aktív, cselekvési szavakat ("Kezdjük el", "Foglald le", "Válaszolj") és add meg az elérhetőségeidet.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 5l7 7m0 0l-7 7m7-7H3"
          />
        </svg>
      ),
    },
    {
      number: 9,
      title: 'Professzionális vizuális prezentáció',
      content:
        'A jól tervezett, konzisztens dizájn növeli az ajánlat hitelességét. Használj professzionális sablonokat, következetes színeket, és ügyelj az olvashatóságra. A vizuális prezentáció ugyanolyan fontos, mint a tartalom.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      ),
    },
    {
      number: 10,
      title: 'Ellenőrizd és teszteld',
      content:
        'Mielőtt elküldöd az ajánlatot, ellenőrizd a helyesírást, a számokat és a részleteket. Kérj visszajelzést egy kollégától vagy baráttól. A hibamentes ajánlat növeli a hitelességedet és a professzionalitásodat.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <main id="main" className="mx-auto w-full max-w-4xl px-6 pb-24 pt-16">
      {/* Breadcrumb Navigation */}
      <nav className="mb-8 text-sm text-fg-muted" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/resources" className="hover:text-primary transition-colors">
              Erőforrások
            </Link>
          </li>
          <li className="text-fg-muted">/</li>
          <li>
            <Link href="/resources/blog" className="hover:text-primary transition-colors">
              Blog
            </Link>
          </li>
          <li className="text-fg-muted">/</li>
          <li className="text-fg">10 tipp a tökéletes ajánlathoz</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <header className="mb-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/50 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
          Blog cikk
        </span>
        <h1 className="mt-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl">
          10 tipp a tökéletes ajánlathoz
        </h1>
        <p className="mt-4 text-xl leading-relaxed text-fg-muted">
          Gyakorlati tanácsok és tippek, amelyek segítenek jobb, konverzióoptimalizált ajánlatokat
          készíteni. Tanuld meg a professzionális ajánlatkészítés titkait.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-fg-muted">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>2024. január</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>12 perc olvasás</span>
          </div>
        </div>
      </header>

      {/* Featured Image Placeholder */}
      <div className="mb-12 rounded-lg border-2 border-dashed border-border bg-gray-50 p-16 text-center">
        <svg
          className="mx-auto h-20 w-20 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-4 text-sm font-medium text-gray-600">
          [Helyőrző: Hero kép - Professzionális ajánlat példák, tippek infografika vagy inspiráló
          kép]
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Ajánlott méret: 1200x600px, formátum: WebP vagy PNG
        </p>
      </div>

      {/* Introduction */}
      <div className="mb-12">
        <p className="text-lg leading-relaxed text-fg-muted">
          Az ajánlatkészítés művészete és tudománya egyaránt. Egy jól elkészített ajánlat nem csak
          információkat közöl, hanem meggyőzi az ügyfelet, hogy veled dolgozzon. Ebben a cikkben 10
          praktikus tippet osztunk meg, amelyek segítenek tökéletes ajánlatokat készíteni.
        </p>
      </div>

      {/* Tips List */}
      <div className="space-y-8">
        {tips.map((tip) => (
          <Card key={tip.number} className="border-l-4 border-l-amber-500">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-2xl font-bold text-amber-600">
                  {tip.number}
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-3 flex items-center gap-3">
                  <div className="text-amber-600">{tip.icon}</div>
                  <h2 className="text-2xl font-bold text-fg">{tip.title}</h2>
                </div>
                <p className="text-lg leading-relaxed text-fg-muted">{tip.content}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Practical Example Section */}
      <Card className="mt-12 bg-gradient-to-br from-amber-50 to-orange-50">
        <h2 className="mb-4 text-2xl font-bold text-fg">Gyakorlati példa</h2>
        <p className="mb-4 text-fg-muted">
          Íme egy példa, hogyan néz ki egy jól strukturált ajánlat:
        </p>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-2 font-semibold text-fg">Ajánlat struktúra példa:</h3>
          <ol className="ml-6 list-decimal space-y-2 text-fg-muted">
            <li>Fedőlap: Cégnév, logó, projekt címe</li>
            <li>Ügyfél problémájának megértése: Konkrét kihívások</li>
            <li>Megoldás: Részletes terv és megközelítés</li>
            <li>Szolgáltatások: Pontos leírás minden elemről</li>
            <li>Árazás: Törött árstruktúra, ROI számítás</li>
            <li>Timeline: Határidők és mérföldkövek</li>
            <li>Referenciák: Korábbi sikeres projektek</li>
            <li>Call-to-action: Egyértelmű következő lépések</li>
          </ol>
        </div>
      </Card>

      {/* Summary */}
      <Card className="mt-12 border-l-4 border-l-green-500 bg-green-50/30">
        <h2 className="mb-4 text-2xl font-bold text-fg">Összegzés</h2>
        <p className="mb-4 text-lg leading-relaxed text-fg-muted">
          A tökéletes ajánlat egyensúlyt teremt az információ és a meggyőzés között. A fent említett
          10 tipp segít abban, hogy professzionális, hatékony ajánlatokat készíts, amelyek növelik a
          konverzió rátát és az üzleti sikereket.
        </p>
        <p className="text-lg leading-relaxed text-fg-muted">
          Ne feledd: az ajánlatkészítés folyamatos tanulási folyamat. Próbálj ki különböző
          megközelítéseket, kérj visszajelzést, és folyamatosan fejleszd a módszereidet.
        </p>
      </Card>

      {/* CTA Section */}
      <Card className="mt-12 border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold text-fg">Készen állsz a gyakorlásra?</h2>
          <p className="mb-8 text-lg text-fg-muted">
            Használd a Vyndi-t, hogy professzionális ajánlatokat készíts percek alatt. Próbáld ki
            ingyenesen!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login?redirect=/new"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              Ingyenes próba indítása
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link
              href="/resources/guide"
              className="inline-flex items-center gap-2 rounded-full border-2 border-primary/40 bg-white px-8 py-4 text-base font-semibold text-primary transition-all hover:bg-primary/5"
            >
              Ajánlatkészítési útmutató
            </Link>
          </div>
        </div>
      </Card>

      {/* Related Articles */}
      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-fg">Kapcsolódó cikkek</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/resources/blog/best-practices">
            <Card className="group h-full border-2 border-border/60 transition-all hover:border-primary/40 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-fg group-hover:text-primary transition-colors">
                    Ajánlatkészítés best practices
                  </h3>
                  <p className="text-sm text-fg-muted">
                    Iparági best practice-ek és trendek az ajánlatkészítésben.
                  </p>
                </div>
                <svg
                  className="h-5 w-5 text-fg-muted group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </Card>
          </Link>
          <Link href="/resources/guide">
            <Card className="group h-full border-2 border-border/60 transition-all hover:border-primary/40 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-fg group-hover:text-primary transition-colors">
                    Ajánlatkészítési útmutató
                  </h3>
                  <p className="text-sm text-fg-muted">
                    Komplett útmutató a tökéletes ajánlatok elkészítéséhez.
                  </p>
                </div>
                <svg
                  className="h-5 w-5 text-fg-muted group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  );
}

