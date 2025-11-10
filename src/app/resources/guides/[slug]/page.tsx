import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import {
  ArrowRight,
  ChevronRight,
  Calendar,
  Clock,
  Eye,
  Bookmark,
  Share2,
  Lightbulb,
  CheckCircle,
  ChevronDown,
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
  const resource = getResourceBySlug('guide', slug);

  if (!resource) {
    return {
      title: 'Útmutató nem található',
    };
  }

  return {
    title: `${resource.title} | Vyndi Útmutató`,
    description: resource.excerpt || resource.description,
    openGraph: {
      title: resource.title,
      description: resource.excerpt || resource.description,
      type: 'article',
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = getResourceBySlug('guide', slug);

  if (!resource) {
    notFound();
  }

  const relatedResources = getRelatedResources(slug, 3);

  // Mock progress - in real app, this would come from user state
  const progress = 45;

  const steps = [
    {
      number: 1,
      title: 'Első lépés címe',
      description:
        'Részletes leírás az első lépésről. Ez tartalmazhat képeket, kód példákat, vagy más segédanyagokat.',
      image: '/placeholder.svg?height=300&width=600',
      tips: ['Pro tipp 1', 'Pro tipp 2'],
    },
    {
      number: 2,
      title: 'Második lépés címe',
      description: 'Részletes leírás a második lépésről. Itt folytatjuk az útmutatót.',
      image: '/placeholder.svg?height=300&width=600',
      tips: ['Pro tipp 1'],
    },
    {
      number: 3,
      title: 'Harmadik lépés címe',
      description: 'Részletes leírás a harmadik lépésről. Ez lehet egy komplexebb rész.',
      image: '/placeholder.svg?height=300&width=600',
      tips: [],
    },
    {
      number: 4,
      title: 'Negyedik lépés címe',
      description:
        'Részletes leírás a negyedik lépésről. A végső lépések általában a befejezést tartalmazzák.',
      image: '/placeholder.svg?height=300&width=600',
      tips: ['Pro tipp 1', 'Pro tipp 2', 'Pro tipp 3'],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <ResourceStructuredData resource={resource} />
      {/* Progress Tracker */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="h-2 bg-gray-200">
            <div
              className="h-full bg-turquoise-600 transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="py-2 flex items-center justify-between text-sm text-gray-600">
            <span>{progress}% befejezve</span>
            <span>{resource.readingTime || 12} perc</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-12 pb-12 bg-gradient-to-br from-gray-50 to-white">
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
              <Link href="/resources/guides" className="hover:text-turquoise-600">
                Útmutatók
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-navy-900">{resource.title}</span>
            </div>

            {/* Category Badge */}
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-turquoise-100 text-turquoise-700 rounded-full text-sm font-bold">
                Útmutató
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
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    resource.difficulty === 'Kezdő'
                      ? 'bg-green-100 text-green-700'
                      : resource.difficulty === 'Haladó'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                  }`}
                >
                  {resource.difficulty}
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

            {/* Introduction */}
            <div className="prose prose-lg max-w-none mb-12">
              <h2>Bevezetés</h2>
              <p>
                Ez az útmutató lépésről lépésre végigvezet a folyamaton. Minden lépés részletes
                leírást tartalmaz, képekkel és tippekkel kiegészítve. Kövesd a lépéseket sorrendben
                a legjobb eredményért.
              </p>
            </div>

            {/* Step-by-step Sections */}
            <div className="space-y-12">
              {steps.map((step, index) => (
                <div key={step.number} className="my-12">
                  <div className="flex items-start gap-6 mb-8">
                    <div className="w-12 h-12 bg-turquoise-600 text-white rounded-xl flex items-center justify-center font-bold text-xl flex-shrink-0">
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-navy-900 mb-4">{step.title}</h3>
                      <p className="text-gray-700 leading-relaxed mb-4">{step.description}</p>

                      {/* Step Image */}
                      {step.image && (
                        <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg mb-4">
                          <Image src={step.image} alt={step.title} fill className="object-cover" />
                        </div>
                      )}

                      {/* Tips */}
                      {step.tips.length > 0 && (
                        <div className="mt-4 p-4 bg-turquoise-50 border-l-4 border-turquoise-500 rounded-r-xl">
                          <div className="flex items-start gap-3">
                            <Lightbulb className="w-5 h-5 text-turquoise-600 flex-shrink-0 mt-1" />
                            <div>
                              <h4 className="font-bold text-navy-900 mb-2">Pro tippek</h4>
                              <ul className="space-y-1">
                                {step.tips.map((tip, tipIndex) => (
                                  <li
                                    key={tipIndex}
                                    className="text-gray-700 flex items-start gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4 text-turquoise-600 flex-shrink-0 mt-0.5" />
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Interactive Collapsible Section */}
                      <details className="my-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 group">
                        <summary className="font-bold text-navy-900 cursor-pointer flex items-center justify-between list-none">
                          <span>További információ</span>
                          <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform" />
                        </summary>
                        <div className="mt-4 text-gray-700">
                          <p>
                            Itt találhatók további részletek, gyakori kérdések, vagy haladó
                            használati esetek, amelyek segíthetnek mélyebb megértést nyerni.
                          </p>
                        </div>
                      </details>
                    </div>
                  </div>

                  {/* Step Divider */}
                  {index < steps.length - 1 && (
                    <div className="flex items-center justify-center my-8">
                      <div className="h-px w-full bg-gray-200"></div>
                      <div className="mx-4 w-8 h-8 bg-turquoise-100 rounded-full flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-turquoise-600" />
                      </div>
                      <div className="h-px w-full bg-gray-200"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Completion Section */}
            <div className="mt-12 p-8 bg-gradient-to-br from-green-50 to-turquoise-50 rounded-2xl border-2 border-green-200">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold text-navy-900 mb-4">Gratulálunk! 🎉</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Sikeresen végigvitted az útmutatót! Most már tudod, hogyan kell használni ezt a
                    funkciót.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link
                      href="/resources"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-turquoise-600 hover:bg-turquoise-700 text-white font-bold rounded-xl transition-all"
                    >
                      További útmutatók
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link
                      href="/login?redirect=/new"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-turquoise-600 font-bold rounded-xl border-2 border-turquoise-600 transition-all"
                    >
                      Próbáld ki most
                    </Link>
                  </div>
                </div>
              </div>
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

      {/* Newsletter CTA */}
      <section className="py-20 bg-gradient-to-br from-turquoise-500 to-blue-500 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Szeretnél többet tanulni?</h2>
            <p className="text-xl mb-8 text-white/90">
              Iratkozz fel hírlevelünkre és értesülj elsőként új útmutatóinkról
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
