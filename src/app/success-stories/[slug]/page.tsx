import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import {
  ArrowRight,
  ChevronRight,
  Building2,
  Users,
  Clock,
  Award,
  AlertCircle,
  Lightbulb,
  Check,
  X,
  CheckCircle,
  MessageCircle,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { getCaseStudyBySlug, getRelatedCaseStudies } from '@/lib/case-studies';
import { MetricComparison } from '@/components/case-study-metric-comparison';
import { CaseStudyStructuredData } from '@/components/case-study-structured-data';
import { getAuthorImage } from '@/lib/testimonial-images';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug);

  if (!caseStudy) {
    return {
      title: 'Sikertörténet nem található',
    };
  }

  return {
    title: `${caseStudy.companyName} sikertörténete | Vyndi`,
    description: caseStudy.shortDescription,
    openGraph: {
      title: `${caseStudy.companyName} sikertörténete`,
      description: caseStudy.shortDescription,
      type: 'article',
    },
  };
}

export default async function CaseStudyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug);

  if (!caseStudy) {
    notFound();
  }

  const relatedCaseStudies = getRelatedCaseStudies(slug, 3);

  return (
    <div className="min-h-screen bg-white">
      <CaseStudyStructuredData caseStudy={caseStudy} />
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-6 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/success-stories" className="hover:text-turquoise-600">
            Sikertörténetek
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-navy-900">{caseStudy.companyName}</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-br from-navy-900 to-navy-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Company logo */}
            <div className="w-20 h-20 bg-white rounded-xl shadow-lg flex items-center justify-center mx-auto mb-6">
              <div className="w-16 h-16 bg-turquoise-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-turquoise-600">
                  {caseStudy.companyName.charAt(0)}
                </span>
              </div>
            </div>

            {/* Main result headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              &ldquo;{caseStudy.mainResult}&rdquo;
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-gray-300 mb-8">{caseStudy.shortDescription}</p>

            {/* Quick facts inline */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-turquoise-400" />
                <span>{caseStudy.industryLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-turquoise-400" />
                <span>{caseStudy.companySize}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-turquoise-400" />
                <span>{caseStudy.timeline}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-turquoise-400" />
                <span>{caseStudy.plan} csomag</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics Grid */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-navy-900 text-center mb-12">Elért eredmények</h2>

            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {caseStudy.metrics.map((metric) => (
                <div key={metric.id} className="bg-white rounded-2xl p-8 shadow-lg text-center">
                  <div className="text-5xl font-bold text-turquoise-600 mb-3">{metric.value}</div>
                  <div className="text-lg font-semibold text-navy-900 mb-2">{metric.label}</div>
                  <div className="text-sm text-gray-600">{metric.description}</div>
                </div>
              ))}
            </div>

            {/* Before/After Comparisons */}
            {caseStudy.metrics.some((m) => m.before && m.after) && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-navy-900 text-center mb-8">
                  Eredmények összehasonlítása
                </h3>
                {caseStudy.metrics
                  .filter((m) => m.before && m.after)
                  .map((metric) => (
                    <MetricComparison
                      key={metric.id}
                      before={{
                        value: metric.before!,
                        label: metric.label,
                      }}
                      after={{
                        value: metric.after!,
                        label: metric.label,
                      }}
                      improvement={metric.improvement || ''}
                      timeline={caseStudy.timeline}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Challenge Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-6 mb-8">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-navy-900 mb-4">A kihívás</h2>
                <p className="text-lg text-gray-700 leading-relaxed">{caseStudy.challenge}</p>
              </div>
            </div>

            {/* Challenge details */}
            <div className="bg-gray-50 rounded-2xl p-8 ml-18">
              <ul className="space-y-4">
                {caseStudy.challengePoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-6 mb-8">
              <div className="w-12 h-12 bg-turquoise-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-6 h-6 text-turquoise-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-navy-900 mb-4">A megoldás</h2>
                <p className="text-lg text-gray-700 leading-relaxed">{caseStudy.solution}</p>
              </div>
            </div>

            {/* Solution features used */}
            <div className="bg-white rounded-2xl p-8 ml-18 shadow-lg">
              <h3 className="font-bold text-navy-900 mb-6">Használt Vyndi funkciók:</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {caseStudy.featuresUsed.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-turquoise-600 flex-shrink-0 mt-1" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Timeline */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-navy-900 text-center mb-12">
              Eredmények idővonalon
            </h2>

            <div className="space-y-8">
              {caseStudy.resultTimeline.map((milestone, idx) => (
                <div key={idx} className="flex items-start gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-turquoise-500 text-white rounded-full flex items-center justify-center font-bold">
                      {milestone.week}
                    </div>
                    {idx < caseStudy.resultTimeline.length - 1 && (
                      <div className="w-0.5 h-full bg-turquoise-200 my-2"></div>
                    )}
                  </div>

                  <div className="flex-1 pb-8">
                    <div className="text-sm text-gray-600 mb-2">{milestone.period}</div>
                    <h3 className="font-bold text-navy-900 mb-2">{milestone.title}</h3>
                    <p className="text-gray-700">{milestone.description}</p>
                    {milestone.metrics && (
                      <div className="mt-4 inline-block px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold text-sm">
                        {milestone.metrics}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Full Testimonial */}
      <section className="py-16 bg-turquoise-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Quote mark */}
            <div className="text-6xl text-turquoise-300 font-serif mb-6">&ldquo;</div>

            {/* Full quote */}
            <blockquote className="text-2xl text-navy-900 leading-relaxed mb-8 font-medium">
              {caseStudy.testimonial.fullQuote}
            </blockquote>

            {/* Author with image */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-turquoise-100 flex-shrink-0">
                <Image
                  src={getAuthorImage(caseStudy.testimonial.author)}
                  alt={caseStudy.testimonial.author}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="font-bold text-navy-900 text-lg">
                  {caseStudy.testimonial.author}
                </div>
                <div className="text-gray-600">{caseStudy.testimonial.role}</div>
                <div className="text-gray-500">{caseStudy.companyName}</div>
              </div>

              {/* Verified badge */}
              <div className="ml-auto">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  Ellenőrzött ügyfél
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Implementation Details */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-navy-900 mb-8">
              Hogyan történt a megvalósítás?
            </h2>

            <div className="space-y-6">
              {caseStudy.implementationSteps.map((step, idx) => (
                <div key={idx} className="bg-gray-50 rounded-2xl p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-turquoise-500 text-white rounded-lg flex items-center justify-center font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-navy-900 mb-2 text-lg">{step.title}</h3>
                      <p className="text-gray-700 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Related Case Studies */}
      {relatedCaseStudies.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-navy-900 text-center mb-12">
                Hasonló sikertörténetek
              </h2>

              <div className="grid md:grid-cols-3 gap-8">
                {relatedCaseStudies.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/success-stories/${related.slug}`}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6"
                  >
                    {/* Compact case study card */}
                    <div className="w-12 h-12 bg-turquoise-100 rounded-lg mb-4 flex items-center justify-center">
                      <span className="text-turquoise-600 font-bold text-xl">
                        {related.companyName.charAt(0)}
                      </span>
                    </div>
                    <h3 className="font-bold text-navy-900 mb-2">{related.companyName}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {related.shortDescription}
                    </p>
                    <div className="text-turquoise-600 font-semibold text-sm flex items-center gap-2">
                      Teljes történet
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="py-20 bg-gradient-to-br from-turquoise-500 to-blue-500 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Érj el hasonló eredményeket</h2>
            <p className="text-xl mb-8 text-white/90">
              Csatlakozz {caseStudy.companyName}-hoz és 500+ céghez, akik már átlagosan 70%-kal
              gyorsabban készítik ajánlataikat
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login?redirect=/new"
                className="bg-white hover:bg-gray-50 text-turquoise-600 font-bold px-10 py-4 rounded-xl text-lg shadow-xl transition-all inline-flex items-center justify-center gap-2 min-h-[44px]"
              >
                14 napos ingyenes próba
              </Link>
              <Link
                href="/billing"
                className="bg-transparent hover:bg-white/10 text-white font-bold px-10 py-4 rounded-xl text-lg border-2 border-white transition-all inline-flex items-center justify-center gap-2 min-h-[44px]"
              >
                <MessageCircle className="w-5 h-5" />
                Demo kérése
              </Link>
            </div>
            <div className="flex justify-center gap-6 mt-8 text-sm text-white/90">
              <span>✓ Nincs bankkártya</span>
              <span>✓ 30 napos garancia</span>
              <span>✓ Bármikor lemondható</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
