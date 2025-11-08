import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ajánlatkészítés best practices | Vyndi Blog',
  description: 'Iparági best practice-ek, trendek és szakértői tanácsok az ajánlatkészítésben. Tanuld meg a sikeres ajánlatkészítés titkait a szakértőktől.',
  openGraph: {
    title: 'Ajánlatkészítés best practices | Vyndi Blog',
    description: 'Iparági best practice-ek és trendek az ajánlatkészítésben.',
    type: 'article',
  },
};

export default function BestPracticesPage() {
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
          <li className="text-fg">Best practices</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <header className="mb-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/50 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
          Blog cikk
        </span>
        <h1 className="mt-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl">
          Ajánlatkészítés best practices
        </h1>
        <p className="mt-4 text-xl leading-relaxed text-fg-muted">
          Iparági best practice-ek, trendek és szakértői tanácsok az ajánlatkészítésben. Tanuld meg a sikeres ajánlatkészítés titkait a szakértőktől.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-fg-muted">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>2024. január</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>15 perc olvasás</span>
          </div>
        </div>
      </header>

      {/* Featured Image Placeholder */}
      <div className="mb-12 rounded-lg border-2 border-dashed border-border bg-gray-50 p-16 text-center">
        <svg className="mx-auto h-20 w-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
        <p className="mt-4 text-sm font-medium text-gray-600">
          [Helyőrző: Hero kép - Best practices infografika, iparági trendek vagy szakértői tanácsok vizuális ábrázolása]
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Ajánlott méret: 1200x600px, formátum: WebP vagy PNG
        </p>
      </div>

      {/* Introduction */}
      <div className="mb-12">
        <p className="text-lg leading-relaxed text-fg-muted">
          Az ajánlatkészítés folyamatosan fejlődő terület, ahol a legjobb gyakorlatok, trendek és stratégiai megközelítések döntően befolyásolhatják az eredményeket. Ebben a cikkben bemutatjuk az iparág legfontosabb best practice-eit és trendjeit, amelyeket a sikeres vállalkozások alkalmaznak.
        </p>
      </div>

      {/* Main Content Sections */}
      <article className="prose prose-lg max-w-none space-y-12">
        {/* Section 1: Personalization */}
        <section>
          <Card className="border-l-4 border-l-blue-500">
            <h2 className="mb-4 text-3xl font-bold text-fg">1. Személyre szabás: Az új arany standard</h2>
            <p className="mb-4 text-lg leading-relaxed text-fg-muted">
              A mai piacon a generikus ajánlatok már nem elégségesek. A legjobb gyakorlatok szerint minden ajánlatnak személyre kell szabottnak lennie az ügyfél specifikus igényeihez.
            </p>
            <div className="rounded-lg bg-blue-50 p-6">
              <h3 className="mb-3 font-semibold text-fg">Gyakorlati tanácsok:</h3>
              <ul className="ml-6 list-disc space-y-2 text-fg-muted">
                <li>Használj az ügyfél nevét és cégnevét az ajánlatban</li>
                <li>Hivatkozz konkrét problémákra, amelyekről beszéltetek</li>
                <li>Mutasd be, hogy megérted az ügyfél üzleti kontextusát</li>
                <li>Készíts testreszabott megoldásokat az ügyfél egyedi igényeihez</li>
              </ul>
            </div>
          </Card>
        </section>

        {/* Section 2: Data-Driven Approach */}
        <section>
          <Card className="border-l-4 border-l-green-500">
            <h2 className="mb-4 text-3xl font-bold text-fg">2. Adatvezérelt megközelítés</h2>
            <p className="mb-4 text-lg leading-relaxed text-fg-muted">
              A sikeres ajánlatkészítés nem véletlen, hanem adatokon alapul. A legjobb cégek folyamatosan mérnek, elemeznek és optimalizálnak.
            </p>
            
            {/* Placeholder for data visualization */}
            <div className="my-6 rounded-lg border-2 border-dashed border-border bg-gray-50 p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="mt-4 text-sm font-medium text-gray-600">
                [Helyőrző: Infografika - Ajánlat konverzió ráták, A/B tesztelési eredmények, mérhető metrikák]
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-green-50 p-4">
                <h4 className="mb-2 font-semibold text-fg">Mérj le mindent</h4>
                <p className="text-sm text-fg-muted">
                  Kövess nyomon a konverzió rátákat, válaszidőket, és az ügyfelek visszajelzéseit.
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <h4 className="mb-2 font-semibold text-fg">Tesztelj és optimalizálj</h4>
                <p className="text-sm text-fg-muted">
                  A/B teszteld különböző megközelítéseket, és folyamatosan javíts a legjobb eredmények alapján.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Section 3: Industry Trends */}
        <section>
          <Card className="border-l-4 border-l-purple-500">
            <h2 className="mb-4 text-3xl font-bold text-fg">3. Aktuális trendek az ajánlatkészítésben</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-xl font-semibold text-fg">Interaktív ajánlatok</h3>
                <p className="text-fg-muted">
                  A statikus PDF-ek helyett az interaktív, web-alapú ajánlatok egyre népszerűbbek. Ezek lehetővé teszik az ügyfeleknek, hogy részletesebben megismerjék az ajánlatot, és azonnal reagáljanak.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-xl font-semibold text-fg">AI-alapú szöveg generálás</h3>
                <p className="text-fg-muted">
                  A mesterséges intelligencia egyre fontosabb szerepet játszik az ajánlatkészítésben. Az AI segít gyorsabban, hatékonyabban és konzisztensebben generálni a tartalmat.
                </p>
                <Link href="/resources/ai-guide" className="mt-2 inline-flex items-center gap-2 text-primary hover:underline">
                  Tudj meg többet az AI használatáról
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>

              <div>
                <h3 className="mb-2 text-xl font-semibold text-fg">Mobil-optimalizált ajánlatok</h3>
                <p className="text-fg-muted">
                  Az ügyfelek egyre gyakrabban mobil eszközökön olvassák az ajánlatokat. Fontos, hogy az ajánlatok tökéletesen működjenek és jól nézzenek ki mobilon is.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-xl font-semibold text-fg">Video és multimédia tartalom</h3>
                <p className="text-fg-muted">
                  A videó és egyéb multimédia tartalmak egyre gyakrabban kerülnek be az ajánlatokba. Ezek növelhetik az engagement-et és segíthetnek jobban kommunikálni az értékajánlatot.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Section 4: Industry-Specific Practices */}
        <section>
          <Card className="border-l-4 border-l-amber-500">
            <h2 className="mb-4 text-3xl font-bold text-fg">4. Iparági specifikus best practice-ek</h2>
            
            <div className="space-y-6">
              <div className="rounded-lg bg-amber-50 p-6">
                <h3 className="mb-3 font-semibold text-fg">Tech és Start-up szektor</h3>
                <ul className="ml-6 list-disc space-y-2 text-fg-muted">
                  <li>Hangsúlyozd az innovációt és a technológiai előnyöket</li>
                  <li>Mutasd be a skálázhatóságot és a jövőbeli növekedési lehetőségeket</li>
                  <li>Használj modern, dinamikus dizájnokat</li>
                  <li>Központosíts a ROI-ra és a hosszú távú értékre</li>
                </ul>
              </div>

              <div className="rounded-lg bg-blue-50 p-6">
                <h3 className="mb-3 font-semibold text-fg">Kreatív iparág</h3>
                <ul className="ml-6 list-disc space-y-2 text-fg-muted">
                  <li>Mutasd be a kreatív portfóliót és a korábbi munkákat</li>
                  <li>Hangsúlyozd az egyedi stílust és a kreatív megközelítést</li>
                  <li>Használj vizuálisan erős, inspiráló dizájnokat</li>
                  <li>Központosíts a storytelling-re és a narratívára</li>
                </ul>
              </div>

              <div className="rounded-lg bg-purple-50 p-6">
                <h3 className="mb-3 font-semibold text-fg">Konsultációs szolgáltatások</h3>
                <ul className="ml-6 list-disc space-y-2 text-fg-muted">
                  <li>Hangsúlyozd a szakértelemet és a tapasztalatot</li>
                  <li>Mutasd be a korábbi sikeres projekteket és ügyfeleket</li>
                  <li>Központosíts az egyedi megoldásokra és a személyre szabásra</li>
                  <li>Biztosítsd az ügyfeleket a hosszú távú kapcsolatról</li>
                </ul>
              </div>
            </div>
          </Card>
        </section>

        {/* Section 5: Common Mistakes */}
        <section>
          <Card className="border-l-4 border-l-red-500 bg-red-50/30">
            <h2 className="mb-4 text-3xl font-bold text-fg">5. Gyakori hibák, amelyeket kerülni kell</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold text-fg">❌ Túl hosszú vagy túl rövid ajánlatok</h3>
                <p className="text-fg-muted">
                  Az ajánlatnak megfelelő hosszúságúnak kell lennie - nem túl hosszú, hogy ne veszítse el az ügyfelet, de nem is túl rövid, hogy hiányozzon fontos információ.
                </p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-fg">❌ Homályos árazás</h3>
                <p className="text-fg-muted">
                  Az ügyfeleknek egyértelműnek kell lennie, mit kapnak és mennyiért. Kerüld a rejtett költségeket és a homályos árazási struktúrákat.
                </p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-fg">❌ Hiányzó call-to-action</h3>
                <p className="text-fg-muted">
                  Minden ajánlatnak egyértelműen kell kommunikálnia, mit kell tennie az ügyfélnek tovább. Hiányzó vagy gyenge CTA csökkenti a konverzió rátát.
                </p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-fg">❌ Nem személyre szabott tartalom</h3>
                <p className="text-fg-muted">
                  A generikus, sablonos ajánlatok kevésbé hatékonyak. Mindig személyre szabd az ajánlatot az ügyfél igényeihez.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Section 6: Future of Proposals */}
        <section>
          <Card className="border-l-4 border-l-indigo-500">
            <h2 className="mb-4 text-3xl font-bold text-fg">6. Az ajánlatkészítés jövője</h2>
            <p className="mb-4 text-lg leading-relaxed text-fg-muted">
              Az ajánlatkészítés folyamatosan fejlődik. Íme néhány trend, amely a közeljövőben várható:
            </p>
            <ul className="ml-6 list-disc space-y-2 text-lg text-fg-muted">
              <li><strong>Még nagyobb automatizálás:</strong> Az AI és az automatizálás egyre nagyobb szerepet fognak játszani</li>
              <li><strong>Valós idejű együttműködés:</strong> Az ügyfelek valós időben fogják tudni megtekinteni és szerkeszteni az ajánlatokat</li>
              <li><strong>Integrált analytics:</strong> Részletesebb adatok és elemzések az ajánlat teljesítményéről</li>
              <li><strong>Personalizáció a következő szinten:</strong> Még mélyebb személyre szabás az ügyfél adatainak felhasználásával</li>
            </ul>
          </Card>
        </section>
      </article>

      {/* Summary */}
      <Card className="mt-12 border-l-4 border-l-green-500 bg-green-50/30">
        <h2 className="mb-4 text-2xl font-bold text-fg">Összegzés</h2>
        <p className="mb-4 text-lg leading-relaxed text-fg-muted">
          Az ajánlatkészítés best practice-ei folyamatosan fejlődnek, de néhány alapelv időtálló: személyre szabás, adatvezérelt megközelítés, egyértelmű kommunikáció és folyamatos optimalizálás. Azok a vállalkozások, amelyek ezeket a gyakorlatokat követik, jelentősen növelhetik sikerük esélyét.
        </p>
        <p className="text-lg leading-relaxed text-fg-muted">
          Ne feledd: az ajánlatkészítés nem csak egy dokumentum készítése, hanem egy stratégiai folyamat, amely hozzájárul az üzleti növekedéshez és a hosszú távú sikerhez.
        </p>
      </Card>

      {/* CTA Section */}
      <Card className="mt-12 border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold text-fg">Kezdd el még ma a best practice-ek alkalmazását!</h2>
          <p className="mb-8 text-lg text-fg-muted">
            A Vyndi segít neked professzionális ajánlatokat készíteni a legjobb gyakorlatok szerint. Próbáld ki ingyenesen!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login?redirect=/new"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              Ingyenes próba indítása
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/resources/blog/10-tips"
              className="inline-flex items-center gap-2 rounded-full border-2 border-primary/40 bg-white px-8 py-4 text-base font-semibold text-primary transition-all hover:bg-primary/5"
            >
              10 tipp a tökéletes ajánlathoz
            </Link>
          </div>
        </div>
      </Card>

      {/* Related Articles */}
      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-fg">Kapcsolódó cikkek</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/resources/blog/10-tips">
            <Card className="group h-full border-2 border-border/60 transition-all hover:border-primary/40 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-fg group-hover:text-primary transition-colors">
                    10 tipp a tökéletes ajánlathoz
                  </h3>
                  <p className="text-sm text-fg-muted">
                    Gyakorlati tanácsok a tökéletes ajánlatok készítéséhez.
                  </p>
                </div>
                <svg className="h-5 w-5 text-fg-muted group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
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
                <svg className="h-5 w-5 text-fg-muted group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  );
}





