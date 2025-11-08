import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bevezető videó - Ismerd meg a Vyndi-t | Vyndi',
  description: 'Ismerd meg a Vyndi-t 5 percben. Ez a bevezető videó bemutatja a platform főbb funkcióit, és segít megérteni, hogyan segíthet a professzionális ajánlatok készítésében.',
  openGraph: {
    title: 'Bevezető videó - Ismerd meg a Vyndi-t | Vyndi',
    description: 'Ismerd meg a Vyndi-t 5 percben.',
    type: 'video.other',
  },
};

export default function IntroVideoPage() {
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
            <Link href="/resources/videos" className="hover:text-primary transition-colors">
              Videók
            </Link>
          </li>
          <li className="text-fg-muted">/</li>
          <li className="text-fg">Bevezető videó</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <header className="mb-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-red-500/50 bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-red-700">
          Videó
        </span>
        <h1 className="mt-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl">
          Bevezető videó
        </h1>
        <p className="mt-4 text-xl leading-relaxed text-fg-muted">
          Ismerd meg a Vyndi-t 5 percben. Ez a bevezető videó bemutatja a platform főbb funkcióit, és segít megérteni, hogyan segíthet a professzionális ajánlatok készítésében.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-fg-muted">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>5 perc</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Bevezető</span>
          </div>
        </div>
      </header>

      {/* Video Player Placeholder */}
      <Card className="mb-12 overflow-hidden">
        <div className="relative aspect-video w-full bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto h-20 w-20 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-4 text-lg font-medium text-white">
                [Helyőrző: Video player - Vyndi bevezető videó]
              </p>
              <p className="mt-2 text-sm text-white/70">
                Videó hossza: 5 perc | Formátum: MP4 vagy YouTube embed
              </p>
              <p className="mt-4 text-xs text-white/60">
                A videó tartalmazza: Platform áttekintés, főbb funkciók bemutatása, gyors demo, használati példák
              </p>
            </div>
          </div>
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/30">
              <svg className="ml-1 h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      </Card>

      {/* Video Description */}
      <Card className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-fg">Videó tartalma</h2>
        <p className="mb-4 text-lg leading-relaxed text-fg-muted">
          Ez a bevezető videó áttekintést nyújt a Vyndi platformról és bemutatja, hogyan segíthet neked professzionális ajánlatokat készíteni percek alatt.
        </p>
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 font-semibold text-fg">A videóban látni fogod:</h3>
            <ul className="ml-6 list-disc space-y-2 text-fg-muted">
              <li>Platform áttekintés és főbb funkciók</li>
              <li>Gyors demo - hogyan készíts ajánlatot</li>
              <li>AI-alapú szöveg generálás bemutatása</li>
              <li>Sablonok és testreszabási lehetőségek</li>
              <li>PDF export és megosztási lehetőségek</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Key Features Highlighted in Video */}
      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-bold text-fg">Főbb funkciók a videóban</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-fg">Gyors ajánlatkészítés</h3>
                <p className="text-sm text-fg-muted">
                  Tanuld meg, hogyan készíthetsz professzionális ajánlatot percek alatt a Vyndi segítségével.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-fg">AI-alapú szöveg generálás</h3>
                <p className="text-sm text-fg-muted">
                  Nézd meg, hogyan működik az AI funkció, és hogyan generálhatsz professzionális szövegeket másodpercek alatt.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-fg">Sablonok és testreszabás</h3>
                <p className="text-sm text-fg-muted">
                  Ismerd meg a különböző sablonokat és a testreszabási lehetőségeket.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-fg">PDF export</h3>
                <p className="text-sm text-fg-muted">
                  Nézd meg, hogyan exportálhatod az ajánlatodat professzionális PDF formátumban.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Next Steps */}
      <Card className="mb-12 border-l-4 border-l-blue-500 bg-blue-50/30">
        <h2 className="mb-4 text-2xl font-bold text-fg">Következő lépések</h2>
        <p className="mb-4 text-fg-muted">
          Most, hogy megismerkedtél a Vyndi-vel, itt az ideje, hogy elkezdd használni:
        </p>
        <ol className="ml-6 list-decimal space-y-2 text-fg-muted">
          <li>Regisztrálj egy ingyenes fiókot</li>
          <li>Készítsd el első ajánlatodat</li>
          <li>Nézd meg a részletes útmutatókat</li>
          <li>Fedezd fel az összes funkciót</li>
        </ol>
      </Card>

      {/* CTA Section */}
      <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold text-fg">Készen állsz a kezdésre?</h2>
          <p className="mb-8 text-lg text-fg-muted">
            Regisztrálj ingyenesen, és azonnal elkezdhetsz professzionális ajánlatokat készíteni.
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
              href="/resources/videos/full-tour"
              className="inline-flex items-center gap-2 rounded-full border-2 border-primary/40 bg-white px-8 py-4 text-base font-semibold text-primary transition-all hover:bg-primary/5"
            >
              Teljes funkció bemutató
            </Link>
          </div>
        </div>
      </Card>

      {/* Related Resources */}
      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-fg">Kapcsolódó erőforrások</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/resources/videos/full-tour">
            <Card className="group h-full border-2 border-border/60 transition-all hover:border-primary/40 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-fg group-hover:text-primary transition-colors">
                    Teljes funkció bemutató
                  </h3>
                  <p className="text-sm text-fg-muted">
                    Részletes útmutató minden funkcióról.
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







