import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ajánlatkészítési útmutató | Vyndi',
  description:
    'Komplett útmutató a tökéletes ajánlatok elkészítéséhez. Tanulj meg professzionális, konverzióoptimalizált ajánlatokat készíteni tippekkel, trükkökkel és best practice-ekkel.',
  openGraph: {
    title: 'Ajánlatkészítési útmutató | Vyndi',
    description: 'Komplett útmutató a tökéletes ajánlatok elkészítéséhez.',
    type: 'article',
  },
};

export default function GuidePage() {
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
          <li className="text-fg">Ajánlatkészítési útmutató</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <header className="mb-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/50 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
          Útmutató
        </span>
        <h1 className="mt-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl">
          Ajánlatkészítési útmutató
        </h1>
        <p className="mt-4 text-xl leading-relaxed text-fg-muted">
          Tanulj meg professzionális, konverzióoptimalizált ajánlatokat készíteni, amelyek segítenek
          több megbízást szerezni és az üzleti növekedést gyorsítani.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-fg-muted">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>10 perc olvasás</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span>Gyakorlati útmutató</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <article className="prose prose-lg max-w-none">
        {/* Section 1: Bevezetés */}
        <section id="bevezetes" className="mb-12 scroll-mt-8">
          <h2 className="mb-4 text-3xl font-bold text-fg">1. Bevezetés</h2>
          <p className="mb-4 text-lg leading-relaxed text-fg-muted">
            Az ajánlatkészítés nem csupán árak és szolgáltatások listája. Ez egy stratégiai üzleti
            dokumentum, amely bemutatja vállalkozásodat, kommunikálja az értéket, és meggyőzi a
            potenciális ügyfeleket, hogy veled dolgozzanak.
          </p>
          <p className="mb-6 text-lg leading-relaxed text-fg-muted">
            Jól elkészített ajánlat jelentősen növelheti a megbízások számát és az üzleti sikereket.
            Ebben az útmutatóban végigvezetünk az ajánlatkészítés minden fontos lépésén.
          </p>

          {/* Placeholder for hero image */}
          <div className="my-8 rounded-lg border-2 border-dashed border-border bg-gray-50 p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
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
              [Helyőrző: Kép egy professzionális ajánlatról, amely a Vyndi platformon készült]
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Ajánlott méret: 1200x600px, formátum: WebP vagy PNG
            </p>
          </div>
        </section>

        {/* Section 2: Struktúra */}
        <section id="struktura" className="mb-12 scroll-mt-8">
          <h2 className="mb-4 text-3xl font-bold text-fg">2. Az ajánlat struktúrája</h2>
          <p className="mb-6 text-lg leading-relaxed text-fg-muted">
            Minden hatékony ajánlat következetes struktúrát követ. Íme a legfontosabb részek:
          </p>

          <div className="space-y-6">
            <Card className="border-l-4 border-l-green-500">
              <h3 className="mb-2 text-xl font-semibold text-fg">2.1. Fedőlap és bemutatkozás</h3>
              <p className="mb-3 text-fg-muted">
                Az első benyomás döntő fontosságú. Fedőlapodon szerepeljen:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-fg-muted">
                <li>Céged neve és logója</li>
                <li>Az ajánlat címének egyértelmű megfogalmazása</li>
                <li>Az ügyfél neve vagy cégneve</li>
                <li>Az ajánlat dátum</li>
                <li>Egy rövid, vonzó értékajánlat vagy slogán</li>
              </ul>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <h3 className="mb-2 text-xl font-semibold text-fg">2.2. Probléma azonosítása</h3>
              <p className="mb-3 text-fg-muted">
                Mutasd be, hogy érted az ügyfél problémáját és kihívásait. Ez bizalmat épít és
                személyre szabott megoldást kínálsz.
              </p>
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-900">💡 Tipp:</p>
                <p className="mt-1 text-sm text-blue-800">
                  Kérdezd meg az ügyfelet a projekt indításakor, hogy mi a legnagyobb kihívásuk, és
                  használd ezt az ajánlatban!
                </p>
              </div>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <h3 className="mb-2 text-xl font-semibold text-fg">2.3. Megoldás bemutatása</h3>
              <p className="mb-3 text-fg-muted">
                Részletesen ismertesd, hogyan oldod meg az ügyfél problémáját. Használj konkrét
                példákat és mérhető eredményeket.
              </p>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <h3 className="mb-2 text-xl font-semibold text-fg">
                2.4. Szolgáltatások részletezése
              </h3>
              <p className="mb-3 text-fg-muted">
                Listázd pontosan, mit kapsz az ajánlatban. Legyen egyértelmű, átlátható és
                részletes.
              </p>
            </Card>
          </div>
        </section>

        {/* Section 3: Szövegírás */}
        <section id="szovegiras" className="mb-12 scroll-mt-8">
          <h2 className="mb-4 text-3xl font-bold text-fg">3. Szövegírás és kommunikáció</h2>

          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-xl font-semibold text-fg">
                3.1. Ügyfélközpontú nyelvhasználat
              </h3>
              <p className="mb-4 text-fg-muted">
                Írj az ügyfél szemszögéből. Helyett, hogy &quot;Mi ezt és ezt kínáljuk&quot;,
                használd a &quot;Ön ezt és ezt kapja&quot; megközelítést.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-red-200 bg-red-50">
                  <p className="mb-2 text-xs font-semibold uppercase text-red-700">❌ Kerüld</p>
                  <p className="text-sm text-red-900">
                    &quot;Mi egy professzionális weboldalt készítünk Önnek.&quot;
                  </p>
                </Card>
                <Card className="border-green-200 bg-green-50">
                  <p className="mb-2 text-xs font-semibold uppercase text-green-700">✅ Használd</p>
                  <p className="text-sm text-green-900">
                    &quot;Ön egy professzionális weboldalt kap, amely növeli online
                    jelenlétét.&quot;
                  </p>
                </Card>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xl font-semibold text-fg">
                3.2. Konkrét értékek kommunikálása
              </h3>
              <p className="mb-4 text-fg-muted">
                Kerüld a floskulákat. Használj konkrét számokat, mérhető eredményeket és valós
                példákat.
              </p>

              {/* Placeholder for comparison chart */}
              <div className="my-6 rounded-lg border-2 border-dashed border-border bg-gray-50 p-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="mt-4 text-sm font-medium text-gray-600">
                  [Helyőrző: Infografika - &quot;Flozkulák vs. konkrét értékek&quot; összehasonlító
                  táblázat]
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Ajánlott: interaktív, színes infografika konkrét példákkal
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xl font-semibold text-fg">3.3. AI-alapú szöveg generálás</h3>
              <p className="mb-4 text-fg-muted">
                A Vyndi AI funkciója segít professzionális szövegeket generálni másodpercek alatt.
                Tanuld meg a hatékony használatát:
              </p>
              <Link
                href="/resources/ai-guide"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                Olvass tovább az AI útmutatóban
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Section 4: Árazás */}
        <section id="arak" className="mb-12 scroll-mt-8">
          <h2 className="mb-4 text-3xl font-bold text-fg">4. Árazás és csomagolás</h2>

          <div className="space-y-6">
            <Card>
              <h3 className="mb-3 text-xl font-semibold text-fg">4.1. Árazási stratégiák</h3>
              <p className="mb-4 text-fg-muted">
                Az árazás nem csak a számokról szól. Íme néhány hatékony stratégia:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-fg-muted">
                <li>
                  <strong>Csomagolás:</strong> Kínálj 3 opciót (alap, prémium, enterprise) - a
                  középső általában a legnépszerűbb
                </li>
                <li>
                  <strong>Értékajánlat:</strong> Mutasd be, mennyi időt és pénzt takarít meg az
                  ügyfél
                </li>
                <li>
                  <strong>Transzparencia:</strong> Törj le az árakat konkrét szolgáltatásokra
                </li>
                <li>
                  <strong>ROI mutatása:</strong> Számold ki és mutasd be a megtérülési időt
                </li>
              </ul>
            </Card>

            <Card>
              <h3 className="mb-3 text-xl font-semibold text-fg">4.2. Árazási táblázat design</h3>
              <p className="mb-4 text-fg-muted">
                A jól tervezett árazási táblázat segít az ügyfeleknek könnyen összehasonlítani az
                opciókat.
              </p>

              {/* Placeholder for pricing table example */}
              <div className="my-6 rounded-lg border-2 border-dashed border-border bg-gray-50 p-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <p className="mt-4 text-sm font-medium text-gray-600">
                  [Helyőrző: Képernyőkép egy professzionális árazási táblázatról a Vyndi sablonból]
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Mutasd be, hogyan néz ki egy jól strukturált árazási táblázat
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* Section 5: Vizuális */}
        <section id="vizualis" className="mb-12 scroll-mt-8">
          <h2 className="mb-4 text-3xl font-bold text-fg">5. Vizuális prezentáció</h2>

          <div className="space-y-6">
            <Card>
              <h3 className="mb-3 text-xl font-semibold text-fg">5.1. Dizájn elvek</h3>
              <ul className="ml-6 list-disc space-y-2 text-fg-muted">
                <li>
                  <strong>Konzisztencia:</strong> Használj következetes színeket, betűtípusokat és
                  stílust
                </li>
                <li>
                  <strong>Fehér tér:</strong> Ne tömj tele az oldalt információval
                </li>
                <li>
                  <strong>Hierarchia:</strong> Emeld ki a fontos információkat
                </li>
                <li>
                  <strong>Olvashatóság:</strong> Használj nagyobb betűméreteket és megfelelő
                  kontrasztot
                </li>
              </ul>
            </Card>

            <Card>
              <h3 className="mb-3 text-xl font-semibold text-fg">5.2. Képek és grafikonok</h3>
              <p className="mb-4 text-fg-muted">
                A megfelelő képek és infografikák jelentősen fokozhatják az ajánlat hatékonyságát.
              </p>

              {/* Placeholder for visual examples */}
              <div className="my-6 rounded-lg border-2 border-dashed border-border bg-gray-50 p-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                  [Helyőrző: Kollázs különböző ajánlat sablonokról, infografikákról és vizuális
                  elemekről]
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Mutasd be a Vyndi sablonok vizuális elemeit
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* Section 6: CTA */}
        <section id="kovetkezmenyek" className="mb-12 scroll-mt-8">
          <h2 className="mb-4 text-3xl font-bold text-fg">6. Következő lépések és CTA</h2>

          <Card className="border-l-4 border-l-primary bg-primary/5">
            <h3 className="mb-3 text-xl font-semibold text-fg">Hatékony Call-to-Action (CTA)</h3>
            <p className="mb-4 text-fg-muted">
              Minden ajánlatnak egyértelműen kell kommunikálnia, mit kell tennie az ügyfélnek
              tovább.
            </p>
            <ul className="ml-6 list-disc space-y-2 text-fg-muted">
              <li>
                Használj aktív, cselekvési szavakat (&quot;Kezdjük el&quot;, &quot;Foglald le&quot;,
                &quot;Válaszolj&quot;)
              </li>
              <li>Legyen egyértelmű a következő lépés</li>
              <li>Add meg az elérhetőségeidet</li>
              <li>Kínálj valamilyen plusz értéket (ingyenes konzultáció, kedvezmény, stb.)</li>
            </ul>
          </Card>
        </section>

        {/* Section 7: Összegzés */}
        <section id="osszegzes" className="mb-12 scroll-mt-8">
          <h2 className="mb-4 text-3xl font-bold text-fg">7. Összegzés</h2>
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
            <p className="mb-4 text-lg font-semibold text-fg">
              A tökéletes ajánlat kulcsfontosságú elemei:
            </p>
            <ol className="ml-6 list-decimal space-y-2 text-fg-muted">
              <li>Világos struktúra és logikus áramlás</li>
              <li>Ügyfélközpontú kommunikáció</li>
              <li>Konkrét értékek és mérhető eredmények</li>
              <li>Professzionális vizuális prezentáció</li>
              <li>Egyértelmű call-to-action</li>
            </ol>
          </Card>
        </section>
      </article>

      {/* CTA Section */}
      <Card className="mt-16 border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold text-fg">Készítsd el első ajánlatodat ma!</h2>
          <p className="mb-8 text-lg text-fg-muted">
            A Vyndi segít neked professzionális ajánlatokat készíteni percek alatt. Próbáld ki
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
          </div>
        </div>
      </Card>

      {/* Related Resources */}
      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-fg">Kapcsolódó erőforrások</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/resources/ai-guide">
            <Card className="group h-full border-2 border-border/60 transition-all hover:border-primary/40 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-fg group-hover:text-primary transition-colors">
                    AI-alapú szöveg generálás használata
                  </h3>
                  <p className="text-sm text-fg-muted">
                    Tanuld meg, hogyan használd hatékonyan az AI funkciókat az ajánlatkészítésben.
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
        </div>
      </div>
    </main>
  );
}
