import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AjĂˇnlatkĂ©szĂ­tĂ©s best practices | Vyndi Blog',
  description:
    'IparĂˇgi best practice-ek, trendek Ă©s szakĂ©rtĹ‘i tanĂˇcsok az ajĂˇnlatkĂ©szĂ­tĂ©sben. Tanuld meg a sikeres ajĂˇnlatkĂ©szĂ­tĂ©s titkait a szakĂ©rtĹ‘ktĹ‘l.',
  openGraph: {
    title: 'AjĂˇnlatkĂ©szĂ­tĂ©s best practices | Vyndi Blog',
    description: 'IparĂˇgi best practice-ek Ă©s trendek az ajĂˇnlatkĂ©szĂ­tĂ©sben.',
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
              ErĹ‘forrĂˇsok
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
          AjĂˇnlatkĂ©szĂ­tĂ©s best practices
        </h1>
        <p className="mt-4 text-xl leading-relaxed text-fg-muted">
          IparĂˇgi best practice-ek, trendek Ă©s szakĂ©rtĹ‘i tanĂˇcsok az
          ajĂˇnlatkĂ©szĂ­tĂ©sben. Tanuld meg a sikeres ajĂˇnlatkĂ©szĂ­tĂ©s titkait a
          szakĂ©rtĹ‘ktĹ‘l.
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
            <span>2024. januĂˇr</span>
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
            <span>15 perc olvasĂˇs</span>
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
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
        <p className="mt-4 text-sm font-medium text-gray-600">
          [HelyĹ‘rzĹ‘: Hero kĂ©p - Best practices infografika, iparĂˇgi trendek vagy szakĂ©rtĹ‘i
          tanĂˇcsok vizuĂˇlis ĂˇbrĂˇzolĂˇsa]
        </p>
        <p className="mt-2 text-xs text-gray-500">
          AjĂˇnlott mĂ©ret: 1200x600px, formĂˇtum: WebP vagy PNG
        </p>
      </div>

      {/* Introduction */}
      <div className="mb-12">
        <p className="text-lg leading-relaxed text-fg-muted">
          Az ajĂˇnlatkĂ©szĂ­tĂ©s folyamatosan fejlĹ‘dĹ‘ terĂĽlet, ahol a legjobb gyakorlatok,
          trendek Ă©s stratĂ©giai megkĂ¶zelĂ­tĂ©sek dĂ¶ntĹ‘en befolyĂˇsolhatjĂˇk az
          eredmĂ©nyeket. Ebben a cikkben bemutatjuk az iparĂˇg legfontosabb best practice-eit Ă©s
          trendjeit, amelyeket a sikeres vĂˇllalkozĂˇsok alkalmaznak.
        </p>
      </div>

      {/* Main Content Sections */}
      <article className="prose prose-lg max-w-none space-y-12">
        {/* Section 1: Personalization */}
        <section>
          <Card className="border-l-4 border-l-blue-500">
            <h2 className="mb-4 text-3xl font-bold text-fg">
              1. SzemĂ©lyre szabĂˇs: Az Ăşj arany standard
            </h2>
            <p className="mb-4 text-lg leading-relaxed text-fg-muted">
              A mai piacon a generikus ajĂˇnlatok mĂˇr nem elĂ©gsĂ©gesek. A legjobb gyakorlatok
              szerint minden ajĂˇnlatnak szemĂ©lyre kell szabottnak lennie az ĂĽgyfĂ©l specifikus
              igĂ©nyeihez.
            </p>
            <div className="rounded-lg bg-blue-50 p-6">
              <h3 className="mb-3 font-semibold text-fg">Gyakorlati tanĂˇcsok:</h3>
              <ul className="ml-6 list-disc space-y-2 text-fg-muted">
                <li>HasznĂˇlj az ĂĽgyfĂ©l nevĂ©t Ă©s cĂ©gnevĂ©t az ajĂˇnlatban</li>
                <li>Hivatkozz konkrĂ©t problĂ©mĂˇkra, amelyekrĹ‘l beszĂ©ltetek</li>
                <li>Mutasd be, hogy megĂ©rted az ĂĽgyfĂ©l ĂĽzleti kontextusĂˇt</li>
                <li>KĂ©szĂ­ts testreszabott megoldĂˇsokat az ĂĽgyfĂ©l egyedi igĂ©nyeihez</li>
              </ul>
            </div>
          </Card>
        </section>

        {/* Section 2: Data-Driven Approach */}
        <section>
          <Card className="border-l-4 border-l-green-500">
            <h2 className="mb-4 text-3xl font-bold text-fg">2. AdatvezĂ©relt megkĂ¶zelĂ­tĂ©s</h2>
            <p className="mb-4 text-lg leading-relaxed text-fg-muted">
              A sikeres ajĂˇnlatkĂ©szĂ­tĂ©s nem vĂ©letlen, hanem adatokon alapul. A legjobb
              cĂ©gek folyamatosan mĂ©rnek, elemeznek Ă©s optimalizĂˇlnak.
            </p>

            {/* Placeholder for data visualization */}
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
                [HelyĹ‘rzĹ‘: Infografika - AjĂˇnlat konverziĂł rĂˇtĂˇk, A/B tesztelĂ©si
                eredmĂ©nyek, mĂ©rhetĹ‘ metrikĂˇk]
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-green-50 p-4">
                <h4 className="mb-2 font-semibold text-fg">MĂ©rj le mindent</h4>
                <p className="text-sm text-fg-muted">
                  KĂ¶vess nyomon a konverziĂł rĂˇtĂˇkat, vĂˇlaszidĹ‘ket, Ă©s az ĂĽgyfelek
                  visszajelzĂ©seit.
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <h4 className="mb-2 font-semibold text-fg">Tesztelj Ă©s optimalizĂˇlj</h4>
                <p className="text-sm text-fg-muted">
                  A/B teszteld kĂĽlĂ¶nbĂ¶zĹ‘ megkĂ¶zelĂ­tĂ©seket, Ă©s folyamatosan javĂ­ts a
                  legjobb eredmĂ©nyek alapjĂˇn.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Section 3: Industry Trends */}
        <section>
          <Card className="border-l-4 border-l-purple-500">
            <h2 className="mb-4 text-3xl font-bold text-fg">
              3. AktuĂˇlis trendek az ajĂˇnlatkĂ©szĂ­tĂ©sben
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-xl font-semibold text-fg">InteraktĂ­v ajĂˇnlatok</h3>
                <p className="text-fg-muted">
                  A statikus PDF-ek helyett az interaktĂ­v, web-alapĂş ajĂˇnlatok egyre
                  nĂ©pszerĹ±bbek. Ezek lehetĹ‘vĂ© teszik az ĂĽgyfeleknek, hogy rĂ©szletesebben
                  megismerjĂ©k az ajĂˇnlatot, Ă©s azonnal reagĂˇljanak.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-xl font-semibold text-fg">
                  AI-alapĂş szĂ¶veg generĂˇlĂˇs
                </h3>
                <p className="text-fg-muted">
                  A mestersĂ©ges intelligencia egyre fontosabb szerepet jĂˇtszik az
                  ajĂˇnlatkĂ©szĂ­tĂ©sben. Az AI segĂ­t gyorsabban, hatĂ©konyabban Ă©s
                  konzisztensebben generĂˇlni a tartalmat.
                </p>
                <Link
                  href="/resources/ai-guide"
                  className="mt-2 inline-flex items-center gap-2 text-primary hover:underline"
                >
                  Tudj meg tĂ¶bbet az AI hasznĂˇlatĂˇrĂłl
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

              <div>
                <h3 className="mb-2 text-xl font-semibold text-fg">
                  Mobil-optimalizĂˇlt ajĂˇnlatok
                </h3>
                <p className="text-fg-muted">
                  Az ĂĽgyfelek egyre gyakrabban mobil eszkĂ¶zĂ¶kĂ¶n olvassĂˇk az ajĂˇnlatokat.
                  Fontos, hogy az ajĂˇnlatok tĂ¶kĂ©letesen mĹ±kĂ¶djenek Ă©s jĂłl nĂ©zzenek ki
                  mobilon is.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-xl font-semibold text-fg">
                  Video Ă©s multimĂ©dia tartalom
                </h3>
                <p className="text-fg-muted">
                  A videĂł Ă©s egyĂ©b multimĂ©dia tartalmak egyre gyakrabban kerĂĽlnek be az
                  ajĂˇnlatokba. Ezek nĂ¶velhetik az engagement-et Ă©s segĂ­thetnek jobban
                  kommunikĂˇlni az Ă©rtĂ©kajĂˇnlatot.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Section 4: Industry-Specific Practices */}
        <section>
          <Card className="border-l-4 border-l-amber-500">
            <h2 className="mb-4 text-3xl font-bold text-fg">
              4. IparĂˇgi specifikus best practice-ek
            </h2>

            <div className="space-y-6">
              <div className="rounded-lg bg-amber-50 p-6">
                <h3 className="mb-3 font-semibold text-fg">Tech Ă©s Start-up szektor</h3>
                <ul className="ml-6 list-disc space-y-2 text-fg-muted">
                  <li>HangsĂşlyozd az innovĂˇciĂłt Ă©s a technolĂłgiai elĹ‘nyĂ¶ket</li>
                  <li>
                    Mutasd be a skĂˇlĂˇzhatĂłsĂˇgot Ă©s a jĂ¶vĹ‘beli nĂ¶vekedĂ©si lehetĹ‘sĂ©geket
                  </li>
                  <li>HasznĂˇlj modern, dinamikus dizĂˇjnokat</li>
                  <li>KĂ¶zpontosĂ­ts a ROI-ra Ă©s a hosszĂş tĂˇvĂş Ă©rtĂ©kre</li>
                </ul>
              </div>

              <div className="rounded-lg bg-blue-50 p-6">
                <h3 className="mb-3 font-semibold text-fg">KreatĂ­v iparĂˇg</h3>
                <ul className="ml-6 list-disc space-y-2 text-fg-muted">
                  <li>Mutasd be a kreatĂ­v portfĂłliĂłt Ă©s a korĂˇbbi munkĂˇkat</li>
                  <li>HangsĂşlyozd az egyedi stĂ­lust Ă©s a kreatĂ­v megkĂ¶zelĂ­tĂ©st</li>
                  <li>HasznĂˇlj vizuĂˇlisan erĹ‘s, inspirĂˇlĂł dizĂˇjnokat</li>
                  <li>KĂ¶zpontosĂ­ts a storytelling-re Ă©s a narratĂ­vĂˇra</li>
                </ul>
              </div>

              <div className="rounded-lg bg-purple-50 p-6">
                <h3 className="mb-3 font-semibold text-fg">KonsultĂˇciĂłs szolgĂˇltatĂˇsok</h3>
                <ul className="ml-6 list-disc space-y-2 text-fg-muted">
                  <li>HangsĂşlyozd a szakĂ©rtelemet Ă©s a tapasztalatot</li>
                  <li>Mutasd be a korĂˇbbi sikeres projekteket Ă©s ĂĽgyfeleket</li>
                  <li>KĂ¶zpontosĂ­ts az egyedi megoldĂˇsokra Ă©s a szemĂ©lyre szabĂˇsra</li>
                  <li>BiztosĂ­tsd az ĂĽgyfeleket a hosszĂş tĂˇvĂş kapcsolatrĂłl</li>
                </ul>
              </div>
            </div>
          </Card>
        </section>

        {/* Section 5: Common Mistakes */}
        <section>
          <Card className="border-l-4 border-l-red-500 bg-red-50/30">
            <h2 className="mb-4 text-3xl font-bold text-fg">
              5. Gyakori hibĂˇk, amelyeket kerĂĽlni kell
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold text-fg">
                  âťŚ TĂşl hosszĂş vagy tĂşl rĂ¶vid ajĂˇnlatok
                </h3>
                <p className="text-fg-muted">
                  Az ajĂˇnlatnak megfelelĹ‘ hosszĂşsĂˇgĂşnak kell lennie - nem tĂşl hosszĂş, hogy ne
                  veszĂ­tse el az ĂĽgyfelet, de nem is tĂşl rĂ¶vid, hogy hiĂˇnyozzon fontos
                  informĂˇciĂł.
                </p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-fg">âťŚ HomĂˇlyos ĂˇrazĂˇs</h3>
                <p className="text-fg-muted">
                  Az ĂĽgyfeleknek egyĂ©rtelmĹ±nek kell lennie, mit kapnak Ă©s mennyiĂ©rt. KerĂĽld
                  a rejtett kĂ¶ltsĂ©geket Ă©s a homĂˇlyos ĂˇrazĂˇsi struktĂşrĂˇkat.
                </p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-fg">âťŚ HiĂˇnyzĂł call-to-action</h3>
                <p className="text-fg-muted">
                  Minden ajĂˇnlatnak egyĂ©rtelmĹ±en kell kommunikĂˇlnia, mit kell tennie az
                  ĂĽgyfĂ©lnek tovĂˇbb. HiĂˇnyzĂł vagy gyenge CTA csĂ¶kkenti a konverziĂł rĂˇtĂˇt.
                </p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-fg">âťŚ Nem szemĂ©lyre szabott tartalom</h3>
                <p className="text-fg-muted">
                  A generikus, sablonos ajĂˇnlatok kevĂ©sbĂ© hatĂ©konyak. Mindig szemĂ©lyre
                  szabd az ajĂˇnlatot az ĂĽgyfĂ©l igĂ©nyeihez.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Section 6: Future of Proposals */}
        <section>
          <Card className="border-l-4 border-l-indigo-500">
            <h2 className="mb-4 text-3xl font-bold text-fg">
              6. Az ajĂˇnlatkĂ©szĂ­tĂ©s jĂ¶vĹ‘je
            </h2>
            <p className="mb-4 text-lg leading-relaxed text-fg-muted">
              Az ajĂˇnlatkĂ©szĂ­tĂ©s folyamatosan fejlĹ‘dik. ĂŤme nĂ©hĂˇny trend, amely a
              kĂ¶zeljĂ¶vĹ‘ben vĂˇrhatĂł:
            </p>
            <ul className="ml-6 list-disc space-y-2 text-lg text-fg-muted">
              <li>
                <strong>MĂ©g nagyobb automatizĂˇlĂˇs:</strong> Az AI Ă©s az automatizĂˇlĂˇs egyre
                nagyobb szerepet fognak jĂˇtszani
              </li>
              <li>
                <strong>ValĂłs idejĹ± egyĂĽttmĹ±kĂ¶dĂ©s:</strong> Az ĂĽgyfelek valĂłs idĹ‘ben
                fogjĂˇk tudni megtekinteni Ă©s szerkeszteni az ajĂˇnlatokat
              </li>
              <li>
                <strong>IntegrĂˇlt analytics:</strong> RĂ©szletesebb adatok Ă©s elemzĂ©sek az
                ajĂˇnlat teljesĂ­tmĂ©nyĂ©rĹ‘l
              </li>
              <li>
                <strong>PersonalizĂˇciĂł a kĂ¶vetkezĹ‘ szinten:</strong> MĂ©g mĂ©lyebb szemĂ©lyre
                szabĂˇs az ĂĽgyfĂ©l adatainak felhasznĂˇlĂˇsĂˇval
              </li>
            </ul>
          </Card>
        </section>
      </article>

      {/* Summary */}
      <Card className="mt-12 border-l-4 border-l-green-500 bg-green-50/30">
        <h2 className="mb-4 text-2xl font-bold text-fg">Ă–sszegzĂ©s</h2>
        <p className="mb-4 text-lg leading-relaxed text-fg-muted">
          Az ajĂˇnlatkĂ©szĂ­tĂ©s best practice-ei folyamatosan fejlĹ‘dnek, de nĂ©hĂˇny alapelv
          idĹ‘tĂˇllĂł: szemĂ©lyre szabĂˇs, adatvezĂ©relt megkĂ¶zelĂ­tĂ©s, egyĂ©rtelmĹ±
          kommunikĂˇciĂł Ă©s folyamatos optimalizĂˇlĂˇs. Azok a vĂˇllalkozĂˇsok, amelyek ezeket a
          gyakorlatokat kĂ¶vetik, jelentĹ‘sen nĂ¶velhetik sikerĂĽk esĂ©lyĂ©t.
        </p>
        <p className="text-lg leading-relaxed text-fg-muted">
          Ne feledd: az ajĂˇnlatkĂ©szĂ­tĂ©s nem csak egy dokumentum kĂ©szĂ­tĂ©se, hanem egy
          stratĂ©giai folyamat, amely hozzĂˇjĂˇrul az ĂĽzleti nĂ¶vekedĂ©shez Ă©s a hosszĂş tĂˇvĂş
          sikerhez.
        </p>
      </Card>

      {/* CTA Section */}
      <Card className="mt-12 border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold text-fg">
            Kezdd el mĂ©g ma a best practice-ek alkalmazĂˇsĂˇt!
          </h2>
          <p className="mb-8 text-lg text-fg-muted">
            A Vyndi segĂ­t neked professzionĂˇlis ajĂˇnlatokat kĂ©szĂ­teni a legjobb gyakorlatok
            szerint. PrĂłbĂˇld ki ingyenesen!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login?redirect=/new"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              Ingyenes prĂłba indĂ­tĂˇsa
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
              href="/resources/blog/10-tips"
              className="inline-flex items-center gap-2 rounded-full border-2 border-primary/40 bg-white px-8 py-4 text-base font-semibold text-primary transition-all hover:bg-primary/5"
            >
              10 tipp a tĂ¶kĂ©letes ajĂˇnlathoz
            </Link>
          </div>
        </div>
      </Card>

      {/* Related Articles */}
      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-fg">KapcsolĂłdĂł cikkek</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/resources/blog/10-tips">
            <Card className="group h-full border-2 border-border/60 transition-all hover:border-primary/40 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-fg group-hover:text-primary transition-colors">
                    10 tipp a tĂ¶kĂ©letes ajĂˇnlathoz
                  </h3>
                  <p className="text-sm text-fg-muted">
                    Gyakorlati tanĂˇcsok a tĂ¶kĂ©letes ajĂˇnlatok kĂ©szĂ­tĂ©sĂ©hez.
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
                    AjĂˇnlatkĂ©szĂ­tĂ©si ĂştmutatĂł
                  </h3>
                  <p className="text-sm text-fg-muted">
                    Komplett ĂştmutatĂł a tĂ¶kĂ©letes ajĂˇnlatok elkĂ©szĂ­tĂ©sĂ©hez.
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
