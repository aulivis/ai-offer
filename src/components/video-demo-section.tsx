'use client';

import { Play, Users, Eye, Star, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import { FeatureIndicators } from './FeatureIndicators';
import { LandingCTA } from './ui/LandingCTA';

export function VideoDemoSection() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-bg to-primary/5">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center space-y-8 md:space-y-12 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-bg-muted text-fg rounded-full font-semibold text-sm mb-4">
            <Eye className="w-4 h-4" />
            NÉZD MEG MŰKÖDÉS KÖZBEN
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-navy-900 mb-4 text-balance leading-tight">
            Nézd meg, hogyan dolgozik helyetted a Vyndi
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-fg-muted max-w-3xl mx-auto text-pretty leading-relaxed">
            2 perces rövid bemutató, ami megmutatja, hogyan készül el egy teljes ajánlat mesterséges
            intelligenciával – percek alatt
          </p>
        </div>

        {/* Video Player Container */}
        <div className="max-w-5xl mx-auto mb-12">
          {/* Responsive video container */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl">
            {/* Poster image - loads fast */}
            {!isPlaying ? (
              <>
                {/* Background gradient - removed Image component to prevent 404 errors */}
                <div className="absolute inset-0 bg-gradient-to-br from-navy-800 via-navy-700 to-turquoise-800"></div>

                {/* Large, tappable play button */}
                <button
                  onClick={() => setIsPlaying(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
                  aria-label="Play video"
                >
                  <div className="w-20 h-20 rounded-full bg-teal-500 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Play className="w-10 h-10 text-white ml-1" />
                  </div>
                </button>
              </>
            ) : (
              /* Actual Video Player - Replace with your video URL */
              <div className="w-full h-full bg-black">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                  title="Vyndi bemutató videó - Hogyan készül el egy ajánlat percek alatt"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            )}
          </div>

          {/* Enhanced engagement metrics with cards and icons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {/* Views */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl p-4 text-center border border-primary/20">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-navy-900 mb-1">1,250+</div>
              <div className="text-sm text-fg-muted font-medium">Megtekintés</div>
            </div>

            {/* Active Users */}
            <div className="bg-gradient-to-br from-turquoise-50 to-turquoise-100 rounded-xl p-4 text-center border border-turquoise-200">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 bg-turquoise-500 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-navy-900 mb-1">200+</div>
              <div className="text-sm text-gray-600 font-medium">Aktív vállalkozás</div>
            </div>

            {/* Rating */}
            <div className="bg-gradient-to-br from-warning/10 to-warning/20 rounded-xl p-4 text-center border border-warning/20">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 bg-warning rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" fill="white" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-navy-900 mb-1">4.9/5</div>
              <div className="text-sm text-fg-muted font-medium">Értékelés</div>
            </div>

            {/* Satisfaction */}
            <div className="bg-gradient-to-br from-success/10 to-success/20 rounded-xl p-4 text-center border border-success/20">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center">
                  <ThumbsUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-navy-900 mb-1">98%</div>
              <div className="text-sm text-fg-muted font-medium">Elégedettség</div>
            </div>
          </div>
        </div>

        {/* What You'll See Section - Hidden on mobile */}
        {/* Enhanced with better card design and visual hierarchy */}
        <div className="max-w-4xl mx-auto mb-12 hidden md:block">
          <h3 className="text-2xl md:text-3xl font-bold text-navy-900 text-center mb-8 text-balance">
            Mit fogsz látni a videóban:
          </h3>

          <div className="grid md:grid-cols-3 gap-6 relative pt-12">
            {/* Point 1 */}
            <div className="relative bg-white rounded-3xl p-4 shadow-lg hover:shadow-2xl transition-all border border-gray-100 group h-full flex flex-col">
              {/* Number badge at top - reduced by 50% */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-turquoise-400 rounded-full opacity-20 blur-xl group-hover:opacity-30 transition-opacity"></div>
                  {/* Badge - reduced size */}
                  <div className="relative w-10 h-10 bg-gradient-to-br from-turquoise-500 to-turquoise-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-xl font-bold text-white">1</span>
                  </div>
                </div>
              </div>

              {/* Centered content */}
              <div className="text-center mb-6 mt-4 flex-1 flex flex-col">
                <h4 className="text-xl font-bold text-navy-900 mb-3 text-balance">
                  AI-ajánlat generálás
                </h4>
                <p className="text-fg-muted leading-relaxed text-pretty text-sm">
                  Tartalom, ár és struktúra automatikusan
                </p>
              </div>
            </div>

            {/* Point 2 */}
            <div className="relative bg-white rounded-3xl p-4 shadow-lg hover:shadow-2xl transition-all border border-gray-100 group h-full flex flex-col">
              {/* Number badge at top - reduced by 50% */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-primary/30 rounded-full opacity-20 blur-xl group-hover:opacity-30 transition-opacity"></div>
                  {/* Badge - reduced size */}
                  <div className="relative w-10 h-10 bg-gradient-to-br from-primary to-primary/90 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-xl font-bold text-white">2</span>
                  </div>
                </div>
              </div>

              {/* Centered content */}
              <div className="text-center mb-6 mt-4 flex-1 flex flex-col">
                <h4 className="text-xl font-bold text-navy-900 mb-3 text-balance">
                  Testreszabás pár kattintással
                </h4>
                <p className="text-fg-muted leading-relaxed text-pretty text-sm">
                  Egyszerű, vizuális szerkesztőben
                </p>
              </div>
            </div>

            {/* Point 3 */}
            <div className="relative bg-white rounded-3xl p-4 shadow-lg hover:shadow-2xl transition-all border border-gray-100 group h-full flex flex-col">
              {/* Number badge at top - reduced by 50% */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-success/30 rounded-full opacity-20 blur-xl group-hover:opacity-30 transition-opacity"></div>
                  {/* Badge - reduced size */}
                  <div className="relative w-10 h-10 bg-gradient-to-br from-success to-success/90 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-xl font-bold text-white">3</span>
                  </div>
                </div>
              </div>

              {/* Centered content */}
              <div className="text-center mb-6 mt-4 flex-1 flex flex-col">
                <h4 className="text-xl font-bold text-navy-900 mb-3 text-balance">
                  Küldés & követés
                </h4>
                <p className="text-fg-muted leading-relaxed text-pretty text-sm">
                  Státuszok és eredmények egy helyen
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-6">
          <p className="text-base md:text-lg text-fg-muted text-pretty leading-relaxed">
            Készen állsz, hogy te is automatizáld az ajánlatkészítést?
          </p>
          <LandingCTA size="md" className="w-full md:w-auto justify-center">
            Kezdd el most – ingyenes fiókkal, 5 perc alatt
          </LandingCTA>
          <div className="mt-6">
            <FeatureIndicators mobileOnly={['noCard']} />
          </div>
        </div>
      </div>
    </section>
  );
}
