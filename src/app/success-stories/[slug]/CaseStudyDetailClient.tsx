'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Building2,
  Clock,
  Award,
  AlertCircle,
  Lightbulb,
  CheckCircle,
  XCircle,
  FileText,
  TrendingDown,
  Zap,
  Settings,
  Rocket,
  Target,
  Sparkles,
} from 'lucide-react';
import type { CaseStudy } from '@/types/case-study';
import { getRelatedCaseStudies } from '@/lib/case-studies';
import { getAuthorImage } from '@/lib/testimonial-images';

interface CaseStudyDetailClientProps {
  caseStudy: CaseStudy;
}

export function CaseStudyDetailClient({ caseStudy }: CaseStudyDetailClientProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  const relatedCaseStudies = getRelatedCaseStudies(caseStudy.slug, 3);

  // Show floating CTA after scrolling past hero
  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = 400; // Approximate hero section height
      setShowFloatingCTA(window.scrollY > heroHeight);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get primary metric for hero display
  const primaryMetric = caseStudy.metrics[0];
  const improvementValue = primaryMetric?.improvement?.match(/\d+/)?.[0] || '0';

  return (
    <div className="min-h-screen bg-bg">
      {/* Breadcrumb Navigation */}
      <nav
        className="container mx-auto px-4 py-6 border-b border-border bg-bg-muted"
        aria-label="Breadcrumb"
      >
        <Link
          href="/sikertortenetek-ajanlatkeszites-automatizalas"
          className="inline-flex items-center gap-2 text-fg-muted hover:text-primary transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Vissza a sikertörténetekhez</span>
        </Link>
      </nav>

      {/* Enhanced Hero Section */}
      <header
        className="py-12 md:py-16 bg-gradient-to-br from-navy-900 via-navy-800 to-primary/80 text-primary-ink relative overflow-hidden"
        aria-labelledby="case-study-title"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-turquoise-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Eyebrow text */}
            <div className="text-center mb-6">
              <span className="inline-block px-4 py-2 bg-turquoise-500/20 text-turquoise-300 rounded-full font-semibold text-sm border border-turquoise-500/30">
                SIKERTÖRTÉNET
              </span>
            </div>

            {/* Company Context */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
              {/* Company logo */}
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-center border border-white/20">
                {caseStudy.companyLogo ? (
                  <Image
                    src={caseStudy.companyLogo}
                    alt={caseStudy.companyName}
                    width={64}
                    height={64}
                    className="w-16 h-16 object-contain p-2"
                  />
                ) : (
                  <div className="w-16 h-16 bg-turquoise-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-turquoise-600">
                      {caseStudy.companyName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-center md:text-left">
                <h2 className="text-white font-semibold text-2xl mb-3">{caseStudy.companyName}</h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm">
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white">
                    {caseStudy.industryLabel}
                  </span>
                  <span className="text-primary-ink/70 flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {caseStudy.companySize}
                  </span>
                  <span className="text-primary-ink/70 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {caseStudy.timeline}
                  </span>
                </div>
              </div>
            </div>

            {/* Main result quote - reduced prominence */}
            <div className="text-center mb-8">
              <h1
                id="case-study-title"
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight"
              >
                {caseStudy.mainResult}
              </h1>
              <p className="text-lg md:text-xl text-primary-ink/80 max-w-3xl mx-auto">
                {caseStudy.shortDescription}
              </p>
            </div>

            {/* Quick facts */}
            <div className="flex flex-wrap justify-center gap-6 text-sm border-t border-white/20 pt-8">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-turquoise-400" />
                <span>{caseStudy.plan} csomag</span>
              </div>
              {primaryMetric && (
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-turquoise-400" />
                  <span>{improvementValue}% javulás</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <article aria-labelledby="case-study-title">
        {/* Enhanced Metrics Section */}
        <section className="py-16 bg-white" aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className="sr-only">
            Mérőszámok
          </h2>
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-fg text-center mb-12">
                Elért eredmények
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {caseStudy.metrics.map((metric, index) => {
                  const isPrimary = index === 0;
                  const iconMap: Record<number, typeof Clock> = {
                    0: Clock,
                    1: FileText,
                    2: TrendingDown,
                  };
                  const Icon = iconMap[index] || Clock;

                  // Use static Tailwind classes
                  const colorClasses = [
                    { bg: 'bg-primary/10', text: 'text-primary', icon: 'text-primary' },
                    { bg: 'bg-accent/10', text: 'text-accent/90', icon: 'text-accent/90' },
                    { bg: 'bg-warning/10', text: 'text-warning/90', icon: 'text-warning/90' },
                  ];
                  const colors = colorClasses[index] || colorClasses[0];

                  return (
                    <div
                      key={metric.id}
                      className="bg-white rounded-xl p-6 md:p-8 shadow-lg relative overflow-hidden"
                    >
                      {/* Decorative background element */}
                      <div
                        className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full -mr-16 -mt-16`}
                      ></div>

                      <div className="relative z-10">
                        <Icon
                          className={`w-6 md:w-8 h-6 md:h-8 ${colors.icon} mb-3 ${
                            isPrimary ? 'md:w-10 md:h-10' : ''
                          }`}
                        />
                        <div
                          className={`font-bold mb-2 ${colors.text} ${
                            isPrimary ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'
                          }`}
                        >
                          {metric.value}
                        </div>
                        <div
                          className={`font-semibold mb-1 ${
                            isPrimary ? 'text-lg' : 'text-base'
                          } text-fg`}
                        >
                          {metric.label}
                        </div>
                        <div className={`text-fg-muted ${isPrimary ? 'text-sm' : 'text-xs'}`}>
                          {metric.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Enhanced Before/After Comparisons */}
              {caseStudy.metrics.some((m) => m.before && m.after) && (
                <div className="space-y-8">
                  <h3 className="text-2xl font-bold text-navy-900 text-center mb-8">
                    Eredmények számokban
                  </h3>
                  {caseStudy.metrics
                    .filter((m) => m.before && m.after)
                    .map((metric) => (
                      <div
                        key={metric.id}
                        className="bg-gradient-to-r from-danger/10 to-success/10 rounded-xl p-6 md:p-8 border border-border"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                          {/* Before - Red/Orange tint */}
                          <div className="bg-bg-muted rounded-xl p-6 border-2 border-danger/30 shadow-sm text-center">
                            <div className="text-xs text-danger font-semibold mb-2 uppercase tracking-wide">
                              Előtte
                            </div>
                            <div className="text-3xl md:text-4xl font-bold text-fg mb-1">
                              {metric.before}
                            </div>
                            <div className="text-sm text-fg-muted">{metric.label}</div>
                          </div>

                          {/* Arrow with improvement */}
                          <div className="text-center flex flex-col items-center justify-center">
                            <ArrowRight className="w-12 h-16 md:w-16 md:h-20 mx-auto text-fg-muted mb-3 hidden md:block" />
                            <div className="bg-success text-primary-ink px-4 py-2 rounded-full inline-flex items-center gap-2 shadow-lg">
                              <TrendingDown className="w-4 h-4" />
                              <span className="font-bold">{metric.improvement || 'Javulás'}</span>
                            </div>
                          </div>

                          {/* After - Green tint */}
                          <div className="bg-bg-muted rounded-xl p-6 border-2 border-success/30 shadow-sm text-center">
                            <div className="text-xs text-success font-semibold mb-2 uppercase tracking-wide">
                              Utána
                            </div>
                            <div className="text-3xl md:text-4xl font-bold text-success mb-1">
                              {metric.after}
                            </div>
                            <div className="text-sm text-fg-muted">Vyndi-val</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Enhanced Challenge Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-navy-900 mb-2">A kihívás</h2>
                    <p className="text-lg text-fg leading-relaxed">{caseStudy.challenge}</p>
                  </div>
                </div>

                {/* Challenge details with better spacing */}
                <div className="space-y-4">
                  {caseStudy.challengePoints.map((point, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-4 bg-bg-muted rounded-lg hover:bg-bg transition-colors"
                    >
                      <XCircle className="w-5 h-5 text-danger mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-fg">{point}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Solution Section */}
        <section className="py-16 bg-gradient-to-br from-teal-50 to-blue-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-teal-500 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-navy-900 mb-2">
                      A megoldás
                    </h2>
                    <p className="text-lg text-fg leading-relaxed">{caseStudy.solution}</p>
                  </div>
                </div>

                {/* Solution features used */}
                <div className="space-y-3">
                  <h3 className="font-bold text-navy-900 mb-4 text-lg">Használt Vyndi funkciók:</h3>
                  {caseStudy.featuresUsed.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-bg-muted p-4 rounded-lg shadow-sm border border-primary/30"
                    >
                      <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
                      <span className="text-fg">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Visual Timeline */}
        <section
          className="py-16 bg-gradient-to-b from-gray-50 to-white"
          aria-label="Eredmények idővonalon"
        >
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-navy-900 text-center mb-12">
                Eredmények idővonalon
              </h2>

              {/* Vertical Timeline */}
              <ol className="relative pl-8 md:pl-0 list-none">
                {/* Vertical line - more prominent with gradient */}
                <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1.5 bg-gradient-to-b from-teal-400 via-teal-500 to-teal-600 transform md:-translate-x-1/2 rounded-full shadow-sm"></div>

                {/* Timeline items */}
                <div className="space-y-12">
                  {caseStudy.resultTimeline.map((milestone, idx) => {
                    // Determine icon based on milestone type
                    const getMilestoneIcon = () => {
                      const title = milestone.title.toLowerCase();
                      if (
                        title.includes('onboarding') ||
                        title.includes('beállítás') ||
                        title.includes('létrehozás')
                      ) {
                        return Settings;
                      }
                      if (
                        title.includes('átállás') ||
                        title.includes('tanulás') ||
                        title.includes('fejlesztés')
                      ) {
                        return Rocket;
                      }
                      if (
                        title.includes('maximális') ||
                        title.includes('teljes') ||
                        title.includes('hatékonyság')
                      ) {
                        return Target;
                      }
                      return Sparkles;
                    };

                    const MilestoneIcon = getMilestoneIcon();

                    return (
                      <li key={idx} className="relative flex items-start gap-6 md:gap-8 group">
                        {/* Timeline dot and connector */}
                        <div className="relative flex-shrink-0 z-10">
                          {/* Timeline dot with checkmark for completed stages */}
                          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-xl ring-4 ring-white relative z-10 transform -translate-x-3 md:-translate-x-1/2 -translate-y-1/2 top-0 group-hover:scale-110 transition-transform duration-300">
                            <CheckCircle
                              className="w-6 h-6 md:w-7 md:h-7 text-white"
                              strokeWidth={2.5}
                            />
                          </div>
                          {/* Week badge - mobile only, positioned above */}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 md:hidden">
                            <span className="text-xs font-semibold text-teal-700 bg-white px-2 py-1 rounded-full shadow-sm border border-teal-300">
                              {milestone.week}
                            </span>
                          </div>
                        </div>

                        {/* Content card */}
                        <div className="flex-1 pt-1">
                          <article className="bg-white rounded-xl p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-teal-300 group max-w-2xl mx-auto hover:-translate-y-1">
                            {/* Week and period header - muted styling */}
                            <div className="flex items-center justify-center gap-3 mb-4">
                              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200/60">
                                {milestone.week}
                              </span>
                              <span className="text-xs text-gray-500 font-medium">
                                {milestone.period}
                              </span>
                            </div>

                            {/* Title with icon */}
                            <div className="flex items-center justify-center gap-2 mb-3">
                              <MilestoneIcon className="w-5 h-5 text-teal-600 flex-shrink-0" />
                              <h3 className="font-bold text-xl md:text-2xl text-navy-900 group-hover:text-teal-600 transition-colors text-center">
                                {milestone.title}
                              </h3>
                            </div>

                            {/* Description */}
                            <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-6 text-center">
                              {milestone.description}
                            </p>

                            {/* Enhanced Outcome Metrics */}
                            {milestone.metrics && (
                              <div className="flex justify-center">
                                <div className="inline-flex flex-col items-center gap-2 px-6 py-4 bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-green-400/30 min-w-[200px]">
                                  <div className="flex items-center gap-2">
                                    <TrendingDown className="w-5 h-5" strokeWidth={2.5} />
                                    <span className="text-xs uppercase tracking-wide opacity-90">
                                      Eredmény
                                    </span>
                                  </div>
                                  <span className="text-base md:text-lg text-center leading-tight">
                                    {milestone.metrics}
                                  </span>
                                </div>
                              </div>
                            )}
                          </article>
                        </div>
                      </li>
                    );
                  })}
                </div>
              </ol>
            </div>
          </div>
        </section>

        {/* Enhanced Testimonial Section */}
        <section className="py-16 bg-gradient-to-br from-teal-500 to-blue-600 text-white relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
              {/* Decorative quote mark - closer to text */}
              <div className="text-white/20 text-7xl md:text-9xl font-serif mb-4 -ml-4">
                &ldquo;
              </div>

              {/* Quote text - break into paragraphs */}
              <blockquote className="text-xl md:text-2xl text-white font-medium leading-relaxed mb-8 max-w-4xl">
                {caseStudy.testimonial.fullQuote
                  .split(/\n+/)
                  .filter(Boolean)
                  .map((paragraph, idx) => (
                    <p key={idx} className="mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
              </blockquote>

              {/* Client info - more prominent */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white/30 flex-shrink-0">
                  <Image
                    src={getAuthorImage(caseStudy.testimonial.author)}
                    alt={caseStudy.testimonial.author}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold text-lg">{caseStudy.testimonial.author}</div>
                  <div className="text-white/80">{caseStudy.testimonial.role}</div>
                  <div className="text-white/70 text-sm">{caseStudy.companyName}</div>
                </div>

                {/* Verified badge */}
                <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  Ellenőrzött
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced FAQ Section - Accordion Style */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-navy-900 mb-8">
                Hogyan történt a megvalósítás?
              </h2>

              <div className="space-y-3">
                {caseStudy.implementationSteps.map((step, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === idx + 1 ? null : idx + 1)}
                      className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 font-bold flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </div>
                        <span className="font-semibold text-gray-800 text-lg">{step.title}</span>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                          openFaq === idx + 1 ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {openFaq === idx + 1 && (
                      <div className="px-6 pb-6 text-gray-600 leading-relaxed ml-12">
                        {step.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Related Case Studies */}
        {relatedCaseStudies.length > 0 && (
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-navy-900 text-center mb-12">
                  Hasonló sikertörténetek
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedCaseStudies.map((related, index) => {
                    // Use static Tailwind classes
                    const gradients = [
                      'from-purple-400 to-pink-600',
                      'from-blue-400 to-indigo-600',
                      'from-teal-400 to-cyan-600',
                    ];
                    const gradient = gradients[index % 3] || 'from-teal-400 to-blue-600';
                    const primaryMetric = related.metrics[0];
                    const improvementValue = primaryMetric?.improvement?.match(/\d+/)?.[0] || '0';

                    return (
                      <Link
                        key={related.slug}
                        href={`/sikertortenetek-ajanlatkeszites-automatizalas/${related.slug}`}
                        className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                      >
                        {/* Gradient header */}
                        <div className={`h-24 bg-gradient-to-br ${gradient} relative`}>
                          <div className="absolute bottom-4 left-6">
                            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white font-semibold">
                              {related.industryLabel}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          <h4 className="font-bold text-xl mb-2 group-hover:text-teal-600 transition-colors">
                            {related.companyName}
                          </h4>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {related.shortDescription}
                          </p>

                          {/* Key metric highlight */}
                          {primaryMetric && (
                            <div className="flex gap-4 mb-4">
                              <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-teal-600">
                                  {improvementValue}%
                                </div>
                                <div className="text-xs text-gray-600">Javulás</div>
                              </div>
                              <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                  {primaryMetric.value}
                                </div>
                                <div className="text-xs text-gray-600">{primaryMetric.label}</div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-teal-100">
                                <Image
                                  src={getAuthorImage(related.testimonial.author)}
                                  alt={related.testimonial.author}
                                  width={32}
                                  height={32}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="text-xs">
                                <div className="font-semibold">{related.testimonial.author}</div>
                                <div className="text-gray-500">{related.testimonial.role}</div>
                              </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-teal-600 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Back to Stories Link */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <Link
              href="/sikertortenetek-ajanlatkeszites-automatizalas"
              className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:gap-3 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              További sikertörténetek
            </Link>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-20 bg-gradient-to-br from-turquoise-500 to-blue-500 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Érj el hasonló eredményeket</h2>
              <p className="text-xl mb-8 text-white/90">
                Csatlakozz {caseStudy.companyName}-hoz és 500+ céghez, akik már átlagosan 70%-kal
                gyorsabban készítik ajánlataikat
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/login?redirect=/new"
                  className="group bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl px-8 py-4 min-h-[56px] w-full sm:w-auto flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 relative overflow-hidden"
                >
                  <span className="relative z-10 text-base md:text-lg text-white">
                    Próbáld ki most ingyen
                  </span>
                  <ArrowRight className="w-5 h-5 flex-shrink-0 relative z-10 text-white transition-transform duration-300 group-hover:translate-x-1" />
                  <span className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Link>
              </div>
              {/* Trust Indicators - 3 features from landing hero */}
              <div className="flex flex-wrap justify-center gap-6 mt-8 text-white/90">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>Kezdd el teljesen ingyen</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>Nem kérünk bankkártyát</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>Kész ajánlat 5 perc alatt</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </article>

      {/* Floating CTA */}
      {showFloatingCTA && (
        <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <Link
            href="/login?redirect=/new"
            className="group bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-full shadow-2xl hover:bg-orange-600 flex items-center gap-2 transition-all hover:scale-105"
          >
            <span className="font-semibold">Próbáld ki ingyen</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      )}
    </div>
  );
}
