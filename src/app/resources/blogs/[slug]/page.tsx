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
import { ReadingProgress } from '@/components/guides/ReadingProgress';
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

      {/* Reading Progress Bar */}
      <ReadingProgress />

      {/* Back to Top Button */}
      <BackToTop />

      {/* Enhanced Hero Section */}
      <article className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Breadcrumb */}
        <nav className="text-sm mb-6 flex items-center gap-2 text-gray-600" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-teal-600 transition-colors">
            Főoldal
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/resources" className="hover:text-teal-600 transition-colors">
            Erőforrások
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/resources#blog" className="hover:text-teal-600 transition-colors">
            Blog
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{resource.title}</span>
        </nav>

        {/* Hero section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-teal-500 text-white text-sm px-4 py-1.5 rounded-full font-semibold">
              Ajánlatkészítés
            </span>
            {resource.readingTime && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{resource.readingTime} perc</span>
              </div>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            {resource.title}
          </h1>

          <p className="text-xl text-gray-700 leading-relaxed mb-6">
            {resource.excerpt || resource.description}
          </p>

          {/* Author and actions row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {resource.title.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-gray-900">Vyndi Csapat</div>
                <div className="text-sm text-gray-600">Marketing szakértők</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-teal-500 transition-colors min-h-[44px]">
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
        </div>
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
                    className="text-2xl font-bold text-gray-900 mt-12 mb-4 flex items-center gap-3 scroll-mt-24"
                  >
                    <span className="w-8 h-1 bg-teal-500 rounded-full"></span>
                    <span>Bevezetés</span>
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Az ajánlatkészítés művészete és tudománya egyszerre. Egy jól megírt ajánlat nem
                    csak információt közöl, hanem történetet mesél, meggyőzést kelt, és cselekvésre
                    ösztönöz. Ebben a cikkben megosztjuk a legfontosabb tippeket és bevált
                    gyakorlatokat.
                  </p>

                  {/* Enhanced Pro Tip Box */}
                  <div className="not-prose my-8 border-l-4 border-yellow-400 bg-yellow-50 rounded-r-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center">
                        <Lightbulb className="w-6 h-6 text-yellow-900" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg mb-2">Pro tipp</h4>
                        <p className="text-gray-700 leading-relaxed">
                          A legjobb ajánlatok mindig az ügyfél igényeire fókuszálnak, nem a
                          termékre. A sikerült ajánlatok mindig úgy néznek ki, mintha kifejezetten
                          az adott ügyfélnek készültek volna el.
                        </p>
                      </div>
                    </div>
                  </div>

                  <h2
                    id="section2"
                    className="text-2xl font-bold text-gray-900 mt-12 mb-4 flex items-center gap-3 scroll-mt-24"
                  >
                    <span className="w-8 h-1 bg-teal-500 rounded-full"></span>
                    <span>Az ajánlat felépítése</span>
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Egy hatékony ajánlat több kulcsfontosságú elemből áll, amelyek együttesen egy
                    meggyőző történetet alkotnak.
                  </p>

                  {/* Enhanced Stats Section */}
                  <div className="not-prose my-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl p-8 md:p-12">
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

                  <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Fő szakaszok</h3>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong>Összefoglaló</strong> - Az ajánlat lényege egy oldalon
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong>Probléma definíció</strong> - Az ügyfél kihívásai
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong>Javasolt megoldás</strong> - Hogyan segítesz
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong>Időterv és árazás</strong> - Konkrét részletek
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong>Következő lépések</strong> - Call to action
                      </span>
                    </li>
                  </ul>

                  <h2
                    id="section3"
                    className="text-2xl font-bold text-gray-900 mt-12 mb-4 flex items-center gap-3 scroll-mt-24"
                  >
                    <span className="w-8 h-1 bg-teal-500 rounded-full"></span>
                    <span>Gyakori hibák</span>
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Az évek során számos ajánlatot láttam, és van néhány gyakori hiba, amelyeket
                    érdemes elkerülni.
                  </p>

                  {/* Enhanced Warning Box */}
                  <div className="not-prose my-8 border-l-4 border-red-400 bg-red-50 rounded-r-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-red-400 rounded-xl flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-red-900" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg mb-2">Kerülendő</h4>
                        <p className="text-gray-700 leading-relaxed">
                          Ne használj általános sablonokat személyre szabás nélkül. Az ügyfelek
                          azonnal észreveszik. Ne használj általános sablon vagy semmilyen olyan
                          szöveget, ami túl gyakran előfordul.
                        </p>
                      </div>
                    </div>
                  </div>

                  <h2
                    id="section4"
                    className="text-2xl font-bold text-gray-900 mt-12 mb-4 flex items-center gap-3 scroll-mt-24"
                  >
                    <span className="w-8 h-1 bg-teal-500 rounded-full"></span>
                    <span>Best Practices 2025-ben</span>
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Az ajánlatkészítés folyamatosan fejlődik. Az új technológiák és trendek
                    lehetőségeket nyitnak meg a még hatékonyabb ajánlatok készítésére.
                  </p>

                  {/* Enhanced Checklist */}
                  <div className="not-prose my-12 bg-white rounded-2xl border-2 border-gray-200 p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center">
                        <ListChecks className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Következő lépések</h3>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-teal-50 transition-colors group">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-teal-500 flex items-center justify-center mt-0.5 group-hover:bg-teal-500 transition-colors">
                          <Check className="w-4 h-4 text-teal-500 group-hover:text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800 font-medium">
                            Szánj időt a célcsoport és céljainak tanulmányozására
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-teal-50 transition-colors group">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-teal-500 flex items-center justify-center mt-0.5 group-hover:bg-teal-500 transition-colors">
                          <Check className="w-4 h-4 text-teal-500 group-hover:text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800 font-medium">
                            Használj releváns és figyelemfelkeltő címet
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-teal-50 transition-colors group">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-teal-500 flex items-center justify-center mt-0.5 group-hover:bg-teal-500 transition-colors">
                          <Check className="w-4 h-4 text-teal-500 group-hover:text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800 font-medium">
                            Vizualizálj minden fontos dolgot
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-teal-50 transition-colors group">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-teal-500 flex items-center justify-center mt-0.5 group-hover:bg-teal-500 transition-colors">
                          <Check className="w-4 h-4 text-teal-500 group-hover:text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800 font-medium">Világos árazás és időterv</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-teal-50 transition-colors group">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-teal-500 flex items-center justify-center mt-0.5 group-hover:bg-teal-500 transition-colors">
                          <Check className="w-4 h-4 text-teal-500 group-hover:text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800 font-medium">Egyértelmű call-to-action</p>
                        </div>
                      </div>
                    </div>

                    {/* CTA at bottom of checklist */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <Link
                        href="/login?redirect=/new"
                        className="w-full bg-teal-500 text-white px-6 py-4 rounded-xl font-semibold hover:bg-teal-600 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <span>Kezdd el most</span>
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>

                  <h2
                    id="section5"
                    className="text-2xl font-bold text-gray-900 mt-12 mb-4 flex items-center gap-3 scroll-mt-24"
                  >
                    <span className="w-8 h-1 bg-teal-500 rounded-full"></span>
                    <span>Összefoglalás</span>
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Egy tökéletes ajánlat nem csak információt közöl, hanem történetet mesél,
                    meggyőzést kelt, és cselekvésre ösztönöz. Kövesd ezeket a tippeket és növeld meg
                    az ajánlataid sikerességét.
                  </p>

                  {/* Enhanced Key Learnings Box */}
                  <div className="not-prose my-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-8 text-white">
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
                  <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Megosztás</h3>
                    <div className="space-y-3">
                      <button className="w-full flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-all min-h-[44px]">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <Facebook className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium text-gray-700">Facebook</span>
                      </button>
                      <button className="w-full flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-all min-h-[44px]">
                        <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center">
                          <Linkedin className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium text-gray-700">LinkedIn</span>
                      </button>
                      <button className="w-full flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-all min-h-[44px]">
                        <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center">
                          <Twitter className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium text-gray-700">Twitter</span>
                      </button>
                      <button className="w-full flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-all min-h-[44px]">
                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                          <LinkIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium text-gray-700">Link másolása</span>
                      </button>
                    </div>
                  </div>

                  {/* CTA Box */}
                  <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl p-6 text-white">
                    <h3 className="font-bold text-xl mb-2">Próbáld ki ingyen!</h3>
                    <p className="text-white/90 text-sm mb-4">
                      Kezdj el professzionális ajánlatokat készíteni még ma
                    </p>
                    <Link
                      href="/login?redirect=/new"
                      className="group w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl px-6 py-3 min-h-[56px] flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 relative overflow-hidden"
                    >
                      <span className="relative z-10 text-base text-white">
                        Próbáld ki most ingyen
                      </span>
                      <ArrowRight className="w-5 h-5 flex-shrink-0 relative z-10 text-white transition-transform duration-300 group-hover:translate-x-1" />
                      <span className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      {/* Previous/Next Navigation */}
      <section className="py-12 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link
                href="/resources/blogs/previous-article"
                className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-teal-500 transition-all"
              >
                <div className="flex items-center gap-3 text-gray-600 text-sm mb-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Előző cikk</span>
                </div>
                <h4 className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                  Előző cikk címe
                </h4>
              </Link>

              <Link
                href="/resources/blogs/next-article"
                className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-teal-500 transition-all text-right"
              >
                <div className="flex items-center justify-end gap-3 text-gray-600 text-sm mb-2">
                  <span>Következő cikk</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                  Következő cikk címe
                </h4>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Related Content */}
      {relatedResources.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Kapcsolódó tartalmak</h2>
                  <p className="text-gray-600">Folytasd a tanulást ezekkel a cikkekkel</p>
                </div>
                <Link
                  href="/resources#blog"
                  className="text-teal-600 font-semibold hover:underline flex items-center gap-2"
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
        <div className="absolute inset-0 bg-gradient-to-br from-turquoise-500 via-turquoise-600 to-blue-600">
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
