import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { H1, H2 } from '@/components/ui/Heading';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI-alapú szöveg generálás használata | Vyndi',
  description:
    'Tanuld meg, hogyan használd hatékonyan a Vyndi AI funkcióit az ajánlatkészítésben. Tippek, trükkök és best practice-ek az AI-alapú szöveg generáláshoz.',
  openGraph: {
    title: 'AI-alapú szöveg generálás használata | Vyndi',
    description:
      'Tanuld meg, hogyan használd hatékonyan a Vyndi AI funkcióit az ajánlatkészítésben.',
    type: 'article',
  },
};

export default function AIGuidePage() {
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
          <li className="text-fg">AI-alapú szöveg generálás</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <header className="mb-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary">
          Útmutató
        </span>
        <H1 className="mt-6" fluid>
          AI-alapú szöveg generálás használata
        </H1>
        <p className="mt-4 text-xl leading-relaxed text-fg-muted">
          Ismerd meg a Vyndi AI funkcióinak teljes potenciálját. Tanuld meg, hogyan készíthetsz
          professzionális, konverzióoptimalizált ajánlatokat percek alatt az AI segítségével.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-fg-muted">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>AI-powered</span>
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
            <span>8 perc olvasás</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <article className="prose prose-lg max-w-none">
        {/* Section 1: Bevezetés */}
        <section id="bevezetes" className="mb-12 scroll-mt-8">
          <H2 className="mb-4">1. Mi az AI-alapú szöveg generálás?</H2>
          <p className="mb-4 text-lg leading-relaxed text-fg-muted">
            A Vyndi AI funkciója egy fejlett mesterséges intelligencia rendszer, amely segít neked
            professzionális ajánlat szövegeket generálni másodpercek alatt. Az AI megérti az üzleti
            kontextust, az ügyfél igényeit, és olyan szövegeket készít, amelyek:
          </p>
          <ul className="ml-6 mb-6 list-disc space-y-2 text-lg text-fg-muted">
            <li>Ügyfélközpontúak és értékorientáltak</li>
            <li>Professzionális hangvételűek</li>
            <li>Konverzióoptimalizáltak</li>
            <li>Testre szabhatóak és szerkeszthetőek</li>
          </ul>

          {/* Placeholder for AI feature screenshot */}
          <div className="my-8 rounded-lg border-2 border-dashed border-border bg-bg-muted p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-fg-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <p className="mt-4 text-sm font-medium text-fg-muted">
              [Helyőrző: Képernyőkép a Vyndi AI szöveg generálás funkciójáról]
            </p>
            <p className="mt-2 text-xs text-fg-muted">
              Mutasd be, hogyan néz ki az AI szöveg generálás felülete a Vyndi platformon
            </p>
          </div>
        </section>

        {/* Section 2: Előnyök */}
        <section id="elonyok" className="mb-12 scroll-mt-8">
          <H2 className="mb-4">2. Előnyök és lehetőségek</H2>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-l-4 border-l-green-500">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <svg
                  className="h-6 w-6 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-fg">Időmegtakarítás</h3>
              <p className="text-fg-muted">
                Az ajánlatkészítés ideje órákról percekre csökken. Az AI másodpercek alatt generál
                professzionális szövegeket, amelyeket csak finomhangolnod kell.
              </p>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-fg">Konzisztens minőség</h3>
              <p className="text-fg-muted">
                Minden generált szöveg professzionális színvonalú, következetes hangvételű és az
                ajánlat céljához igazodik.
              </p>
            </Card>

            <Card className="border-l-4 border-l-accent">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <svg
                  className="h-6 w-6 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-fg">Végtelen variációk</h3>
              <p className="text-fg-muted">
                Generálj több verziót, és válaszd ki a legjobban illeszkedőt. Az AI segít
                kísérletezni különböző megközelítésekkel.
              </p>
            </Card>

            <Card className="border-l-4 border-l-warning">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                <svg
                  className="h-6 w-6 text-warning"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-fg">Folyamatos tanulás</h3>
              <p className="text-fg-muted">
                Az AI rendszer folyamatosan fejlődik és tanul, így a generált szövegek minősége
                egyre jobb lesz.
              </p>
            </Card>
          </div>
        </section>

        {/* Section 3: Használat */}
        <section id="hasznalat" className="mb-12 scroll-mt-8">
          <H2 className="mb-4">3. Hogyan használd hatékonyan?</H2>

          <div className="space-y-6">
            <Card>
              <h3 className="mb-3 text-xl font-semibold text-fg">3.1. Alapvető használat</h3>
              <p className="mb-4 text-fg-muted">
                Az AI szöveg generálás használata egyszerű és intuitív:
              </p>
              <ol className="ml-6 list-decimal space-y-3 text-fg-muted">
                <li>
                  <strong>Kattints az AI gombra:</strong> Az ajánlatkészítőben válaszd ki a szöveges
                  mezőt, ahol szeretnél AI által generált tartalmat.
                </li>
                <li>
                  <strong>Add meg a kontextust:</strong> Írj egy rövid leírást arról, milyen típusú
                  szöveget szeretnél (pl. &quot;Bemutatkozás a szolgáltatásokról&quot; vagy
                  &quot;Ügyfél problémájának megoldása&quot;).
                </li>
                <li>
                  <strong>Generáld a szöveget:</strong> Kattints a &quot;Generálás&quot; gombra, és
                  másodpercek alatt megkapod a szöveget.
                </li>
                <li>
                  <strong>Finomhangold:</strong> A generált szöveg szerkeszthető, így testre
                  szabhatod az igényeidnek megfelelően.
                </li>
              </ol>
            </Card>

            {/* Placeholder for step-by-step tutorial */}
            <div className="my-8 rounded-lg border-2 border-dashed border-border bg-bg-muted p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-fg-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-4 text-sm font-medium text-fg-muted">
                [Helyőrző: Videó vagy interaktív tutorial - &quot;Hogyan használd az AI szöveg
                generálást lépésről lépésre&quot;]
              </p>
              <p className="mt-2 text-xs text-fg-muted">
                Ajánlott: 2-3 perces rövid videó bemutató a funkció használatáról
              </p>
            </div>

            <Card>
              <h3 className="mb-3 text-xl font-semibold text-fg">3.2. Fejlett lehetőségek</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 font-semibold text-fg">Többszörös generálás</h4>
                  <p className="text-fg-muted">
                    Nem tetszik az első verzió? Generálj több variációt, és válaszd ki a legjobban
                    illeszkedőt!
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-fg">Kontextus hozzáadása</h4>
                  <p className="text-fg-muted">
                    Minél részletesebb információt adsz az AI-nak, annál pontosabb és relevánsabb
                    szöveget kapsz.
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-fg">Hangvétel testreszabása</h4>
                  <p className="text-fg-muted">
                    Kérhetsz formális, barátságos, üzleti vagy kreatív hangvételű szövegeket az
                    igényeidnek megfelelően.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Section 4: Pro tippek */}
        <section id="tippek" className="mb-12 scroll-mt-8">
          <H2 className="mb-4">4. Pro tippek a legjobb eredményekhez</H2>

          <div className="space-y-6">
            <Card className="border-l-4 border-l-success bg-success/10">
              <h3 className="mb-3 text-xl font-semibold text-fg">
                💡 Tipp 1: Adj konkrét információkat
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-danger">
                    ❌ Kevésbé hatékony
                  </p>
                  <p className="text-sm text-fg-muted">&quot;Írj egy bemutatkozást&quot;</p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-success">✅ Hatékony</p>
                  <p className="text-sm text-fg-muted">
                    &quot;Írj egy bemutatkozást egy weboldal fejlesztési projektjéről, amely
                    hangsúlyozza a 10+ év tapasztalatot és a responsive design kiemelését&quot;
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-primary bg-primary/10">
              <h3 className="mb-3 text-xl font-semibold text-fg">
                💡 Tipp 2: Használj kulcsszavakat
              </h3>
              <p className="mb-3 text-fg-muted">
                Ha vannak specifikus kifejezések vagy szakkifejezések, amelyeket használni
                szeretnél, add meg azokat az AI-nak.
              </p>
              <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
                <p className="text-sm text-primary/90">
                  <strong>Példa:</strong> &quot;Használd a következő kifejezéseket: &apos;agilis
                  fejlesztés&apos;, &apos;cloud-based megoldás&apos;, &apos;scalable
                  architektúra&apos;&quot;
                </p>
              </div>
            </Card>

            <Card className="border-l-4 border-l-accent bg-accent/10">
              <h3 className="mb-3 text-xl font-semibold text-fg">
                💡 Tipp 3: Kombináld az AI-t a saját kreativitásoddal
              </h3>
              <p className="text-fg-muted">
                Az AI egy erős eszköz, de a legjobb eredményt akkor kapod, ha kombinálod a generált
                szövegeket a saját ismereteiddel és tapasztalataiddal. Használd az AI-t kiindulási
                pontként, majd testreszabd az ügyfél igényeinek megfelelően.
              </p>
            </Card>

            <Card className="border-l-4 border-l-warning bg-warning/10">
              <h3 className="mb-3 text-xl font-semibold text-fg">
                💡 Tipp 4: Szerkeszd és finomhangold
              </h3>
              <p className="text-fg-muted">
                A generált szöveg nem végső. Vedd át, szerkeszd, és adj hozzá személyes érintéseket.
                Az AI ideális alapot ad, amelyet te alakítasz végleges formába.
              </p>
            </Card>
          </div>
        </section>

        {/* Section 5: Példák */}
        <section id="peldak" className="mb-12 scroll-mt-8">
          <H2 className="mb-4">5. Gyakorlati példák</H2>

          <div className="space-y-6">
            <Card>
              <h3 className="mb-3 text-xl font-semibold text-fg">
                Példa 1: Probléma megoldás szekció
              </h3>
              <div className="rounded-lg bg-bg-muted p-6">
                <p className="mb-3 text-sm font-semibold text-fg">AI prompt:</p>
                <p className="mb-4 rounded bg-bg-muted p-3 text-sm italic text-fg">
                  &quot;Írj egy szöveget, amely bemutatja, hogyan oldjuk meg az ügyfél problémáját a
                  lassú weboldal betöltési idővel. A megoldás egy gyors, optimalizált, modern
                  weboldal fejlesztése.&quot;
                </p>
                <p className="mb-3 text-sm font-semibold text-fg">
                  Generált szöveg (részlet):
                </p>
                <p className="rounded bg-white p-4 text-sm text-fg shadow-sm">
                  &quot;Értjük, hogy a lassú weboldal betöltési idő negatívan befolyásolja az üzleti
                  teljesítményét. Megoldásunk egy gyors, optimalizált, modern weboldal fejlesztése,
                  amely jelentősen csökkenti a betöltési időt és javítja a felhasználói
                  élményt...&quot;
                </p>
              </div>
            </Card>

            <Card>
              <h3 className="mb-3 text-xl font-semibold text-fg">
                Példa 2: Szolgáltatások bemutatása
              </h3>
              <div className="rounded-lg bg-bg-muted p-6">
                <p className="mb-3 text-sm font-semibold text-fg">AI prompt:</p>
                <p className="mb-4 rounded bg-bg-muted p-3 text-sm italic text-fg">
                  &quot;Írj egy rövid, üzleti hangvételű leírást a következő szolgáltatásokról: SEO
                  optimalizálás, tartalomszabályozás, social media marketing&quot;
                </p>
                <p className="mb-3 text-sm font-semibold text-fg">
                  Generált szöveg (részlet):
                </p>
                <p className="rounded bg-white p-4 text-sm text-fg shadow-sm">
                  &quot;Kínáljuk a digitális marketing teljes spektrumát: SEO optimalizálást a
                  keresőmotorokban való jobb láthatóságért, professzionális tartalomszabályozást a
                  brand identitás erősítéséhez, valamint stratégiai social media marketinget a
                  közösségi médiában való hatékony jelenlétért...&quot;
                </p>
              </div>
            </Card>
          </div>

          {/* Placeholder for more examples */}
          <div className="my-8 rounded-lg border-2 border-dashed border-border bg-bg-muted p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-fg-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p className="mt-4 text-sm font-medium text-fg-muted">
              [Helyőrző: További AI generálás példák interaktív formában]
            </p>
            <p className="mt-2 text-xs text-fg-muted">
              Mutasd be további példákat különböző szekciókhoz és használati esetekhez
            </p>
          </div>
        </section>

        {/* Section 6: GYIK */}
        <section id="gyik" className="mb-12 scroll-mt-8">
          <H2 className="mb-4">6. Gyakran ismételt kérdések</H2>

          <div className="space-y-4">
            <Card>
              <h3 className="mb-2 text-lg font-semibold text-fg">A generált szöveg egyedi lesz?</h3>
              <p className="text-fg-muted">
                Igen, az AI minden alkalommal egyedi szövegeket generál a megadott kontextus
                alapján. A rendszer nem ismétli meg egyszerűen a korábbi szövegeket.
              </p>
            </Card>

            <Card>
              <h3 className="mb-2 text-lg font-semibold text-fg">
                Szerkeszthetőek a generált szövegek?
              </h3>
              <p className="text-fg-muted">
                Abszolút! A generált szövegek teljesen szerkeszthetőek. Az AI egy kiindulási pontot
                ad, amelyet szabadon módosíthatsz és testreszabhatsz.
              </p>
            </Card>

            <Card>
              <h3 className="mb-2 text-lg font-semibold text-fg">
                Milyen hosszú szövegeket lehet generálni?
              </h3>
              <p className="text-fg-muted">
                A Vyndi AI különböző hosszúságú szövegeket tud generálni - rövid bemutatkozó
                szövegektől hosszabb, részletes leírásokig. A hosszúságot a promptodban is
                megadhatod.
              </p>
            </Card>

            <Card>
              <h3 className="mb-2 text-lg font-semibold text-fg">
                Az AI milyen nyelveken működik?
              </h3>
              <p className="text-fg-muted">
                Jelenleg az AI magyar nyelven generál szövegeket, és folyamatosan fejlesztjük, hogy
                még jobb minőségű tartalmat készítsen.
              </p>
            </Card>

            <Card>
              <h3 className="mb-2 text-lg font-semibold text-fg">
                Van limit a generálások számára?
              </h3>
              <p className="text-fg-muted">
                Az ingyenes csomagban van egy napi limit, a Pro előfizetésben pedig nagyobb
                mennyiségű generálás lehetséges. A pontos limiteket a számlázási oldalon tekintheted
                meg.
              </p>
            </Card>
          </div>
        </section>
      </article>

      {/* CTA Section */}
      <Card className="mt-16 border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="text-center">
          <H2 className="mb-4">Próbáld ki az AI funkciót még ma!</H2>
          <p className="mb-8 text-lg text-fg-muted">
            Kezdj el ajánlatokat készíteni az AI segítségével. Ingyenes próba, bankkártya nélkül.
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

      {/* Related Resources */}
      <div className="mt-12">
        <H2 className="mb-6" size="h3">
          Kapcsolódó erőforrások
        </H2>
        <div className="grid gap-4 md:grid-cols-2">
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
          <Link href="/resources/videos/intro">
            <Card className="group h-full border-2 border-border/60 transition-all hover:border-primary/40 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-fg group-hover:text-primary transition-colors">
                    Bevezető videó
                  </h3>
                  <p className="text-sm text-fg-muted">
                    Ismerd meg a Vyndi-t és az AI funkcióit videóban.
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
