import Link from 'next/link';
import HighlightUnderline from '@/components/HighlightUnderline';
import { Card } from '@/components/ui/Card';
import VideoPlayer from '@/components/landing/VideoPlayer';
import TestimonialCard from '@/components/landing/TestimonialCard';
import FAQ from '@/components/landing/FAQ';
import TrustBadges from '@/components/landing/TrustBadges';
import FeatureCard from '@/components/landing/FeatureCard';
import StatCard from '@/components/landing/StatCard';
import CustomerLogos from '@/components/landing/CustomerLogos';
import SocialProofWidget from '@/components/landing/SocialProofWidget';
import ComparisonTable from '@/components/landing/ComparisonTable';
import CaseStudyCard from '@/components/landing/CaseStudyCard';
import ROICalculator from '@/components/landing/ROICalculator';
import GuaranteeBadge from '@/components/landing/GuaranteeBadge';
import ProductScreenshot from '@/components/landing/ProductScreenshot';
import ProductGif from '@/components/landing/ProductGif';
import { LandingPageClient } from '@/components/landing/LandingPageClient';
import StickyCTABar from '@/components/landing/StickyCTABar';
import CustomerTicker from '@/components/landing/CustomerTicker';
import RecentlyJoinedWidget from '@/components/landing/RecentlyJoinedWidget';
import UseCasesSection from '@/components/landing/UseCasesSection';
import ResourcesSection from '@/components/landing/ResourcesSection';
import EnterpriseCTA from '@/components/landing/EnterpriseCTA';
import EmailCapture from '@/components/landing/EmailCapture';
import { t } from '@/copy';

