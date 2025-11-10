import Link from 'next/link';
import { AnimatedDemo } from '@/components/animated-demo';
import { HowItWorks } from '@/components/how-it-works';
import { VideoDemoSection } from '@/components/video-demo-section';
import { ProblemSection } from '@/components/problem-section';
import { SolutionSection } from '@/components/solution-section';
import { ComparisonTable } from '@/components/comparison-table';
import { ROICalculator } from '@/components/roi-calculator';
import { TestimonialSection } from '@/components/testimonial-section';
import { IndustrySolutions } from '@/components/industry-solutions';
import { FAQSection } from '@/components/faq-section';
import { StickyCTABar } from '@/components/sticky-cta-bar';
import { LandingPageClient } from '@/components/landing/LandingPageClient';

export default function Home() {
  return (
    <main id="main" className="min-h-screen">
      {/* HERO SECTION - First Impression */}
      <section className="relative bg-gradient-to-br from-navy-900 via-navy-800 to-turquoise-900 text-white py-20 lg:py-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Value Proposition */}
            <div className="text-center lg:text-left">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-balance">
                Ajánlatkészítés <span className="text-turquoise-400">AI-val</span> másodpercek alatt
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed text-pretty">
                Spórolj 70%-ot az időből, növeld a professzionalizmust és nyerj több projektet az
                AI-alapú Vyndi ajánlatkészítővel.
              </p>

              {/* Primary CTA */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/login?redirect=/new"
                  className="bg-turquoise-500 hover:bg-turquoise-600 text-white font-bold px-8 py-4 rounded-lg text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 min-h-[44px] flex items-center justify-center"
                >
                  Kezdd el ingyen →
                </Link>
                <a
                  href="#product-demo"
                  className="border-2 border-white/30 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-lg text-lg backdrop-blur-sm transition-all min-h-[44px] flex items-center justify-center"
                >
                  Nézd meg működésben
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 flex flex-wrap gap-6 justify-center lg:justify-start text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Ingyenes próba</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Nincs bankkártya</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>5 perc alatt indulás</span>
                </div>
              </div>
            </div>

            {/* Right: Animated Demo */}
            <div className="relative">
              <AnimatedDemo />
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-turquoise-500 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20" />
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
      <ROICalculator />

      {/* TESTIMONIALS - Social Proof */}
      <TestimonialSection />

      {/* INDUSTRY SOLUTIONS - Specific Use Cases */}
      <IndustrySolutions />

      {/* FAQ - Address Objections */}
      <FAQSection />

      {/* FINAL CTA - Last Conversion Opportunity */}
      <section className="py-20 bg-gradient-to-br from-turquoise-600 via-turquoise-500 to-blue-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
            Készen állsz a váltásra?
          </h2>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90 text-pretty">
            Csatlakozz 500+ vállalkozáshoz, akik már spórolnak időt és pénzt a Vyndivel
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login?redirect=/new"
              className="bg-white text-turquoise-600 hover:bg-gray-100 font-bold px-8 py-4 rounded-lg text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 min-h-[44px] flex items-center justify-center"
            >
              Kezdd el ingyen →
            </Link>
            <Link
              href="/billing"
              className="border-2 border-white hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-lg text-lg backdrop-blur-sm transition-all min-h-[44px] flex items-center justify-center"
            >
              Beszélj egy szakértővel
            </Link>
          </div>
          <p className="mt-6 text-sm opacity-75 text-pretty">
            14 napos ingyenes próba • Nincs bankkártya • 5 perc alatt indulás
          </p>
        </div>
      </section>

      {/* Global UI elements */}
      <StickyCTABar />
      <LandingPageClient />
    </main>
  );
}
