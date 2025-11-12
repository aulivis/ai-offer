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
  Lightbulb,
  CheckCircle,
  ChevronDown,
  Download,
  FileText,
  Info,
  Award,
  FileDown,
  Printer,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { getResourceBySlug, getRelatedResources } from '@/lib/resources';
import { ResourceCard } from '@/components/resource-card';
import { ResourceStructuredData } from '@/components/resource-structured-data';
import { GuideTOC } from '@/components/guides/GuideTOC';
import { ReadingProgress } from '@/components/guides/ReadingProgress';
import { ShareDropdown } from '@/components/guides/ShareDropdown';
import { GuideFeedback } from '@/components/guides/GuideFeedback';
import { TimeRemaining } from '@/components/guides/TimeRemaining';

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
  const _progress = 45;

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

  const tocItems = steps.map((step) => ({
    id: `step-${step.number}`,
    number: step.number,
    title: step.title,
  }));

  return (
    <div className="min-h-screen bg-white">
      <ResourceStructuredData resource={resource} />

      {/* Reading Progress Bar */}
      <ReadingProgress />

      {/* Estimated Time Remaining */}
      {resource.readingTime && <TimeRemaining totalMinutes={resource.readingTime} />}

      {/* Enhanced Hero Section */}
      <section className="pt-12 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl p-8 md:p-12 mb-12">
              {/* Enhanced Breadcrumb */}
              <nav
                className="text-sm mb-6 flex items-center gap-2 text-gray-600"
                aria-label="Breadcrumb"
              >
                <Link href="/" className="hover:text-teal-600 transition-colors">
                  Főoldal
                </Link>
                <ChevronRight className="w-4 h-4" />
                <Link href="/resources" className="hover:text-teal-600 transition-colors">
                  Erőforrások
                </Link>
                <ChevronRight className="w-4 h-4" />
                <Link href="/resources#guides" className="hover:text-teal-600 transition-colors">
                  Útmutatók
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 font-medium">{resource.title}</span>
              </nav>

              {/* Badge and metadata */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="bg-teal-500 text-white text-sm px-4 py-1.5 rounded-full font-semibold">
                  Útmutató
                </span>
                <span
                  className={`text-sm px-3 py-1 rounded-full font-medium ${
                    resource.difficulty === 'Kezdő'
                      ? 'bg-green-100 text-green-700'
                      : resource.difficulty === 'Haladó'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                  }`}
                >
                  {resource.difficulty}
                </span>
                <div className="flex items-center gap-5 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{resource.publishedDate}</span>
                  </div>
                  {resource.readingTime && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{resource.readingTime} perc</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    <span>{resource.views.toLocaleString()} megtekintés</span>
                  </div>
                </div>
              </div>

              {/* Title and description */}
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                {resource.title}
              </h1>
              <p className="text-xl text-gray-700 leading-relaxed mb-6">
                {resource.excerpt || resource.description}
              </p>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-4">
                <button className="bg-teal-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-teal-600 transition-colors flex items-center gap-2 min-h-[44px]">
                  <Download className="w-5 h-5" />
                  <span>PDF letöltése</span>
                </button>
                <button className="bg-white text-gray-700 px-6 py-3 rounded-xl font-semibold border-2 border-gray-200 hover:border-teal-500 transition-colors flex items-center gap-2 min-h-[44px]">
                  <Bookmark className="w-5 h-5" />
                  <span>Mentés</span>
                </button>
                <ShareDropdown url={`/resources/guides/${slug}`} title={resource.title} />
                <button className="bg-white text-gray-700 px-6 py-3 rounded-xl font-semibold border-2 border-gray-200 hover:border-teal-500 transition-colors flex items-center gap-2 min-h-[44px]">
                  <Printer className="w-5 h-5" />
                  <span>Nyomtatás</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content with TOC */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Desktop: Sticky TOC Sidebar */}
            <div className="hidden lg:block lg:col-span-1">
              <GuideTOC items={tocItems} />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Mobile: Expandable TOC */}
              <div className="lg:hidden mb-8">
                <GuideTOC items={tocItems} mobile />
              </div>

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
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Bevezetés</h2>
                <p className="text-gray-700 leading-relaxed text-lg">
                  Ez az útmutató lépésről lépésre végigvezet a folyamaton. Minden lépés részletes
                  leírást tartalmaz, képekkel és tippekkel kiegészítve. Kövesd a lépéseket
                  sorrendben a legjobb eredményért.
                </p>
              </div>

              {/* Step-by-step Sections */}
              <div className="space-y-12">
                {steps.map((step, index) => (
                  <section
                    key={step.number}
                    id={`step-${step.number}`}
                    className="scroll-mt-24 mb-12"
                    aria-labelledby={`step-${step.number}-title`}
                  >
                    <div className="flex items-start gap-6 mb-6">
                      {/* Large numbered badge */}
                      <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {String(step.number).padStart(2, '0')}
                      </div>

                      <div className="flex-1">
                        <h2
                          id={`step-${step.number}-title`}
                          className="text-3xl font-bold text-gray-900 mb-3"
                        >
                          {step.title}
                        </h2>
                        <p className="text-gray-700 text-lg leading-relaxed mb-6">
                          {step.description}
                        </p>

                        {/* Step Image */}
                        {step.image && (
                          <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg mb-6">
                            <Image
                              src={step.image}
                              alt={step.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}

                        {/* Expandable subsections - better styled */}
                        <div className="space-y-4 mt-6">
                          {/* Pro Tip Box */}
                          {step.tips.length > 0 && (
                            <div className="border-l-4 border-yellow-400 bg-yellow-50 rounded-r-xl overflow-hidden">
                              <div className="p-5">
                                <div className="flex items-center gap-3 mb-3">
                                  <Lightbulb className="w-6 h-6 text-yellow-600" />
                                  <span className="font-bold text-gray-900">Pro tippek</span>
                                </div>
                                <ul className="space-y-2">
                                  {step.tips.map((tip, tipIndex) => (
                                    <li
                                      key={tipIndex}
                                      className="flex items-start gap-2 text-gray-700"
                                    >
                                      <CheckCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                      <span>{tip}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* Example Box */}
                          <div className="border-l-4 border-teal-400 bg-teal-50 rounded-r-xl overflow-hidden">
                            <div className="p-5">
                              <div className="flex items-center gap-3 mb-3">
                                <FileText className="w-6 h-6 text-teal-600" />
                                <span className="font-bold text-gray-900">Példa</span>
                              </div>
                              <div className="bg-white rounded-lg p-4 border border-teal-200">
                                <p className="text-gray-700 italic">
                                  Itt látható egy példa a lépés alkalmazására...
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Additional Info Box */}
                          <details className="border-l-4 border-blue-400 bg-blue-50 rounded-r-xl overflow-hidden group">
                            <summary className="p-5 flex items-center justify-between cursor-pointer hover:bg-blue-100 transition-colors list-none">
                              <div className="flex items-center gap-3">
                                <Info className="w-6 h-6 text-blue-600" />
                                <span className="font-bold text-gray-900">További információk</span>
                              </div>
                              <ChevronDown className="w-5 h-5 text-gray-600 transition-transform group-open:rotate-180" />
                            </summary>
                            <div className="px-5 pb-5 text-gray-700">
                              <p>
                                Itt találhatók további részletek, gyakori kérdések, vagy haladó
                                használati esetek, amelyek segíthetnek mélyebb megértést nyerni.
                              </p>
                            </div>
                          </details>
                        </div>
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
                  </section>
                ))}
              </div>

              {/* Enhanced Completion Section */}
              <div className="mt-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-8 text-white">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Gratulálunk! 🎉</h3>
                    <p className="text-white/90 text-lg">
                      Sikeresen végigolvastad az útmutatót! Most már készen állsz arra, hogy
                      létrehozd a tökéletes ajánlatot.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/login?redirect=/new"
                    className="flex-1 bg-white text-teal-600 px-6 py-4 rounded-xl font-semibold hover:shadow-xl transition-all flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <Download className="w-5 h-5" />
                    <span>Próbáld ki most</span>
                  </Link>
                  <button className="flex-1 bg-white/20 backdrop-blur-sm text-white px-6 py-4 rounded-xl font-semibold hover:bg-white/30 transition-all border-2 border-white/30 flex items-center justify-center gap-2 min-h-[44px]">
                    <FileDown className="w-5 h-5" />
                    <span>PDF letöltése</span>
                  </button>
                </div>
              </div>

              {/* Feedback Section */}
              <GuideFeedback />
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Related Content */}
      {relatedResources.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Kapcsolódó tartalmak</h2>
                  <p className="text-gray-600">Folytasd a tanulást ezekkel az útmutatókkal</p>
                </div>
                <Link
                  href="/resources#guides"
                  className="text-teal-600 font-semibold hover:underline flex items-center gap-2"
                >
                  <span>Összes útmutató</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

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
