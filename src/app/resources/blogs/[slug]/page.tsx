import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import {
  ChevronRight,
  Calendar,
  Clock,
  Eye,
  Bookmark,
  Share2,
  List,
  Lightbulb,
  AlertCircle,
  Check,
  CheckSquare,
  Facebook,
  Twitter,
  Linkedin,
  Link2,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { getResourceBySlug, getRelatedResources } from '@/lib/resources';
import { ResourceCard } from '@/components/resource-card';
import { ResourceStructuredData } from '@/components/resource-structured-data';

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

  return (
    <div className="min-h-screen bg-white">
      <ResourceStructuredData resource={resource} />
      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
              <Link href="/" className="hover:text-turquoise-600">
                Főoldal
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/resources" className="hover:text-turquoise-600">
                Erőforrások
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/resources/blogs" className="hover:text-turquoise-600">
                Blog
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-navy-900">{resource.title}</span>
            </div>

            {/* Category Badge */}
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-turquoise-100 text-turquoise-700 rounded-full text-sm font-bold">
                Ajánlatkészítés
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-navy-900 mb-6 leading-tight">
              {resource.title}
            </h1>

            {/* Subtitle/Excerpt */}
            <p className="text-xl text-gray-700 leading-relaxed mb-8">
              {resource.excerpt || resource.description}
            </p>

            {/* Meta Info Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-6 border-y border-gray-200">
              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {resource.publishedDate}
                </div>
                {resource.readingTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {resource.readingTime} perc olvasás
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {resource.views} megtekintés
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Bookmark className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Featured Image */}
            {resource.featuredImage && (
              <div className="relative h-[400px] rounded-3xl overflow-hidden mb-12 shadow-2xl">
                <Image
                  src={resource.featuredImage}
                  alt={resource.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Two Column Layout */}
            <div className="lg:grid lg:grid-cols-[1fr_250px] lg:gap-12">
              {/* Article Content */}
              <article className="prose prose-lg max-w-none">
                {/* Table of Contents - Mobile */}
                <div className="lg:hidden mb-12 p-6 bg-gray-50 rounded-2xl border border-gray-200">
                  <h2 className="text-xl font-bold text-navy-900 mb-4 flex items-center gap-2">
                    <List className="w-5 h-5" />
                    Tartalomjegyzék
                  </h2>
                  <nav className="space-y-2">
                    <a href="#section1" className="block text-turquoise-600 hover:underline">
                      1. Bevezetés
                    </a>
                    <a href="#section2" className="block text-turquoise-600 hover:underline">
                      2. Az ajánlat felépítése
                    </a>
                    <a href="#section3" className="block text-turquoise-600 hover:underline">
                      3. Gyakori hibák
                    </a>
                    <a href="#section4" className="block text-turquoise-600 hover:underline">
                      4. Best practices
                    </a>
                    <a href="#section5" className="block text-turquoise-600 hover:underline">
                      5. Összefoglalás
                    </a>
                  </nav>
                </div>

                {/* Article Body */}
                <h2 id="section1">Bevezetés</h2>
                <p>
                  Az ajánlatkészítés művészete és tudománya egyszerre. Egy jól megírt ajánlat nem
                  csak információt közöl, hanem történetet mesél, meggyőzést kelt, és cselekvésre
                  ösztönöz. Ebben a cikkben megosztjuk a legfontosabb tippeket és bevált
                  gyakorlatokat.
                </p>

                {/* Highlight Box */}
                <div className="not-prose my-8 p-6 bg-turquoise-50 border-l-4 border-turquoise-500 rounded-r-xl">
                  <div className="flex items-start gap-4">
                    <Lightbulb className="w-6 h-6 text-turquoise-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-navy-900 mb-2">Pro tipp</h3>
                      <p className="text-gray-700">
                        A legjobb ajánlatok mindig az ügyfél igényeire fókuszálnak, nem a termékre.
                      </p>
                    </div>
                  </div>
                </div>

                <h2 id="section2">Az ajánlat felépítése</h2>
                <p>
                  Egy hatékony ajánlat több kulcsfontosságú elemből áll, amelyek együttesen egy
                  meggyőző történetet alkotnak.
                </p>

                {/* Stats/Data Visualization */}
                <div className="not-prose my-8 grid md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 text-center">
                    <div className="text-4xl font-bold text-turquoise-600 mb-2">75%</div>
                    <div className="text-sm text-gray-600">Dönt az első 3 oldalon</div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 text-center">
                    <div className="text-4xl font-bold text-turquoise-600 mb-2">3-5</div>
                    <div className="text-sm text-gray-600">Ideális oldalszám</div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 text-center">
                    <div className="text-4xl font-bold text-turquoise-600 mb-2">24h</div>
                    <div className="text-sm text-gray-600">Válaszadási idő</div>
                  </div>
                </div>

                <h3>Fő szakaszok</h3>
                <ol>
                  <li>
                    <strong>Összefoglaló</strong> - Az ajánlat lényege egy oldalon
                  </li>
                  <li>
                    <strong>Probléma definíció</strong> - Az ügyfél kihívásai
                  </li>
                  <li>
                    <strong>Javasolt megoldás</strong> - Hogyan segítesz
                  </li>
                  <li>
                    <strong>Időterv és árazás</strong> - Konkrét részletek
                  </li>
                  <li>
                    <strong>Következő lépések</strong> - Call to action
                  </li>
                </ol>

                <h2 id="section3">Gyakori hibák</h2>
                <p>
                  Az évek során számos ajánlatot láttam, és van néhány gyakori hiba, amelyeket
                  érdemes elkerülni.
                </p>

                {/* Warning Box */}
                <div className="not-prose my-8 p-6 bg-red-50 border-l-4 border-red-500 rounded-r-xl">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-red-900 mb-2">Kerülendő</h3>
                      <p className="text-red-800">
                        Ne használj általános sablonokat személyre szabás nélkül. Az ügyfelek
                        azonnal észreveszik.
                      </p>
                    </div>
                  </div>
                </div>

                <h2 id="section4">Best Practices 2025-ben</h2>
                <p>Az ajánlatkészítés folyamatosan fejlődik...</p>

                {/* Checklist */}
                <div className="not-prose my-8 p-6 bg-white rounded-2xl border border-gray-200 shadow-lg">
                  <h3 className="font-bold text-navy-900 mb-4 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-turquoise-600" />
                    Ellenőrző lista
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-turquoise-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Személyre szabott a címzett szerint</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-turquoise-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Világos árazás és időterv</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-turquoise-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Vizuálisan vonzó dizájn</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-turquoise-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Hivatkozások és esettanulmányok</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-turquoise-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Egyértelmű call-to-action</span>
                    </li>
                  </ul>
                </div>

                <h2 id="section5">Összefoglalás</h2>
                <p>Egy tökéletes ajánlat nem csak információt közöl, hanem történetet mesél...</p>

                {/* Key Takeaways */}
                <div className="not-prose my-8 p-8 bg-gradient-to-br from-turquoise-50 to-blue-50 rounded-2xl border-2 border-turquoise-200">
                  <h3 className="text-2xl font-bold text-navy-900 mb-6">
                    Kulcsfontosságú tanulságok
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-turquoise-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                        1
                      </div>
                      <span className="text-gray-700">
                        Az ügyfél problémájára fókuszálj, nem a termékedre
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-turquoise-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                        2
                      </div>
                      <span className="text-gray-700">
                        Tömör és vizuális legyen - 3-5 oldal az ideális
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-turquoise-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                        3
                      </div>
                      <span className="text-gray-700">
                        Használj konkrét számokat és eredményeket
                      </span>
                    </li>
                  </ul>
                </div>
              </article>

              {/* Sidebar - Desktop */}
              <aside className="hidden lg:block">
                {/* Sticky Container */}
                <div className="sticky top-24 space-y-6">
                  {/* Table of Contents */}
                  <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg">
                    <h3 className="font-bold text-navy-900 mb-4 text-sm uppercase tracking-wide">
                      Tartalomjegyzék
                    </h3>
                    <nav className="space-y-2 text-sm">
                      <a
                        href="#section1"
                        className="block text-gray-600 hover:text-turquoise-600 transition-colors"
                      >
                        1. Bevezetés
                      </a>
                      <a
                        href="#section2"
                        className="block text-gray-600 hover:text-turquoise-600 transition-colors"
                      >
                        2. Az ajánlat felépítése
                      </a>
                      <a
                        href="#section3"
                        className="block text-gray-600 hover:text-turquoise-600 transition-colors"
                      >
                        3. Gyakori hibák
                      </a>
                      <a
                        href="#section4"
                        className="block text-gray-600 hover:text-turquoise-600 transition-colors"
                      >
                        4. Best practices
                      </a>
                      <a
                        href="#section5"
                        className="block text-gray-600 hover:text-turquoise-600 transition-colors"
                      >
                        5. Összefoglalás
                      </a>
                    </nav>
                  </div>

                  {/* Share */}
                  <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg">
                    <h3 className="font-bold text-navy-900 mb-4 text-sm uppercase tracking-wide">
                      Megosztás
                    </h3>
                    <div className="flex flex-col gap-2">
                      <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 min-h-[44px]">
                        <Facebook className="w-4 h-4" />
                        Facebook
                      </button>
                      <button className="w-full px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 min-h-[44px]">
                        <Twitter className="w-4 h-4" />
                        Twitter
                      </button>
                      <button className="w-full px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 min-h-[44px]">
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </button>
                      <button className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 min-h-[44px]">
                        <Link2 className="w-4 h-4" />
                        Link másolása
                      </button>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      {/* Related Content */}
      {relatedResources.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-navy-900 mb-8">Kapcsolódó tartalmak</h2>

              <div className="grid md:grid-cols-3 gap-8">
                {relatedResources.map((related) => (
                  <ResourceCard key={related.id} resource={related} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Lead Gen Newsletter CTA */}
      <section className="py-20 bg-gradient-to-br from-turquoise-500 to-blue-500 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ne maradj le a legújabb tartalmakról</h2>
            <p className="text-xl mb-8 text-white/90">
              Iratkozz fel hírlevelünkre és kapj értékes tippeket ajánlatkészítéshez hetente
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="pelda@email.com"
                className="flex-1 px-6 py-4 rounded-xl text-navy-900 focus:outline-none focus:ring-2 focus:ring-white min-h-[44px]"
              />
              <button className="bg-white hover:bg-gray-50 text-turquoise-600 font-bold px-8 py-4 rounded-xl transition-all whitespace-nowrap min-h-[44px]">
                Feliratkozom
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
