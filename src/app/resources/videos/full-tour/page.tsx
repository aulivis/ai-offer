import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teljes funkció bemutató - Vyndi | Vyndi',
  description: 'Részletes útmutató a Vyndi minden funkciójáról. Tanuld meg, hogyan használd hatékonyan a platformot az ajánlatkészítés minden lépésében.',
  openGraph: {
    title: 'Teljes funkció bemutató - Vyndi | Vyndi',
    description: 'Részletes útmutató minden funkcióról.',
    type: 'video.other',
  },
};

export default function FullTourPage() {
  const chapters = [
    {
      time: '0:00',
      title: 'Bevezetés és áttekintés',
      description: 'A Vyndi platform áttekintése és főbb funkciók bemutatása.',
    },
    {
      time: '2:30',
      title: 'Regisztráció és beállítások',
      description: 'Hogyan regisztrálj és állítsd be a fiókodat.',
    },
    {
      time: '5:00',
      title: 'Új ajánlat létrehozása',
      description: 'Lépésről lépésre útmutató az első ajánlat készítéséhez.',
    },
    {
      time: '8:30',
      title: 'AI-alapú szöveg generálás',
      description: 'Részletes bemutatás az AI funkció használatáról.',
    },
    {
      time: '12:00',
      title: 'Sablonok és testreszabás',
      description: 'Hogyan válassz sablont és testreszabd az ajánlatodat.',
    },
    {
      time: '15:30',
      title: 'Árazás és csomagolás',
      description: 'Árazási táblázatok létrehozása és csomagolás beállítása.',
    },
    {
      time: '18:00',
      title: 'Előnézet és export',
      description: 'Az ajánlat előnézete és PDF exportálása.',
    },
    {
      time: '20:00',
      title: 'Tippek és trükkök',
      description: 'Pro tippek a legjobb eredményekhez.',
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
            <Link href="/resources/videos" className="hover:text-primary transition-colors">
              Videók
            </Link>
          </li>
          <li className="text-fg-muted">/</li>
          <li className="text-fg">Teljes funkció bemutató</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <header className="mb-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-red-500/50 bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-red-700">
          Videó
        </span>
        <h1 className="mt-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl">
          Teljes funkció bemutató
        </h1>
        <p className="mt-4 text-xl leading-relaxed text-fg-muted">
          Részletes útmutató a Vyndi minden funkciójáról. Tanuld meg, hogyan használd hatékonyan a platformot az ajánlatkészítés minden lépésében.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-fg-muted">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>22 perc</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>Részletes útmutató</span>
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
                [Helyőrző: Video player - Vyndi teljes funkció bemutató]
              </p>
              <p className="mt-2 text-sm text-white/70">
                Videó hossza: 22 perc | Formátum: MP4 vagy YouTube embed
              </p>
              <p className="mt-4 text-xs text-white/60">
                A videó tartalmazza: Platform áttekintés, részletes funkció bemutatások, lépésről lépésre útmutatók, pro tippek
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

      {/* Video Chapters */}
      <Card className="mb-12">
        <h2 className="mb-6 text-2xl font-bold text-fg">Videó fejezetek</h2>
        <div className="space-y-4">
          {chapters.map((chapter, index) => (
            <div key={index} className="flex gap-4 rounded-lg border border-border p-4 transition-all hover:border-primary/40 hover:bg-primary/5">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 font-mono text-sm font-bold text-red-600">
                  {chapter.time}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="mb-1 font-semibold text-fg">{chapter.title}</h3>
                <p className="text-sm text-fg-muted">{chapter.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* What You'll Learn */}
      <Card className="mb-12 border-l-4 border-l-green-500 bg-green-50/30">
        <h2 className="mb-4 text-2xl font-bold text-fg">Mit fogsz megtanulni?</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-fg">Platform használata</h3>
              <p className="text-sm text-fg-muted">Ismerd meg az összes alapfunkciót</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-fg">AI funkciók</h3>
              <p className="text-sm text-fg-muted">Tanuld meg az AI hatékony használatát</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-fg">Sablon testreszabás</h3>
              <p className="text-sm text-fg-muted">Hogyan állítsd be a sablonokat</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-fg">Pro tippek</h3>
              <p className="text-sm text-fg-muted">Tanulj a szakértőktől</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Additional Resources */}
      <Card className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-fg">További források</h2>
        <p className="mb-4 text-fg-muted">
          A videó megtekintése után olvasd el ezeket a részletes útmutatókat is:
        </p>
        <div className="space-y-3">
          <Link href="/resources/guide" className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:border-primary/40 hover:bg-primary/5">
            <div>
              <h3 className="font-semibold text-fg">Ajánlatkészítési útmutató</h3>
              <p className="text-sm text-fg-muted">Komplett útmutató a tökéletes ajánlatok elkészítéséhez</p>
            </div>
            <svg className="h-5 w-5 text-fg-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link href="/resources/ai-guide" className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:border-primary/40 hover:bg-primary/5">
            <div>
              <h3 className="font-semibold text-fg">AI-alapú szöveg generálás</h3>
              <p className="text-sm text-fg-muted">Részletes útmutató az AI funkciók használatához</p>
            </div>
            <svg className="h-5 w-5 text-fg-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </Card>

      {/* CTA Section */}
      <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold text-fg">Kezdd el a használatot!</h2>
          <p className="mb-8 text-lg text-fg-muted">
            Most, hogy megismerted a Vyndi-t, regisztrálj és kezdj el ajánlatokat készíteni.
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
              href="/resources/videos/intro"
              className="inline-flex items-center gap-2 rounded-full border-2 border-primary/40 bg-white px-8 py-4 text-base font-semibold text-primary transition-all hover:bg-primary/5"
            >
              Bevezető videó
            </Link>
          </div>
        </div>
      </Card>

      {/* Related Resources */}
      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-fg">Kapcsolódó erőforrások</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/resources/videos/intro">
            <Card className="group h-full border-2 border-border/60 transition-all hover:border-primary/40 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-fg group-hover:text-primary transition-colors">
                    Bevezető videó
                  </h3>
                  <p className="text-sm text-fg-muted">
                    Ismerd meg a Vyndi-t 5 percben.
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





