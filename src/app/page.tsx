import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import { HowItWorks } from '@/components/how-it-works';
import { VideoDemoSection } from '@/components/video-demo-section';
import { ProblemSection } from '@/components/problem-section';
import { SolutionSection } from '@/components/solution-section';
import { NewsletterSubscription } from '@/components/landing/NewsletterSubscription';
import { AnimatedStat } from '@/components/landing/AnimatedStat';
import { PageErrorBoundary } from '@/components/PageErrorBoundary';
import { H1, H2 } from '@/components/ui/Heading';
import {
  Sparkles,
  Check,
  Rocket,
  Award,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  Users,
  ThumbsUp,
  FileText,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Vyndi – AI-alapú ajánlatkészítő platform | Professzionális ajánlat percek alatt',
  description:
    'Automatizáld az ajánlatkészítést mesterséges intelligenciával. Készítsd el az első professzionális ajánlatod 5 perc alatt – ingyen, bankkártya nélkül.',
  openGraph: {
    title: 'Vyndi – AI-alapú ajánlatkészítő platform',
    description:
      'Automatizáld az ajánlatkészítést mesterséges intelligenciával. Készítsd el az első professzionális ajánlatod 5 perc alatt – ingyen, bankkártya nélkül.',
    type: 'website',
    locale: 'hu_HU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vyndi – AI-alapú ajánlatkészítő platform',
    description:
      'Automatizáld az ajánlatkészítést mesterséges intelligenciával. Készítsd el az első professzionális ajánlatod 5 perc alatt.',
  },
};

// Dynamically import below-the-fold components to reduce initial bundle size
// These components are not immediately visible and can be loaded on-demand
const ComparisonTable = dynamic(
  () => import('@/components/comparison-table').then((mod) => ({ default: mod.ComparisonTable })),
  {
    loading: () => <div className="h-64 animate-pulse bg-bg-muted rounded-lg" />,
  },
);
const ROICalculatorLanding = dynamic(
  () =>
    import('@/components/roi-calculator-landing').then((mod) => ({
      default: mod.ROICalculatorLanding,
    })),
  {
    loading: () => <div className="h-96 animate-pulse bg-bg-muted rounded-lg" />,
  },
);
const TestimonialSection = dynamic(
  () =>
    import('@/components/testimonial-section').then((mod) => ({ default: mod.TestimonialSection })),
  {
    loading: () => <div className="h-64 animate-pulse bg-bg-muted rounded-lg" />,
  },
);
const IndustrySolutions = dynamic(
  () =>
    import('@/components/industry-solutions').then((mod) => ({ default: mod.IndustrySolutions })),
  {
    loading: () => <div className="h-64 animate-pulse bg-bg-muted rounded-lg" />,
  },
);
const FAQSection = dynamic(
  () => import('@/components/faq-section').then((mod) => ({ default: mod.FAQSection })),
  {
    loading: () => <div className="h-64 animate-pulse bg-bg-muted rounded-lg" />,
  },
);
const StickyCTABar = dynamic(
  () => import('@/components/sticky-cta-bar').then((mod) => ({ default: mod.StickyCTABar })),
  {
    loading: () => null, // Sticky bar doesn't need SSR
  },
);
const LandingPageClient = dynamic(
  () =>
    import('@/components/landing/LandingPageClient').then((mod) => ({
      default: mod.LandingPageClient,
    })),
  {
    loading: () => null, // Client-only component
  },
);

