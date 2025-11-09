import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ingyenes ajánlat sablonok | Vyndi',
  description:
    'Böngészd át ingyenes, letölthető ajánlat sablonjainkat. Professzionális, testreszabható sablonok különböző iparágakhoz és projekttípusokhoz. Azonnal használható, PDF formátumban.',
  openGraph: {
    title: 'Ingyenes ajánlat sablonok | Vyndi',
    description: 'Professzionális, letölthető ajánlat sablonok ingyen.',
    type: 'website',
  },
};

export default function TemplatesPage() {
  // This would typically come from an API or database
  const templates = [
    {
      id: 'free.minimal',
      name: 'Minimális',
      description:
        'Tiszta, professzionális dizájn, amely tökéletesen megfelel az üzleti ajánlatokhoz. Egyszerű és elegáns.',
      category: 'Általános',
      tags: ['minimális', 'professzionális', 'egyszerű'],
      preview: '/templates/minimal-preview.png',
      features: ['Árazási táblázat', 'Logó támogatás', 'Egyedi színek'],
    },
  ];

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-6 pb-24 pt-16">
      {/* Breadcrumb Navigation */}
      <nav className="mb-8 text-sm text-fg-muted" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/resources" className="hover:text-primary transition-colors">
              Erőforrások
            </Link>
          </li>
          <li className="text-fg-muted">/</li>
          <li className="text-fg">Ingyenes sablonok</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <header className="mb-12 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/50 bg-purple-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-purple-700">
          Sablonok
        </span>
        <h1 className="mt-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl">
          Ingyenes ajánlat sablonok
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-xl leading-relaxed text-fg-muted">
          Böngészd át ingyenes, professzionális ajánlat sablonjainkat. Minden sablon testreszabható,
          azonnal használható, és tökéletesen megfelel az üzleti ajánlatok készítéséhez.
        </p>
      </header>

      {/* Templates Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card
            key={template.id}
            className="group relative overflow-hidden border-2 border-border/60 bg-white transition-all hover:border-primary/40 hover:shadow-xl"
          >
            {/* Preview Image Placeholder */}
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="mt-4 text-xs font-medium text-gray-500">
                    [Helyőrző: {template.name} sablon előnézet képe]
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Ajánlott: 800x1000px PDF előnézet vagy screenshot
                  </p>
                </div>
              </div>
              {/* Category Badge */}
              <div className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-700 backdrop-blur-sm">
                {template.category}
              </div>
            </div>

            {/* Template Info */}
            <div className="p-6">
              <h3 className="mb-2 text-xl font-bold text-fg group-hover:text-primary transition-colors">
                {template.name}
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-fg-muted">{template.description}</p>

              {/* Features */}
              <div className="mb-4 flex flex-wrap gap-2">
                {template.features.map((feature, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* CTA Button */}
              <Link
                href="/login?redirect=/new"
                className="block w-full rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 text-center text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
              >
                Használat indítása
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Info Section */}
      <Card className="mt-12 border-l-4 border-l-purple-500 bg-purple-50/30">
        <h2 className="mb-4 text-2xl font-bold text-fg">Hogyan használd a sablonokat?</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-2xl font-bold text-purple-600">
              1
            </div>
            <h3 className="mb-2 font-semibold text-fg">Válassz sablont</h3>
            <p className="text-sm text-fg-muted">
              Böngészd át az ingyenes sablonokat, és válaszd ki azt, amelyik a legjobban illeszkedik
              a stílusodhoz.
            </p>
          </div>
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-2xl font-bold text-purple-600">
              2
            </div>
            <h3 className="mb-2 font-semibold text-fg">Testreszabd</h3>
            <p className="text-sm text-fg-muted">
              Add meg a saját információidat, színeidet, logódat, és az AI segít generálni a
              szövegeket.
            </p>
          </div>
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-2xl font-bold text-purple-600">
              3
            </div>
            <h3 className="mb-2 font-semibold text-fg">Exportáld PDF-be</h3>
            <p className="text-sm text-fg-muted">
              Kattints egy gombra, és kész a professzionális ajánlatod PDF formátumban.
            </p>
          </div>
        </div>
      </Card>

      {/* Benefits Section */}
      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-fg">Miért válaszd a Vyndi sablonokat?</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-fg">Professzionális dizájn</h3>
                <p className="text-sm text-fg-muted">
                  Minden sablonunk professzionális dizájner által készült, és követi a legjobb UX/UI
                  gyakorlatokat.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-fg">Teljes testreszabhatóság</h3>
                <p className="text-sm text-fg-muted">
                  Módosíthatod a színeket, logót, szövegeket, és még sok mindent, hogy tökéletesen
                  illeszkedjen a brandhez.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
                <svg
                  className="h-6 w-6 text-purple-600"
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
              <div>
                <h3 className="mb-2 font-semibold text-fg">AI segítség</h3>
                <p className="text-sm text-fg-muted">
                  Használd az AI funkciót, hogy másodpercek alatt generálj professzionális
                  szövegeket a sablonokhoz.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                <svg
                  className="h-6 w-6 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-fg">Gyors és egyszerű</h3>
                <p className="text-sm text-fg-muted">
                  Percek alatt készíthetsz professzionális ajánlatot. Nincs szükség tervezői
                  tapasztalatra.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <Card className="mt-12 border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold text-fg">Kezdd el még ma!</h2>
          <p className="mb-8 text-lg text-fg-muted">
            Regisztrálj ingyenesen, és azonnal hozzáférhetsz az összes ingyenes sablonhoz.
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
              href="/resources/pro-templates"
              className="inline-flex items-center gap-2 rounded-full border-2 border-primary/40 bg-white px-8 py-4 text-base font-semibold text-primary transition-all hover:bg-primary/5"
            >
              Pro sablonok megtekintése
            </Link>
          </div>
        </div>
      </Card>

      {/* Related Resources */}
      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-fg">Kapcsolódó erőforrások</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/resources/guide">
            <Card className="group h-full border-2 border-border/60 transition-all hover:border-primary/40 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-fg group-hover:text-primary transition-colors">
                    Ajánlatkészítési útmutató
                  </h3>
                  <p className="text-sm text-fg-muted">
                    Tanuld meg, hogyan készíts tökéletes ajánlatokat.
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
          <Link href="/resources/ai-guide">
            <Card className="group h-full border-2 border-border/60 transition-all hover:border-primary/40 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-fg group-hover:text-primary transition-colors">
                    AI-alapú szöveg generálás
                  </h3>
                  <p className="text-sm text-fg-muted">
                    Használd az AI-t a sablonokhoz szövegek generálásához.
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
