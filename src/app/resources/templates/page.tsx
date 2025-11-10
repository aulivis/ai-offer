import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ingyenes ajĂˇnlat sablonok | Vyndi',
  description:
    'BĂ¶ngĂ©szd Ăˇt ingyenes, letĂ¶lthetĹ‘ ajĂˇnlat sablonjainkat. ProfesszionĂˇlis, testreszabhatĂł sablonok kĂĽlĂ¶nbĂ¶zĹ‘ iparĂˇgakhoz Ă©s projekttĂ­pusokhoz. Azonnal hasznĂˇlhatĂł, PDF formĂˇtumban.',
  openGraph: {
    title: 'Ingyenes ajĂˇnlat sablonok | Vyndi',
    description: 'ProfesszionĂˇlis, letĂ¶lthetĹ‘ ajĂˇnlat sablonok ingyen.',
    type: 'website',
  },
};

export default function TemplatesPage() {
  // This would typically come from an API or database
  const templates = [
    {
      id: 'free.minimal',
      name: 'MinimĂˇlis',
      description:
        'Tiszta, professzionĂˇlis dizĂˇjn, amely tĂ¶kĂ©letesen megfelel az ĂĽzleti ajĂˇnlatokhoz. EgyszerĹ± Ă©s elegĂˇns.',
      category: 'ĂltalĂˇnos',
      tags: ['minimĂˇlis', 'professzionĂˇlis', 'egyszerĹ±'],
      preview: '/templates/minimal-preview.png',
      features: ['ĂrazĂˇsi tĂˇblĂˇzat', 'LogĂł tĂˇmogatĂˇs', 'Egyedi szĂ­nek'],
    },
  ];

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-6 pb-24 pt-16">
      {/* Breadcrumb Navigation */}
      <nav className="mb-8 text-sm text-fg-muted" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/resources" className="hover:text-primary transition-colors">
              ErĹ‘forrĂˇsok
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
          Ingyenes ajĂˇnlat sablonok
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-xl leading-relaxed text-fg-muted">
          BĂ¶ngĂ©szd Ăˇt ingyenes, professzionĂˇlis ajĂˇnlat sablonjainkat. Minden sablon
          testreszabhatĂł, azonnal hasznĂˇlhatĂł, Ă©s tĂ¶kĂ©letesen megfelel az ĂĽzleti ajĂˇnlatok
          kĂ©szĂ­tĂ©sĂ©hez.
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
                    [HelyĹ‘rzĹ‘: {template.name} sablon elĹ‘nĂ©zet kĂ©pe]
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    AjĂˇnlott: 800x1000px PDF elĹ‘nĂ©zet vagy screenshot
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
                HasznĂˇlat indĂ­tĂˇsa
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Info Section */}
      <Card className="mt-12 border-l-4 border-l-purple-500 bg-purple-50/30">
        <h2 className="mb-4 text-2xl font-bold text-fg">Hogyan hasznĂˇld a sablonokat?</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-2xl font-bold text-purple-600">
              1
            </div>
            <h3 className="mb-2 font-semibold text-fg">VĂˇlassz sablont</h3>
            <p className="text-sm text-fg-muted">
              BĂ¶ngĂ©szd Ăˇt az ingyenes sablonokat, Ă©s vĂˇlaszd ki azt, amelyik a legjobban
              illeszkedik a stĂ­lusodhoz.
            </p>
          </div>
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-2xl font-bold text-purple-600">
              2
            </div>
            <h3 className="mb-2 font-semibold text-fg">Testreszabd</h3>
            <p className="text-sm text-fg-muted">
              Add meg a sajĂˇt informĂˇciĂłidat, szĂ­neidet, logĂłdat, Ă©s az AI segĂ­t generĂˇlni
              a szĂ¶vegeket.
            </p>
          </div>
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-2xl font-bold text-purple-600">
              3
            </div>
            <h3 className="mb-2 font-semibold text-fg">ExportĂˇld PDF-be</h3>
            <p className="text-sm text-fg-muted">
              Kattints egy gombra, Ă©s kĂ©sz a professzionĂˇlis ajĂˇnlatod PDF formĂˇtumban.
            </p>
          </div>
        </div>
      </Card>

      {/* Benefits Section */}
      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-fg">MiĂ©rt vĂˇlaszd a Vyndi sablonokat?</h2>
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
                <h3 className="mb-2 font-semibold text-fg">ProfesszionĂˇlis dizĂˇjn</h3>
                <p className="text-sm text-fg-muted">
                  Minden sablonunk professzionĂˇlis dizĂˇjner Ăˇltal kĂ©szĂĽlt, Ă©s kĂ¶veti a
                  legjobb UX/UI gyakorlatokat.
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
                <h3 className="mb-2 font-semibold text-fg">Teljes testreszabhatĂłsĂˇg</h3>
                <p className="text-sm text-fg-muted">
                  MĂłdosĂ­thatod a szĂ­neket, logĂłt, szĂ¶vegeket, Ă©s mĂ©g sok mindent, hogy
                  tĂ¶kĂ©letesen illeszkedjen a brandhez.
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
                <h3 className="mb-2 font-semibold text-fg">AI segĂ­tsĂ©g</h3>
                <p className="text-sm text-fg-muted">
                  HasznĂˇld az AI funkciĂłt, hogy mĂˇsodpercek alatt generĂˇlj professzionĂˇlis
                  szĂ¶vegeket a sablonokhoz.
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
                <h3 className="mb-2 font-semibold text-fg">Gyors Ă©s egyszerĹ±</h3>
                <p className="text-sm text-fg-muted">
                  Percek alatt kĂ©szĂ­thetsz professzionĂˇlis ajĂˇnlatot. Nincs szĂĽksĂ©g
                  tervezĹ‘i tapasztalatra.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <Card className="mt-12 border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold text-fg">Kezdd el mĂ©g ma!</h2>
          <p className="mb-8 text-lg text-fg-muted">
            RegisztrĂˇlj ingyenesen, Ă©s azonnal hozzĂˇfĂ©rhetsz az Ă¶sszes ingyenes sablonhoz.
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
              href="/resources/pro-templates"
              className="inline-flex items-center gap-2 rounded-full border-2 border-primary/40 bg-white px-8 py-4 text-base font-semibold text-primary transition-all hover:bg-primary/5"
            >
              Pro sablonok megtekintĂ©se
            </Link>
          </div>
        </div>
      </Card>

      {/* Related Resources */}
      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-fg">KapcsolĂłdĂł erĹ‘forrĂˇsok</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/resources/guide">
            <Card className="group h-full border-2 border-border/60 transition-all hover:border-primary/40 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-fg group-hover:text-primary transition-colors">
                    AjĂˇnlatkĂ©szĂ­tĂ©si ĂştmutatĂł
                  </h3>
                  <p className="text-sm text-fg-muted">
                    Tanuld meg, hogyan kĂ©szĂ­ts tĂ¶kĂ©letes ajĂˇnlatokat.
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
                    AI-alapĂş szĂ¶veg generĂˇlĂˇs
                  </h3>
                  <p className="text-sm text-fg-muted">
                    HasznĂˇld az AI-t a sablonokhoz szĂ¶vegek generĂˇlĂˇsĂˇhoz.
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