export default function Home() {
  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Vyndi',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'HUF',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '200',
    },
    description:
      'Automatizáld az ajánlatkészítést mesterséges intelligenciával. Készítsd el az első professzionális ajánlatod 5 perc alatt – ingyen, bankkártya nélkül.',
  };

  return (
    <PageErrorBoundary>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main id="main" className="min-h-screen">
        {/* HERO SECTION - First Impression */}
        <section className="relative bg-gradient-to-br from-navy-900 via-navy-800 to-turquoise-900 text-white min-h-screen flex flex-col overflow-hidden -mt-14 md:-mt-20">
          {/* Enhanced decorative gradient blobs for visual depth */}
          <div
            className="absolute top-0 right-0 w-96 h-96 bg-turquoise-500 rounded-full blur-3xl opacity-20 motion-safe:animate-pulse"
            aria-hidden="true"
          ></div>
          <div
            className="absolute bottom-0 left-0 w-96 h-96 bg-accent rounded-full blur-3xl opacity-20 motion-safe:animate-pulse"
            style={{ animationDelay: '1s' }}
            aria-hidden="true"
          ></div>
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary rounded-full blur-3xl opacity-10"
            aria-hidden="true"
          ></div>

          <div className="container mx-auto px-4 md:px-6 relative z-10 flex-1 flex flex-col justify-center max-w-7xl pt-14 md:pt-20">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Left: Value Proposition */}
              <div className="text-center lg:text-left">
                {/* Badge */}
                <div className="flex justify-center lg:justify-start mb-6">
                  <span className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-body-small font-semibold text-white">
                    <Sparkles className="w-3 h-3 mr-2" />
                    <span className="md:hidden">AI-alapú ajánlatkészítés</span>
                    <span className="hidden md:inline">
                      AI-alapú megoldás a modern vállalkozásoknak
                    </span>
                  </span>
                </div>
                <H1 className="mb-6 text-balance" fluid>
                  Professzionális ajánlatkészítés{' '}
                  <span className="text-turquoise-400">percek alatt</span>
                </H1>
                <p className="text-body-large md:text-h6 text-white mb-8 leading-typography-relaxed text-pretty max-w-xl mx-auto lg:mx-0">
                  <span className="md:hidden">
                    Automatizált megoldás, ami 70%-kal csökkenti az ajánlatkészítés idejét
                  </span>
                  <span className="hidden md:inline">
                    Automatizáld az ajánlatkészítést, spórolj akár{' '}
                    <span className="text-white font-semibold">70%-nyi időt</span>, és növeld az{' '}
                    <span className="text-white font-semibold">üzleti eredményeidet</span> a
                    Vyndivel.
                  </span>
                </p>

                {/* Checkmarks with better spacing */}
                <div className="space-y-4 mt-6 mb-8">
                  {/* Mobile: single combined feature */}
                  <div className="flex items-center gap-3 justify-center lg:justify-start md:hidden">
                    <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
                    <span className="text-body-small md:text-body">
                      Kezdd el ingyen, azonnal, bankkártya nélkül
                    </span>
                  </div>
                  {/* Desktop: three separate features */}
                  <div className="hidden md:flex items-center gap-3 justify-center lg:justify-start">
                    <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
                    <span className="text-body-small md:text-body">Kezdd el teljesen ingyen</span>
                  </div>
                  <div className="hidden md:flex items-center gap-3 justify-center lg:justify-start">
                    <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
                    <span className="text-body-small md:text-body">Nem kérünk bankkártyát</span>
                  </div>
                  <div className="hidden md:flex items-center gap-3 justify-center lg:justify-start">
                    <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
                    <span className="text-body-small md:text-body">Kész ajánlat 5 perc alatt</span>
                  </div>
                </div>

                {/* Primary CTA */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                  <Link
                    href="/login?redirect=/new"
                    className="group bg-primary hover:bg-primary/90 text-primary-ink font-semibold rounded-2xl px-8 py-4 min-h-[56px] w-full md:w-auto flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 relative overflow-hidden"
                  >
                    <span className="relative z-10 text-body md:text-body-large text-primary-ink">
                      Próbáld ki most ingyen
                    </span>
                    <ArrowRight className="w-5 h-5 flex-shrink-0 relative z-10 text-primary-ink transition-transform duration-300 group-hover:translate-x-1" />
                    <span className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  </Link>
                  <a
                    href="#product-demo"
                    className="border-2 border-white/50 text-white font-medium rounded-2xl px-8 py-4 min-h-[56px] w-full md:w-auto hover:border-white/80 hover:bg-white/10 bg-transparent transition-all flex items-center justify-center backdrop-blur-sm"
                  >
                    További információ
                  </a>
                </div>
              </div>

              {/* Right: Dashboard Image with Floating Cards */}
              <div className="relative hidden lg:block">
                {/* Main Dashboard Image with Glow Effect */}
                <div className="relative z-10">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-accent/20 blur-3xl" />
                  <div
                    className="relative bg-bg-muted rounded-2xl shadow-pop p-8 aspect-video flex items-center justify-center"
                    role="img"
                    aria-label="Vyndi dashboard előnézet"
                  >
                    <div className="text-fg-muted text-center">
                      <p className="text-body-large font-semibold">Dashboard Preview</p>
                      <p className="text-body-small mt-2">Placeholder image</p>
                    </div>
                  </div>
                </div>

                {/* Floating Card 1 - Top Left - Speed Indicator */}
                <div
                  className="absolute -top-4 -left-4 z-20 motion-safe:animate-float hidden lg:block"
                  role="img"
                  aria-label="Ajánlat generálva 5 perc alatt"
                >
                  <div className="bg-bg-muted rounded-lg shadow-pop p-4 border border-border backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-success/10 p-2 rounded-lg" aria-hidden="true">
                        <Check className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="text-body-small font-semibold text-fg">Ajánlat generálva</p>
                        <p className="text-body-small text-fg-muted">5 perc alatt</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Card 2 - Top Right - Free Start */}
                <div
                  className="absolute -top-6 -right-6 z-20 motion-safe:animate-float-delayed hidden lg:block"
                  role="img"
                  aria-label="Ingyenes kezdés bankkártya nélkül"
                >
                  <div className="bg-bg-muted rounded-lg shadow-pop p-4 border border-border backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg" aria-hidden="true">
                        <Rocket className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-body-small font-semibold text-fg">Ingyenes kezdés</p>
                        <p className="text-body-small text-fg-muted">Bankkártya nélkül</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Card 3 - Bottom Left - Professional Appearance */}
                <div
                  className="absolute -bottom-6 left-8 z-20 motion-safe:animate-float-slow hidden lg:block"
                  role="img"
                  aria-label="Professzionális megjelenés egységes dizájnnál"
                >
                  <div className="bg-bg-muted rounded-lg shadow-pop p-4 border border-border backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-accent/10 p-2 rounded-lg" aria-hidden="true">
                        <Award className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-body-small font-semibold text-fg">
                          Professzionális megjelenés
                        </p>
                        <p className="text-body-small text-fg-muted">Egységes dizájn</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Animated downward arrow - Mobile only, positioned above the fold */}
          <div className="md:hidden absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
            <a
              href="#product-demo"
              className="flex flex-col items-center gap-2 text-white/80 hover:text-white transition-colors"
              aria-label="Scroll to next section"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                <ChevronDown className="w-6 h-6" />
              </div>
            </a>
          </div>
        </section>

        {/* HOW IT WORKS - Quick Process Overview */}
        <HowItWorks />

        {/* VIDEO DEMO - Show Don't Tell */}
        <section id="product-demo" className="scroll-mt-20">
          <VideoDemoSection />
        </section>

        {/* PROBLEM - Establish Pain Points */}
        <ProblemSection />

        {/* SOLUTION - Your Answer with Before/After */}
        <SolutionSection />

        {/* COMPARISON TABLE - Why Choose Us */}
        <ComparisonTable />

        {/* ROI CALCULATOR - Personalized Value */}
        <ROICalculatorLanding />

        {/* TESTIMONIALS - Social Proof */}
        <TestimonialSection />

        {/* INDUSTRY SOLUTIONS - Specific Use Cases */}
        <IndustrySolutions />

        {/* FAQ - Address Objections */}
        <FAQSection />

        {/* FINAL CTA - Last Conversion Opportunity */}
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
                <H2 className="text-white mb-6 text-balance" fluid>
                  Szeretnéd elsőként kipróbálni az újdonságokat?
                </H2>
                <p className="text-body-large md:text-h6 text-white leading-typography-relaxed max-w-3xl mx-auto text-pretty">
                  Iratkozz fel, és értesülj az újdonságokról, tippekről és az új funkciók
                  indulásáról.
                  <br />
                  Csatlakozz több mint 200 vállalkozáshoz, akik már hatékonyabban dolgoznak az
                  ajánlatkészítésben.
                </p>
              </div>

              {/* Newsletter subscription form */}
              <NewsletterSubscription source="landing_page" />

              {/* Social proof stats - redesigned for better visibility with scroll animations */}
              <div className="grid grid-cols-3 gap-6 md:gap-8" role="list">
                <AnimatedStat
                  value="200+"
                  label="Aktív vállalkozás"
                  ariaLabel="Több mint 200 aktív vállalkozás"
                  icon={<Users className="w-8 h-8 text-white" />}
                  duration={2000}
                />
                <AnimatedStat
                  value="98%"
                  label="Elégedettség"
                  ariaLabel="98 százalék elégedettség"
                  icon={<ThumbsUp className="w-8 h-8 text-white" />}
                  duration={2000}
                />
                <AnimatedStat
                  value="10K+"
                  label="Ajánlat készült"
                  ariaLabel="Több mint 10 ezer ajánlat készült"
                  icon={<FileText className="w-8 h-8 text-white" />}
                  duration={2000}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Global UI elements */}
        <StickyCTABar />
        <LandingPageClient />
      </main>
    </PageErrorBoundary>
  );
}
