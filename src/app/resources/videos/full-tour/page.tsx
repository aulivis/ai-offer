import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teljes funkciĂł bemutatĂł - Vyndi | Vyndi',
  description:
    'RĂ©szletes ĂştmutatĂł a Vyndi minden funkciĂłjĂˇrĂłl. Tanuld meg, hogyan hasznĂˇld hatĂ©konyan a platformot az ajĂˇnlatkĂ©szĂ­tĂ©s minden lĂ©pĂ©sĂ©ben.',
  openGraph: {
    title: 'Teljes funkciĂł bemutatĂł - Vyndi | Vyndi',
    description: 'RĂ©szletes ĂştmutatĂł minden funkciĂłrĂłl.',
    type: 'video.other',
  },
};

export default function FullTourPage() {
  const chapters = [
    {
      time: '0:00',
      title: 'BevezetĂ©s Ă©s ĂˇttekintĂ©s',
      description: 'A Vyndi platform ĂˇttekintĂ©se Ă©s fĹ‘bb funkciĂłk bemutatĂˇsa.',
    },
    {
      time: '2:30',
      title: 'RegisztrĂˇciĂł Ă©s beĂˇllĂ­tĂˇsok',
      description: 'Hogyan regisztrĂˇlj Ă©s ĂˇllĂ­tsd be a fiĂłkodat.',
    },
    {
      time: '5:00',
      title: 'Ăšj ajĂˇnlat lĂ©trehozĂˇsa',
      description: 'LĂ©pĂ©srĹ‘l lĂ©pĂ©sre ĂştmutatĂł az elsĹ‘ ajĂˇnlat kĂ©szĂ­tĂ©sĂ©hez.',
    },
    {
      time: '8:30',
      title: 'AI-alapĂş szĂ¶veg generĂˇlĂˇs',
      description: 'RĂ©szletes bemutatĂˇs az AI funkciĂł hasznĂˇlatĂˇrĂłl.',
    },
    {
      time: '12:00',
      title: 'Sablonok Ă©s testreszabĂˇs',
      description: 'Hogyan vĂˇlassz sablont Ă©s testreszabd az ajĂˇnlatodat.',
    },
    {
      time: '15:30',
      title: 'ĂrazĂˇs Ă©s csomagolĂˇs',
      description: 'ĂrazĂˇsi tĂˇblĂˇzatok lĂ©trehozĂˇsa Ă©s csomagolĂˇs beĂˇllĂ­tĂˇsa.',
    },
    {
      time: '18:00',
      title: 'ElĹ‘nĂ©zet Ă©s export',
      description: 'Az ajĂˇnlat elĹ‘nĂ©zete Ă©s PDF exportĂˇlĂˇsa.',
    },
    {
      time: '20:00',
      title: 'Tippek Ă©s trĂĽkkĂ¶k',
      description: 'Pro tippek a legjobb eredmĂ©nyekhez.',
    },
  ];

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
            <Link href="/resources/videos" className="hover:text-primary transition-colors">
              VideĂłk
            </Link>
          </li>
          <li className="text-fg-muted">/</li>
          <li className="text-fg">Teljes funkciĂł bemutatĂł</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <header className="mb-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-danger/50 bg-danger/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-danger">
          VideĂł
        </span>
        <h1 className="mt-6 bg-gradient-to-r from-primary-ink via-primary-ink/90 to-primary-ink bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl">
          Teljes funkciĂł bemutatĂł
        </h1>
        <p className="mt-4 text-xl leading-relaxed text-fg-muted">
          RĂ©szletes ĂştmutatĂł a Vyndi minden funkciĂłjĂˇrĂłl. Tanuld meg, hogyan hasznĂˇld
          hatĂ©konyan a platformot az ajĂˇnlatkĂ©szĂ­tĂ©s minden lĂ©pĂ©sĂ©ben.
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
            <span>22 perc</span>
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
            <span>RĂ©szletes ĂştmutatĂł</span>
          </div>
        </div>
      </header>

      {/* Video Player Placeholder */}
      <Card className="mb-12 overflow-hidden">
        <div className="relative aspect-video w-full bg-gradient-to-br from-primary-ink to-primary-ink/80">
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <svg
                className="mx-auto h-20 w-20 text-white/80"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-4 text-lg font-medium text-white">
                [HelyĹ‘rzĹ‘: Video player - Vyndi teljes funkciĂł bemutatĂł]
              </p>
              <p className="mt-2 text-sm text-white/70">
                VideĂł hossza: 22 perc | FormĂˇtum: MP4 vagy YouTube embed
              </p>
              <p className="mt-4 text-xs text-white/60">
                A videĂł tartalmazza: Platform ĂˇttekintĂ©s, rĂ©szletes funkciĂł bemutatĂˇsok,
                lĂ©pĂ©srĹ‘l lĂ©pĂ©sre ĂştmutatĂłk, pro tippek
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
        <h2 className="mb-6 text-2xl font-bold text-fg">VideĂł fejezetek</h2>
        <div className="space-y-4">
          {chapters.map((chapter, index) => (
            <div
              key={index}
              className="flex gap-4 rounded-lg border border-border p-4 transition-all hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 font-mono text-sm font-bold text-danger">
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
      <Card className="mb-12 border-l-4 border-l-success bg-success/10/30">
        <h2 className="mb-4 text-2xl font-bold text-fg">Mit fogsz megtanulni?</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3">
            <svg
              className="h-6 w-6 flex-shrink-0 text-success"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-fg">Platform hasznĂˇlata</h3>
              <p className="text-sm text-fg-muted">Ismerd meg az Ă¶sszes alapfunkciĂłt</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg
              className="h-6 w-6 flex-shrink-0 text-success"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-fg">AI funkciĂłk</h3>
              <p className="text-sm text-fg-muted">Tanuld meg az AI hatĂ©kony hasznĂˇlatĂˇt</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg
              className="h-6 w-6 flex-shrink-0 text-success"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-fg">Sablon testreszabĂˇs</h3>
              <p className="text-sm text-fg-muted">Hogyan ĂˇllĂ­tsd be a sablonokat</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg
              className="h-6 w-6 flex-shrink-0 text-success"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-fg">Pro tippek</h3>
              <p className="text-sm text-fg-muted">Tanulj a szakĂ©rtĹ‘ktĹ‘l</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Additional Resources */}
      <Card className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-fg">TovĂˇbbi forrĂˇsok</h2>
        <p className="mb-4 text-fg-muted">
          A videĂł megtekintĂ©se utĂˇn olvasd el ezeket a rĂ©szletes ĂştmutatĂłkat is:
        </p>
        <div className="space-y-3">
          <Link
            href="/resources/guide"
            className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:border-primary/40 hover:bg-primary/5"
          >
            <div>
              <h3 className="font-semibold text-fg">AjĂˇnlatkĂ©szĂ­tĂ©si ĂştmutatĂł</h3>
              <p className="text-sm text-fg-muted">
                Komplett ĂştmutatĂł a tĂ¶kĂ©letes ajĂˇnlatok elkĂ©szĂ­tĂ©sĂ©hez
              </p>
            </div>
            <svg
              className="h-5 w-5 text-fg-muted"
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
          </Link>
          <Link
            href="/resources/ai-guide"
            className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:border-primary/40 hover:bg-primary/5"
          >
            <div>
              <h3 className="font-semibold text-fg">AI-alapĂş szĂ¶veg generĂˇlĂˇs</h3>
              <p className="text-sm text-fg-muted">
                RĂ©szletes ĂştmutatĂł az AI funkciĂłk hasznĂˇlatĂˇhoz
              </p>
            </div>
            <svg
              className="h-5 w-5 text-fg-muted"
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
          </Link>
        </div>
      </Card>

      {/* CTA Section */}
      <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold text-fg">Kezdd el a hasznĂˇlatot!</h2>
          <p className="mb-8 text-lg text-fg-muted">
            Most, hogy megismerted a Vyndi-t, regisztrĂˇlj Ă©s kezdj el ajĂˇnlatokat kĂ©szĂ­teni.
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
              href="/resources/videos/intro"
              className="inline-flex items-center gap-2 rounded-full border-2 border-primary/40 bg-white px-8 py-4 text-base font-semibold text-primary transition-all hover:bg-primary/5"
            >
              BevezetĹ‘ videĂł
            </Link>
          </div>
        </div>
      </Card>

      {/* Related Resources */}
      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-fg">KapcsolĂłdĂł erĹ‘forrĂˇsok</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/resources/videos/intro">
            <Card className="group h-full border-2 border-border/60 transition-all hover:border-primary/40 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-fg group-hover:text-primary transition-colors">
                    BevezetĹ‘ videĂł
                  </h3>
                  <p className="text-sm text-fg-muted">Ismerd meg a Vyndi-t 5 percben.</p>
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
