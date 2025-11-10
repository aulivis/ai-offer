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
        {/* Enhanced decorative gradient blobs for visual depth */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-turquoise-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div
          className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500 rounded-full blur-3xl opacity-10"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Value Proposition */}
            <div className="text-center lg:text-left">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-balance">
                Ajánlatkészítés <span className="text-turquoise-400">AI-val</span> másodpercek alatt
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed text-pretty">
                Spórolj <strong className="text-white">70%-ot</strong> az időből, növeld a
                professzionalizmust és nyerj több projektet az AI-alapú Vyndi ajánlatkészítővel.
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
              <div className="mt-8 flex flex-wrap gap-8 justify-center lg:justify-start text-sm">
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
      <section className="py-24 bg-gradient-to-br from-turquoise-500 via-turquoise-400 to-blue-500 text-white relative overflow-hidden">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Content Wrapper */}
          <div className="max-w-4xl mx-auto text-center">
            {/* Heading */}
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg text-balance">
              Készen állsz a váltásra?
            </h2>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed text-pretty">
              Csatlakozz 500+ vállalkozáshoz, akik már spórolnak időt és pénzt a Vyndivel
            </p>

            {/* CTA Form */}
            {/* Enhanced form with better styling and larger inputs */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <input
                  type="email"
                  placeholder="Add meg az email címedet"
                  className="flex-1 px-8 py-5 text-lg rounded-xl border-2 border-white/30 bg-white/95 backdrop-blur focus:outline-none focus:ring-4 focus:ring-white/50 shadow-2xl min-h-[44px]"
                />
                <Link
                  href="/login?redirect=/new"
                  className="bg-white hover:bg-gray-50 text-turquoise-600 font-bold px-10 py-5 rounded-xl text-lg shadow-2xl hover:shadow-2xl transition-all transform hover:scale-105 inline-flex items-center justify-center gap-3 whitespace-nowrap min-h-[44px]"
                >
                  Beszélj egy szakértővel
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </Link>
              </div>

              {/* Trust Indicators */}
              {/* Added prominent trust indicators */}
              <div className="flex flex-wrap justify-center gap-6 text-white/90">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">14 napos ingyenes próba</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Nincs bankkártya</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">5 perc alatt indulás</span>
                </div>
              </div>
            </div>

            {/* Social Proof Numbers */}
            {/* Added quick stats for final push */}
            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-8 border-t border-white/20">
              <div>
                <div className="text-4xl font-bold text-white mb-2">500+</div>
                <div className="text-white/80">Aktív vállalkozás</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">98%</div>
                <div className="text-white/80">Elégedettség</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">10K+</div>
                <div className="text-white/80">Ajánlat készült</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global UI elements */}
      <StickyCTABar />
      <LandingPageClient />
    </main>
  );
}
