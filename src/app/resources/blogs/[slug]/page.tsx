import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import {
  ChevronRight,
  Clock,
  Bookmark,
  Lightbulb,
  AlertCircle,
  Check,
  Facebook,
  Twitter,
  Linkedin,
  TrendingUp,
  Zap,
  ListChecks,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Link as LinkIcon,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { getResourceBySlug, getRelatedResources } from '@/lib/resources';
import { ResourceCard } from '@/components/resource-card';
import { ResourceStructuredData } from '@/components/resource-structured-data';
import { ShareDropdown } from '@/components/guides/ShareDropdown';
import { BlogTOC } from '@/components/blogs/BlogTOC';
import { BackToTop } from '@/components/blogs/BackToTop';
import { NewsletterSubscription } from '@/components/landing/NewsletterSubscription';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resource = getResourceBySlug('blog', slug);

  if (!resource) {
    return {
      title: 'Blog cikk nem található',
    };
  }

  return {
    title: `${resource.title} | Vyndi Blog`,
    description: resource.excerpt || resource.description,
    openGraph: {
      title: resource.title,
      description: resource.excerpt || resource.description,
      type: 'article',
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = getResourceBySlug('blog', slug);

  if (!resource) {
    notFound();
  }

  const relatedResources = getRelatedResources(slug, 3);

  const tocItems = [
    { id: 'section1', title: 'Bevezetés' },
    { id: 'section2', title: 'Az ajánlat felépítése' },
    { id: 'section3', title: 'Gyakori hibák' },
    { id: 'section4', title: 'Best practices' },
    { id: 'section5', title: 'Összefoglalás' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <ResourceStructuredData resource={resource} />

      {/* Back to Top Button */}
      <BackToTop />

      {/* Enhanced Hero Section */}
      <article className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Breadcrumb */}
        <nav className="text-sm mb-6 flex items-center gap-2 text-fg-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary transition-colors">
            Főoldal
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/resources" className="hover:text-primary transition-colors">
            Erőforrások
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/resources#blog" className="hover:text-primary transition-colors">
            Blog
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-fg font-medium">{resource.title}</span>
        </nav>

        {/* Hero section */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-primary text-white text-sm px-4 py-1.5 rounded-full font-semibold">
              Ajánlatkészítés
            </span>
            {resource.readingTime && (
              <div className="flex items-center gap-1.5 text-sm text-fg-muted">
                <Clock className="w-4 h-4" />
                <span>{resource.readingTime} perc</span>
              </div>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-fg mb-4 leading-tight">
            {resource.title}
          </h1>

          <p className="text-xl text-fg-muted leading-relaxed mb-6">
            {resource.excerpt || resource.description}
          </p>

          {/* Author and actions row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold">
                {resource.title.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-fg">Vyndi Csapat</div>
                <div className="text-sm text-fg-muted">Marketing szakértők</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-border rounded-lg hover:border-primary transition-colors min-h-[44px]">
                <Bookmark className="w-5 h-5" />
                <span className="font-medium">Mentés</span>
              </button>
              <ShareDropdown url={`/resources/blogs/${slug}`} title={resource.title} />
            </div>
          </div>

          {/* Featured image */}
          {resource.featuredImage && (
            <div className="mt-8 rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src={resource.featuredImage}
                alt={resource.title}
                width={1200}
                height={400}
                className="w-full h-[400px] object-cover"
              />
            </div>
          )}
        </header>
      </article>

      {/* Main Content with Two-Column Layout */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Main content - 8 columns */}
              <div className="lg:col-span-8">
                {/* Mobile TOC */}
                <div className="lg:hidden mb-8">
                  <BlogTOC items={tocItems} mobile />
                </div>

                {/* Article Content */}
                <article className="prose prose-lg max-w-none">
                  {/* Article Body */}
                  <h2
                    id="section1"
                    className="text-2xl font-bold text-fg mt-12 mb-4 flex items-center gap-3 scroll-mt-24"
                  >
                    <span className="w-8 h-1 bg-primary rounded-full"></span>
                    <span>Bevezetés</span>
                  </h2>
                  <p className="text-fg-muted leading-relaxed mb-6">
                    Az ajánlatkészítés művészete és tudománya egyszerre. Egy jól megírt ajánlat nem
                    csak információt közöl, hanem történetet mesél, meggyőzést kelt, és cselekvésre
                    ösztönöz. Ebben a cikkben megosztjuk a legfontosabb tippeket és bevált
                    gyakorlatokat.
                  </p>

                  {/* Enhanced Pro Tip Box */}
                  <div className="not-prose my-8 border-l-4 border-warning bg-warning/10 rounded-r-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-warning rounded-xl flex items-center justify-center">
                        <Lightbulb className="w-6 h-6 text-warning" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-fg text-lg mb-2">Pro tipp</h4>
                        <p className="text-fg-muted leading-relaxed">
                          A legjobb ajánlatok mindig az ügyfél igényeire fókuszálnak, nem a
                          termékre. A sikerült ajánlatok mindig úgy néznek ki, mintha kifejezetten
                          az adott ügyfélnek készültek volna el.
                        </p>
                      </div>
                    </div>
                  </div>

                  <h2
                    id="section2"
                    className="text-2xl font-bold text-fg mt-12 mb-4 flex items-center gap-3 scroll-mt-24"
                  >
                    <span className="w-8 h-1 bg-primary rounded-full"></span>
                    <span>Az ajánlat felépítése</span>
                  </h2>
                  <p className="text-fg-muted leading-relaxed mb-6">
                    Egy hatékony ajánlat több kulcsfontosságú elemből áll, amelyek együttesen egy
                    meggyőző történetet alkotnak.
                  </p>

                  {/* Enhanced Stats Section */}
                  <div className="not-prose my-12 bg-gradient-to-br from-primary to-accent rounded-2xl p-8 md:p-12">
                    <h3 className="text-2xl font-bold text-white text-center mb-8">
                      Milyen eredményeket érhetsz el?
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <TrendingUp className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-5xl font-bold text-white mb-2">75%</div>
                        <div className="text-white/90 font-semibold mb-1">
                          Siker az első 3 kínálatban
                        </div>
                        <div className="text-white/70 text-sm">Ha követed ezeket a tippeket</div>
                      </div>

                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Clock className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-5xl font-bold text-white mb-2">3-5</div>
                        <div className="text-white/90 font-semibold mb-1">Nappal rövidebb</div>
                        <div className="text-white/70 text-sm">Az ajánlat elkészítési idő</div>
                      </div>

                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Zap className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-5xl font-bold text-white mb-2">24h</div>
                        <div className="text-white/90 font-semibold mb-1">Válaszidő</div>
                        <div className="text-white/70 text-sm">Gyorsabb ügyfél-kommunikáció</div>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-fg mt-8 mb-3">Fő szakaszok</h3>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-fg-muted">
                        <strong>Összefoglaló</strong> - Az ajánlat lényege egy oldalon
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-fg-muted">
                        <strong>Probléma definíció</strong> - Az ügyfél kihívásai
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-fg-muted">
                        <strong>Javasolt megoldás</strong> - Hogyan segítesz
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-fg-muted">
                        <strong>Időterv és árazás</strong> - Konkrét részletek
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-fg-muted">
                        <strong>Következő lépések</strong> - Call to action
                      </span>
                    </li>
                  </ul>

                  <h2
                    id="section3"
                    className="text-2xl font-bold text-fg mt-12 mb-4 flex items-center gap-3 scroll-mt-24"
                  >
                    <span className="w-8 h-1 bg-primary rounded-full"></span>
                    <span>Gyakori hibák</span>
                  </h2>
                  <p className="text-fg-muted leading-relaxed mb-6">
                    Az évek során számos ajánlatot láttam, és van néhány gyakori hiba, amelyeket
                    érdemes elkerülni.
                  </p>

                  {/* Enhanced Warning Box */}
                  <div className="not-prose my-8 border-l-4 border-danger bg-danger/10 rounded-r-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-danger rounded-xl flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-danger" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-fg text-lg mb-2">Kerülendő</h4>
                        <p className="text-fg-muted leading-relaxed">
                          Ne használj általános sablonokat személyre szabás nélkül. Az ügyfelek
                          azonnal észreveszik. Ne használj általános sablon vagy semmilyen olyan
                          szöveget, ami túl gyakran előfordul.
                        </p>
                      </div>
                    </div>
                  </div>

                  <h2
                    id="section4"
                    className="text-2xl font-bold text-fg mt-12 mb-4 flex items-center gap-3 scroll-mt-24"
                  >
                    <span className="w-8 h-1 bg-primary rounded-full"></span>
                    <span>Best Practices 2025-ben</span>
                  </h2>
                  <p className="text-fg-muted leading-relaxed mb-6">
                    Az ajánlatkészítés folyamatosan fejlődik. Az új technológiák és trendek
                    lehetőségeket nyitnak meg a még hatékonyabb ajánlatok készítésére.
                  </p>

                  {/* Enhanced Checklist */}
                  <div className="not-prose my-12 bg-white rounded-2xl border-2 border-border p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                        <ListChecks className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-fg">Következő lépések</h3>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-4 bg-bg-muted rounded-lg hover:bg-primary/10 transition-colors group">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center mt-0.5 group-hover:bg-primary transition-colors">
                          <Check className="w-4 h-4 text-primary group-hover:text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-fg font-medium">
                            Szánj időt a célcsoport és céljainak tanulmányozására
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-bg-muted rounded-lg hover:bg-primary/10 transition-colors group">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center mt-0.5 group-hover:bg-primary transition-colors">
                          <Check className="w-4 h-4 text-primary group-hover:text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-fg font-medium">
                            Használj releváns és figyelemfelkeltő címet
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-bg-muted rounded-lg hover:bg-primary/10 transition-colors group">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center mt-0.5 group-hover:bg-primary transition-colors">
                          <Check className="w-4 h-4 text-primary group-hover:text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-fg font-medium">Vizualizálj minden fontos dolgot</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-bg-muted rounded-lg hover:bg-primary/10 transition-colors group">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center mt-0.5 group-hover:bg-primary transition-colors">
                          <Check className="w-4 h-4 text-primary group-hover:text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-fg font-medium">Világos árazás és időterv</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-bg-muted rounded-lg hover:bg-primary/10 transition-colors group">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center mt-0.5 group-hover:bg-primary transition-colors">
                          <Check className="w-4 h-4 text-primary group-hover:text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-fg font-medium">Egyértelmű call-to-action</p>
                        </div>
                      </div>
                    </div>

                    {/* CTA at bottom of checklist */}
                    <div className="mt-6 pt-6 border-t border-border">
                      <Link
                        href="/login?redirect=/new"
                        className="w-full bg-primary text-white px-6 py-4 rounded-xl font-semibold hover:bg-primary-ink transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <span>Kezdd el most</span>
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>

                  <h2
                    id="section5"
                    className="text-2xl font-bold text-fg mt-12 mb-4 flex items-center gap-3 scroll-mt-24"
                  >
                    <span className="w-8 h-1 bg-primary rounded-full"></span>
                    <span>Összefoglalás</span>
                  </h2>
                  <p className="text-fg-muted leading-relaxed mb-6">
                    Egy tökéletes ajánlat nem csak információt közöl, hanem történetet mesél,
                    meggyőzést kelt, és cselekvésre ösztönöz. Kövesd ezeket a tippeket és növeld meg
                    az ajánlataid sikerességét.
                  </p>

                  {/* Enhanced Key Learnings Box */}
                  <div className="not-prose my-12 bg-gradient-to-br from-accent to-primary rounded-2xl p-8 text-white">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold">Kulcsfontosságú tanulságok</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mt-1">
                          <span className="text-white font-bold">1</span>
                        </div>
                        <p className="text-white/95 text-lg">
                          Az ügyféllel való kapcsolattól kezdődik minden sikeres ajánlat
                        </p>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mt-1">
                          <span className="text-white font-bold">2</span>
                        </div>
                        <p className="text-white/95 text-lg">
                          A vizuális elemek és adatok növelik az ajánlat elfogadási rátát
                        </p>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mt-1">
                          <span className="text-white font-bold">3</span>
                        </div>
                        <p className="text-white/95 text-lg">
                          Kerüld az általános sablonokat, minden ajánlat legyen egyedi
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              </div>

              {/* Sidebar - 4 columns */}
              <aside className="lg:col-span-4">
                <div className="lg:sticky lg:top-24 space-y-6">
                  {/* Table of Contents */}
                  <BlogTOC items={tocItems} />

                  {/* Enhanced Social Share */}
                  <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-6">
                    <h3 className="font-bold text-fg mb-4">Megosztás</h3>
                    <div className="space-y-3">
                      <button className="w-full flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-all min-h-[44px]">
                        <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                          <Facebook className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium text-fg-muted">Facebook</span>
                      </button>
                      <button className="w-full flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-all min-h-[44px]">
                        <div className="w-10 h-10 bg-accent/90 rounded-full flex items-center justify-center">
                          <Linkedin className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium text-fg-muted">LinkedIn</span>
                      </button>
                      <button className="w-full flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-all min-h-[44px]">
                        <div className="w-10 h-10 bg-accent/80 rounded-full flex items-center justify-center">
                          <Twitter className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium text-fg-muted">Twitter</span>
                      </button>
                      <button className="w-full flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-all min-h-[44px]">
                        <div className="w-10 h-10 bg-primary-ink rounded-full flex items-center justify-center">
                          <LinkIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium text-fg-muted">Link másolása</span>
                      </button>
                    </div>
                  </div>

                  {/* CTA Box */}
                  <div className="bg-gradient-to-br from-primary to-accent rounded-xl p-6 text-white">
                    <h3 className="font-bold text-xl mb-2">Próbáld ki ingyen!</h3>
                    <p className="text-white/90 text-sm mb-4">
                      Kezdj el professzionális ajánlatokat készíteni még ma
                    </p>
                    <Link
                      href="/login?redirect=/new"
                      className="group w-full bg-cta hover:bg-cta-hover text-white font-semibold rounded-xl px-6 py-3 min-h-[56px] flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 relative overflow-hidden"
                    >
                      <span className="relative z-10 text-base text-white">
                        Próbáld ki most ingyen
                      </span>
                      <ArrowRight className="w-5 h-5 flex-shrink-0 relative z-10 text-white transition-transform duration-300 group-hover:translate-x-1" />
                      <span className="absolute inset-0 bg-gradient-to-r from-cta to-cta-hover opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      {/* Previous/Next Navigation */}
      <section className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link
                href="/resources/blogs/previous-article"
                className="group bg-white border-2 border-border rounded-xl p-6 hover:border-primary transition-all"
              >
                <div className="flex items-center gap-3 text-fg-muted text-sm mb-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Előző cikk</span>
                </div>
                <h4 className="font-bold text-fg group-hover:text-primary transition-colors">
                  Előző cikk címe
                </h4>
              </Link>

              <Link
                href="/resources/blogs/next-article"
                className="group bg-white border-2 border-border rounded-xl p-6 hover:border-primary transition-all text-right"
              >
                <div className="flex items-center justify-end gap-3 text-fg-muted text-sm mb-2">
                  <span>Következő cikk</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-fg group-hover:text-primary transition-colors">
                  Következő cikk címe
                </h4>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Related Content */}
      {relatedResources.length > 0 && (
        <section className="py-16 bg-bg-muted">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-fg mb-2">Kapcsolódó tartalmak</h2>
                  <p className="text-fg-muted">Folytasd a tanulást ezekkel a cikkekkel</p>
                </div>
                <Link
                  href="/resources#blog"
                  className="text-primary font-semibold hover:underline flex items-center gap-2"
                >
                  <span>Összes cikk</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedResources.map((related) => (
                  <ResourceCard key={related.id} resource={related} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Lead Gen Newsletter CTA */}
      <section className="relative py-24 overflow-hidden">
        {/* Enhanced gradient background with pattern overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent">
          {/* Subtle pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Compelling headline with better messaging */}
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight text-balance">
                Szeretnéd elsőként kipróbálni az újdonságokat?
              </h2>
              <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-3xl mx-auto text-pretty">
                Iratkozz fel, és értesülj az újdonságokról, tippekről és az új funkciók indulásáról.
                <br />
                Csatlakozz több mint 200 vállalkozáshoz, akik már hatékonyabban dolgoznak az
                ajánlatkészítésben.
              </p>
            </div>

            {/* Newsletter subscription form */}
            <NewsletterSubscription source="blog_page" />
          </div>
        </div>
      </section>
    </div>
  );
}
