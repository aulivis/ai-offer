import Link from 'next/link';
import { HowItWorks } from '@/components/how-it-works';
import { VideoDemoSection } from '@/components/video-demo-section';
import { ProblemSection } from '@/components/problem-section';
import { SolutionSection } from '@/components/solution-section';
import { ComparisonTable } from '@/components/comparison-table';
import { ROICalculatorLanding } from '@/components/roi-calculator-landing';
import { TestimonialSection } from '@/components/testimonial-section';
import { IndustrySolutions } from '@/components/industry-solutions';
import { FAQSection } from '@/components/faq-section';
import { StickyCTABar } from '@/components/sticky-cta-bar';
import { LandingPageClient } from '@/components/landing/LandingPageClient';
import { TrustIndicators } from '@/components/trust-indicators';
import { Sparkles, Check, Rocket, Award } from 'lucide-react';

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
              {/* Badge */}
              <div className="flex justify-center lg:justify-start mb-6">
                <span className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-semibold text-white">
                  <Sparkles className="w-3 h-3 mr-2" />
                  AI-alapú ajánlatkészítés
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-balance">
                Professzionális ajánlatkészítés{' '}
                <span className="text-turquoise-400">percek alatt</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed text-pretty">
                Automatizáld az ajánlatkészítést, spórolj akár{' '}
                <strong className="text-white">70 %-nyi időt</strong>, és növeld a{' '}
                <strong className="text-white">üzleti eredményeidet</strong> a Vyndi AI-val.
              </p>

              {/* Primary CTA */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Link
                  href="/login?redirect=/new"
                  className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold px-8 py-4 rounded-lg text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 min-h-[44px] flex items-center justify-center"
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
              <TrustIndicators />
            </div>

            {/* Right: Dashboard Image with Floating Cards */}
            <div className="relative hidden lg:block">
              {/* Main Dashboard Image with Glow Effect */}
              <div className="relative z-10">
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 via-transparent to-blue-500/20 blur-3xl" />
                <div className="relative bg-white rounded-xl shadow-2xl p-8 aspect-video flex items-center justify-center">
                  <div className="text-gray-400 text-center">
                    <p className="text-lg font-semibold">Dashboard Preview</p>
                    <p className="text-sm mt-2">Placeholder image</p>
                  </div>
                </div>
              </div>

              {/* Floating Card 1 - Top Left - Speed Indicator */}
              <div className="absolute -top-4 -left-4 z-20 animate-float hidden lg:block">
                <div className="bg-white rounded-lg shadow-xl p-4 border border-gray-100 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Ajánlat generálva</p>
                      <p className="text-xs text-gray-500">5 perc alatt</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Card 2 - Top Right - Free Start */}
              <div className="absolute -top-6 -right-6 z-20 animate-float-delayed hidden lg:block">
                <div className="bg-white rounded-lg shadow-xl p-4 border border-gray-100 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Rocket className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Ingyenes kezdés</p>
                      <p className="text-xs text-gray-500">Bankkártya nélkül</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Card 3 - Bottom Left - Professional Appearance */}
              <div className="absolute -bottom-6 left-8 z-20 animate-float-slow hidden lg:block">
                <div className="bg-white rounded-lg shadow-xl p-4 border border-gray-100 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Award className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Professzionális megjelenés
                      </p>
                      <p className="text-xs text-gray-500">Egységes dizájn</p>
                    </div>
                  </div>
                </div>
              </div>
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
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight text-balance">
                Készen állsz, hogy időt <br className="hidden sm:block" />
                és pénzt spórolj?
              </h2>
              <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-3xl mx-auto text-pretty">
                Csatlakozz 500+ vállalkozáshoz, akik már professzionális ajánlatokat készítenek
                percek alatt a Vyndivel
              </p>
            </div>

            {/* Prominent form with clear CTA button */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 mb-8">
              {/* Value proposition above form */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 text-green-700 font-bold text-sm rounded-full mb-4 border-2 border-green-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Indítsd el 14 napos ingyenes próbádat</span>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4 mb-6">
                {/* Two input fields side by side on desktop */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Name input */}
                  <div>
                    <label
                      htmlFor="cta-name"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Név
                    </label>
                    <input
                      id="cta-name"
                      type="text"
                      placeholder="Kovács János"
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-turquoise-500 focus:bg-white focus:outline-none text-gray-900 placeholder-gray-400 transition-all text-lg min-h-[44px]"
                    />
                  </div>

                  {/* Email input */}
                  <div>
                    <label
                      htmlFor="cta-email"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Email cím
                    </label>
                    <input
                      id="cta-email"
                      type="email"
                      placeholder="janos@vallalkozas.hu"
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-turquoise-500 focus:bg-white focus:outline-none text-gray-900 placeholder-gray-400 transition-all text-lg min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Prominent CTA button that stands out */}
                <Link
                  href="/login?redirect=/new"
                  className="w-full py-5 px-8 bg-[#FF6B35] hover:bg-[#E55A2B] text-white text-xl font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 group min-h-[44px]"
                >
                  <span>Kezdés ingyen</span>
                  <svg
                    className="w-6 h-6 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
              </div>

              {/* Trust signals below form */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-semibold">14 napos próba ingyen</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-semibold">Nincs bankkártya szükséges</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-semibold">Indítás 5 perc alatt</span>
                </div>
              </div>
            </div>

            {/* Social proof stats - redesigned for better visibility */}
            <div className="grid grid-cols-3 gap-6 md:gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-3">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">500+</div>
                <div className="text-white/90 font-medium">Aktív vállalkozás</div>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-3">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                    />
                  </svg>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">98%</div>
                <div className="text-white/90 font-medium">Elégedettség</div>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-3">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">10K+</div>
                <div className="text-white/90 font-medium">Ajánlat készült</div>
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