export default function Home() {
  // Problem-Agitate-Solve section data
  const painPoints = [
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      text: t('landing.painPoints.timeConsuming'),
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      text: t('landing.painPoints.inconsistentDesign'),
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      text: t('landing.painPoints.poorCollaboration'),
    },
  ];

  // Enhanced features with icons
  const features = [
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      ),
      title: t('landing.featuresInline.unifiedInterface.title'),
      description: t('landing.featuresInline.unifiedInterface.description'),
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
      title: t('landing.featuresInline.aiBrief.title'),
      description: t('landing.featuresInline.aiBrief.description'),
      highlight: true,
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      ),
      title: t('landing.featuresInline.clientSharing.title'),
      description: t('landing.featuresInline.clientSharing.description'),
    },
  ];

  const steps = [
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      title: t('landing.stepsInline.brief.title'),
      description: t('landing.stepsInline.brief.description'),
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
          />
        </svg>
      ),
      title: t('landing.stepsInline.aiTemplates.title'),
      description: t('landing.stepsInline.aiTemplates.description'),
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: t('landing.stepsInline.share.title'),
      description: t('landing.stepsInline.share.description'),
    },
  ];

  const testimonials = [
    {
      quote:
        'A Vyndi segít gyorsan és professzionálisan készíteni ajánlatokat. Végre egy egyszerű eszköz, amit a teljes csapat használhat.',
      author: 'Kiss Júlia',
      role: 'Ügynökségvezető',
      company: 'Studio Fluo',
      rating: 5,
      avatarUrl: undefined, // Add actual avatar URLs when available
    },
    {
      quote:
        'Az AI segítségével 70%-kal gyorsabban készítünk ajánlatokat, és mégis profibbnak tűnnek. Az ügyfeleink is észrevették a különbséget.',
      author: 'Nagy Péter',
      role: 'Üzletfejlesztési vezető',
      company: 'Tech Solutions Kft.',
      rating: 5,
      avatarUrl: undefined,
    },
    {
      quote:
        'A márkázott PDF-ek automatikus generálása óriási időmegtakarítás. Most már nem kell minden alkalommal újra formázni a dokumentumokat.',
      author: 'Szabó Anna',
      role: 'Projektmenedzser',
      company: 'Creative Agency',
      rating: 5,
      avatarUrl: undefined,
    },
  ];

  const faqItems = [
    {
      question: 'Mennyi időbe telik megtanulni a Vyndi használatát?',
      answer:
        'A Vyndi intuitív felülettel rendelkezik, amelyet percek alatt elsajátíthatsz. Az első ajánlatodat 10 perc alatt elkészítheted, és az AI segítségével még gyorsabban haladsz. Részletes útmutatókat és videókat is biztosítunk.',
    },
    {
      question: 'Milyen formátumokban exportálhatom az ajánlatokat?',
      answer:
        'Az ajánlatokat márkázott PDF formátumban exportálhatod, amely automatikusan tartalmazza a logód, színeidet és betűtípusaidat. A PDF-ek nyomtatható minőségűek és minden eszközön tökéletesen megjelennek.',
    },
    {
      question: 'Működik offline is?',
      answer:
        'A Vyndi web-alapú alkalmazás, amely internetkapcsolatot igényel az AI funkciókhoz és a szinkronizációhoz. Azonban az elkészített ajánlatokat PDF-ként letöltheted, amelyeket offline is megoszthatsz.',
    },
    {
      question: 'Biztonságosak az adataim?',
      answer:
        'Igen, az adatvédelem prioritásunk. Minden adatot titkosított kapcsolaton keresztül tárolunk, és GDPR-kompatibilis adatkezelést alkalmazunk. Az ajánlatok csak az általad megosztott személyek számára érhetők el.',
    },
    {
      question: 'Van ingyenes próbaverzió?',
      answer:
        'Igen! Ingyenesen regisztrálhatsz és azonnal elkezdhetsz ajánlatokat készíteni. Az ingyenes csomag korlátozott funkciókkal rendelkezik, de tökéletes a kipróbáláshoz. Nincs bankkártya adat megadása szükséges.',
    },
    {
      question: 'Milyen támogatást kapok?',
      answer:
        '24/7 email támogatást nyújtunk, valamint részletes dokumentációt és videó útmutatókat. A Pro csomag előfizetőink prioritásos támogatást kapnak, és hozzáférnek a közösségi fórumhoz is.',
    },
  ];

  const trustBadges = [
    {
      icon: (
        <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      text: 'GDPR-kompatibilis',
    },
    {
      icon: (
        <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
      text: 'Biztonságos adattárolás',
    },
    {
      icon: (
        <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      text: '99.9% rendelkezésre állás',
    },
    {
      icon: (
        <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      text: '24/7 támogatás',
    },
    {
      icon: (
        <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      text: 'Ingyenes próba',
    },
    {
      icon: (
        <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      text: t('landing.trustBadgesInline.noCreditCard'),
    },
  ];

  const customerLogos: Array<{ src: string; alt: string }> = [
    // Add actual logo paths when available
    // { src: '/images/logos/company1.svg', alt: 'Company 1' },
  ];

  const caseStudies = [
    {
      company: t('landing.caseStudiesInline.studioFluo.company'),
      industry: t('landing.caseStudiesInline.studioFluo.industry'),
      challenge: t('landing.caseStudiesInline.studioFluo.challenge'),
      solution: t('landing.caseStudiesInline.studioFluo.solution'),
      results: [
        { metric: t('landing.caseStudiesInline.studioFluo.results.timeSaved'), value: '70%' },
        { metric: t('landing.caseStudiesInline.studioFluo.results.offersPerWeek'), value: '25+' },
        { metric: t('landing.caseStudiesInline.studioFluo.results.acceptanceRate'), value: '+35%' },
      ],
      quote: t('landing.caseStudiesInline.studioFluo.quote'),
      author: t('landing.caseStudiesInline.studioFluo.author'),
      role: t('landing.caseStudiesInline.studioFluo.role'),
    },
    {
      company: t('landing.caseStudiesInline.techSolutions.company'),
      industry: t('landing.caseStudiesInline.techSolutions.industry'),
      challenge: t('landing.caseStudiesInline.techSolutions.challenge'),
      solution: t('landing.caseStudiesInline.techSolutions.solution'),
      results: [
        { metric: t('landing.caseStudiesInline.techSolutions.results.offerTime'), value: '-65%' },
        {
          metric: t('landing.caseStudiesInline.techSolutions.results.templatesCount'),
          value: '50+',
        },
        { metric: t('landing.caseStudiesInline.techSolutions.results.satisfaction'), value: '98%' },
      ],
      quote: t('landing.caseStudiesInline.techSolutions.quote'),
      author: t('landing.caseStudiesInline.techSolutions.author'),
      role: t('landing.caseStudiesInline.techSolutions.role'),
    },
  ];

  return (
    <main id="main" className="flex flex-col gap-20 pb-32 md:gap-28 md:pb-40">
      {/* HERO SECTION - Cleaner design */}
      <section className="relative mx-auto w-full max-w-7xl px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary bg-primary/10 px-5 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {t('landing.hero.badge')}
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-[-0.125rem] text-[#1c274c] md:text-5xl lg:text-6xl">
            {t('landing.hero.titleLine1')}{' '}
            <HighlightUnderline>{t('landing.hero.highlighted')}</HighlightUnderline>.
            <br />
            <span className="text-primary">{t('landing.hero.titleLine2')}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-[1.6] text-fg-muted md:text-xl">
            {t('landing.hero.description')}
          </p>

          {/* Pricing Display */}
          <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-fg-muted">
            <span className="text-xl font-bold text-primary md:text-2xl">
              {t('landing.hero.pricing.starting')}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="text-base md:text-sm">{t('landing.hero.pricing.standard')}</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-base md:text-sm">{t('landing.hero.pricing.pro')}</span>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login?redirect=/new"
              className="group inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-ink shadow-lg transition-all duration-200 ease-out hover:shadow-pop hover:scale-105 active:scale-95"
            >
              <span>{t('landing.hero.primaryCta')}</span>
              <svg
                className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
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
            </Link>
            <a
              href="#product-demo"
              className="inline-flex items-center justify-center rounded-full border-2 border-border px-8 py-4 text-base font-semibold text-fg transition-all duration-200 ease-out hover:border-primary hover:text-primary hover:bg-primary/5"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {t('landing.hero.secondaryCta')}
            </a>
          </div>

          {/* Trust badges in hero */}
          <TrustBadges badges={trustBadges} className="mt-8" />

          {/* Customer ticker */}
          <CustomerTicker className="mt-6" />
        </div>
      </section>

      {/* PROBLEM-AGITATE-SOLVE SECTION */}
      <section className="mx-auto w-full max-w-6xl px-6">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.36em] text-primary">
            {t('landing.problemSection.badge')}
          </span>
          <h2 className="mt-4 text-3xl font-semibold text-fg md:text-4xl">
            {t('landing.problemSection.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-fg-muted">
            {t('landing.problemSection.description')}
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {painPoints.map((point, index) => (
            <Card
              key={index}
              className="flex items-start gap-4 p-6 transition-all duration-200 hover:border-primary/40"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                {point.icon}
              </div>
              <p className="text-base font-medium text-fg">{point.text}</p>
            </Card>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 p-8 md:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <h3 className="text-2xl font-semibold text-fg md:text-3xl">
              {t('landing.problemSection.solutionTitle')}
            </h3>
            <p className="mt-4 text-lg text-fg-muted">
              {t('landing.problemSection.solutionDescription')}
            </p>
          </div>
        </div>
      </section>

      {/* ENHANCED FEATURES SECTION */}
      <section className="mx-auto w-full max-w-6xl px-6">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.36em] text-primary">
            {t('landing.featuresSection.badge')}
          </span>
          <h2 className="mt-4 text-3xl font-semibold text-fg md:text-4xl">
            {t('landing.featuresSection.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-fg-muted">
            {t('landing.featuresSection.description')}
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              highlight={feature.highlight}
            />
          ))}
        </div>
      </section>

      {/* PRODUCT DEMO SECTION - Enhanced with screenshots/GIFs */}
      <section id="product-demo" className="mx-auto w-full max-w-6xl px-6 scroll-mt-20">
        <Card className="overflow-hidden p-8 md:p-12">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.36em] text-primary">
                {t('landing.demoSection.badge')}
              </span>
              <h2 className="mt-4 text-3xl font-semibold text-fg md:text-4xl">
                {t('landing.demoSection.title')}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-fg-muted">
                {t('landing.demoSection.description')}
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  t('landing.productVideo.features.0'),
                  t('landing.productVideo.features.1'),
                  t('landing.productVideo.features.2'),
                  t('landing.productVideo.features.3'),
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-base text-fg-muted">
                    <svg
                      className="h-5 w-5 flex-shrink-0 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  href="/login?redirect=/new"
                  className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-ink shadow-lg transition-all duration-200 hover:shadow-pop hover:scale-105"
                >
                  {t('landing.productVideo.cta')}
                  <svg
                    className="ml-2 h-5 w-5"
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
                </Link>
              </div>
            </div>
            <div className="relative">
              <VideoPlayer
                title="Vyndi Product Demo"
                className="w-full"
                // Add videoUrl and thumbnailUrl props when available
              />
            </div>
          </div>
        </Card>

        {/* Product Screenshots/GIFs Grid */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <ProductGif
            alt="AI-alapú szöveg generálás animáció"
            caption="AI-alapú szöveg generálás"
            // src="/images/gifs/ai-generation.gif" // Add when available
          />
          <ProductGif
            alt="Reszponzív szerkesztés animáció"
            caption="Reszponzív szerkesztés"
            // src="/images/gifs/drag-drop.gif" // Add when available
          />
          <ProductScreenshot
            alt="Márkázott PDF előnézet"
            caption="Márkázott PDF export"
            // src="/images/screenshots/branded-pdf.png" // Add when available
          />
        </div>
      </section>

      {/* HOW IT WORKS - Enhanced */}
      <section className="mx-auto w-full max-w-6xl px-6">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.36em] text-primary">
            {t('landing.howItWorks.label')}
          </span>
          <h2 className="mt-4 text-3xl font-semibold text-fg md:text-4xl">
            {t('landing.howItWorks.titleAlt')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-fg-muted">
            {t('landing.howItWorks.descriptionAlt')}
          </p>
        </div>

        <div className="mt-12">
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="relative h-full p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-pop">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {step.icon}
                  </div>
                  <div className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-mono text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-fg">{step.title}</h3>
                  <p className="text-base leading-relaxed text-fg-muted">{step.description}</p>
                </Card>
                {index < steps.length - 1 && (
                  <div className="hidden items-center justify-center md:flex">
                    <svg
                      className="absolute right-0 top-1/2 h-6 w-6 -translate-y-1/2 translate-x-1/2 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF - Enhanced with testimonials */}
      <section className="mx-auto w-full max-w-6xl px-6">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.36em] text-primary">
            {t('landing.testimonials.badge')}
          </span>
          <h2 className="mt-4 text-3xl font-semibold text-fg md:text-4xl">
            {t('landing.testimonials.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-fg-muted">
            {t('landing.testimonials.description')}
          </p>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
          <StatCard value="500+" label={t('landing.stats.activeUsers')} />
          <StatCard value="10K+" label={t('landing.stats.createdOffers')} />
          <StatCard value="98%" label={t('landing.stats.satisfaction')} />
          <StatCard value="24/7" label={t('landing.stats.support')} />
        </div>

        {/* Customer Logos */}
        <div className="mt-12">
          <CustomerLogos logos={customerLogos} />
        </div>

        {/* Testimonials */}
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              quote={testimonial.quote}
              author={testimonial.author}
              role={testimonial.role}
              company={testimonial.company}
              rating={testimonial.rating}
            />
          ))}
        </div>

        {/* Recently Joined Widget */}
        <div className="mt-12 max-w-md mx-auto">
          <RecentlyJoinedWidget />
        </div>

        {/* Social Proof Widget */}
        <div className="mt-12 max-w-2xl mx-auto">
          <SocialProofWidget />
        </div>
      </section>

      {/* USE CASES SECTION */}
      <UseCasesSection />

      {/* RESOURCES SECTION */}
      <ResourcesSection />

      {/* COMPARISON TABLE SECTION */}
      <section className="mx-auto w-full max-w-6xl px-6">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.36em] text-primary">
            Összehasonlítás
          </span>
          <h2 className="mt-4 text-3xl font-semibold text-fg md:text-4xl">
            {t('landing.comparisonTable.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-fg-muted">
            {t('landing.comparisonTable.description')}
          </p>
        </div>
        <div className="mt-12">
          <ComparisonTable />
        </div>
      </section>

      {/* SUCCESS STORIES LINK SECTION - Replaced case studies */}
      <section className="mx-auto w-full max-w-6xl px-6">
        <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 p-8 md:p-12 text-center">
          <h2 className="text-3xl font-semibold text-fg md:text-4xl">
            {t('landing.successStories.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-fg-muted">
            {t('landing.successStories.description')}
          </p>
          <Link
            href="/success-stories"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-ink shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
          >
            {t('landing.successStories.cta')}
            <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* ROI CALCULATOR SECTION */}
      <section className="mx-auto w-full max-w-4xl px-6">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.36em] text-primary">
            {t('landing.roiCalculator.badge')}
          </span>
          <h2 className="mt-4 text-3xl font-semibold text-fg md:text-4xl">
            {t('landing.roiCalculator.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-fg-muted">
            {t('landing.roiCalculator.description')}
          </p>
        </div>
        <div className="mt-12">
          <ROICalculator />
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="mx-auto w-full max-w-4xl px-6">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.36em] text-primary">
            {t('landing.faq.badge')}
          </span>
          <h2 className="mt-4 text-3xl font-semibold text-fg md:text-4xl">
            {t('landing.faq.title')}
          </h2>
        </div>
        <div className="mt-12">
          <FAQ items={faqItems} />
        </div>
      </section>

      {/* CHATBOT SECTION - Removed in favor of floating widget */}

      {/* FINAL CTA SECTION */}
      <section className="mx-auto w-full max-w-6xl px-6">
        <Card className="overflow-hidden border-2 border-primary/40 bg-gradient-to-r from-primary/12 via-transparent to-accent/12 p-8 shadow-pop md:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.36em] text-primary">
              {t('landing.finalCta.badge')}
            </span>
            <h2 className="mt-4 text-3xl font-semibold text-fg md:text-4xl">
              {t('landing.finalCta.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-fg-muted">
              {t('landing.finalCta.description')}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login?redirect=/new"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent px-8 py-4 text-base font-semibold text-primary-ink shadow-lg transition-all duration-200 ease-out hover:scale-105 hover:shadow-xl"
              >
                <span>{t('landing.cta.primaryCta')}</span>
                <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <Link
                href="/billing"
                className="inline-flex items-center justify-center rounded-full border-2 border-primary/60 px-8 py-4 text-base font-semibold text-primary transition-all duration-200 ease-out hover:border-primary hover:bg-primary/10"
              >
                {t('landing.cta.secondaryCta')}
              </Link>
            </div>
            <p className="mt-6 text-sm text-fg-muted">{t('landing.finalCta.noCreditCard')}</p>
          </div>
        </Card>
      </section>

      {/* GUARANTEE BADGE SECTION */}
      <section className="mx-auto w-full max-w-4xl px-6">
        <GuaranteeBadge />
      </section>

      {/* EMAIL CAPTURE SECTION */}
      <section className="mx-auto w-full max-w-4xl px-6">
        <EmailCapture
          title={t('landing.emailCapture.title')}
          description={t('landing.emailCapture.description')}
          leadMagnet={t('landing.emailCapture.leadMagnet')}
          placeholder={t('landing.emailCapture.placeholder')}
        />
      </section>

      {/* ENTERPRISE CTA SECTION */}
      <EnterpriseCTA />

      <footer aria-label={t('landing.footerAria')} className="sr-only" />
      <StickyCTABar />
      <LandingPageClient />
    </main>
  );
}
