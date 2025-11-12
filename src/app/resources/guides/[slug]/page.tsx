import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import {
  ArrowRight,
  ChevronRight,
  Clock,
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
import { ShareDropdown } from '@/components/guides/ShareDropdown';
import { GuideFeedback } from '@/components/guides/GuideFeedback';
import { TimeRemaining } from '@/components/guides/TimeRemaining';
import { NewsletterSubscription } from '@/components/landing/NewsletterSubscription';

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

  return (
    <div className="min-h-screen bg-white">
      <ResourceStructuredData resource={resource} />

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
                {resource.readingTime && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{resource.readingTime} perc</span>
                  </div>
                )}
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
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Bevezetés</h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                Ez az útmutató lépésről lépésre végigvezet a folyamaton. Minden lépés részletes
                leírást tartalmaz, képekkel és tippekkel kiegészítve. Kövesd a lépéseket sorrendben
                a legjobb eredményért.
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
                          <Image src={step.image} alt={step.title} fill className="object-cover" />
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
                    Sikeresen végigolvastad az útmutatót! Most már készen állsz arra, hogy létrehozd
                    a tökéletes ajánlatot.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/login?redirect=/new"
                  className="group flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl px-6 py-4 min-h-[56px] flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 relative overflow-hidden"
                >
                  <span className="relative z-10 text-base text-white">Próbáld ki most ingyen</span>
                  <ArrowRight className="w-5 h-5 flex-shrink-0 relative z-10 text-white transition-transform duration-300 group-hover:translate-x-1" />
                  <span className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
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
            <NewsletterSubscription source="guide_page" />
          </div>
        </div>
      </section>
    </div>
  );
}
