'use client';

import { Play, Users, Eye, Star } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function VideoDemoSection() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-turquoise-600 font-semibold text-sm uppercase tracking-wide mb-3">
            NÉZD MEG MŰKÖDÉS KÖZBEN
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4 text-balance">
            Így működik a Vyndi
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto text-pretty">
            2 perces videó, amely megmutatja, hogyan készíts professzionális ajánlatot másodpercek
            alatt
          </p>
        </div>

        {/* Video Container */}
        <div className="max-w-5xl mx-auto">
          {/* Video Player */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-turquoise-200 group">
            {/* Thumbnail/Video */}
            {!isPlaying ? (
              <>
                {/* Thumbnail Image */}
                <div className="relative aspect-video bg-gradient-to-br from-navy-900 via-navy-800 to-turquoise-900">
                  <Image
                    src="/placeholder.svg?height=720&width=1280"
                    alt="Vyndi Demo Video Thumbnail"
                    fill
                    className="object-cover opacity-80"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                    loading="lazy"
                  />

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900/60 to-transparent" />

                  {/* Play Button */}
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-turquoise-500 hover:bg-turquoise-600 rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 group-hover:scale-105 min-h-[44px] min-w-[44px]"
                    aria-label="Play video"
                  >
                    <Play className="w-10 h-10 text-white ml-1" fill="white" />
                  </button>

                  {/* Video Title Overlay */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-white text-2xl font-bold mb-2 text-balance">
                      Ajánlatkészítés AI-val 2 percben
                    </h3>
                    <p className="text-gray-200 text-sm text-pretty">
                      Nézd meg, hogyan használják a legjobb vállalkozások a Vyndit
                    </p>
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold">
                    2:15
                  </div>
                </div>
              </>
            ) : (
              /* Actual Video Player - Replace with your video URL */
              <div className="aspect-video bg-black">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                  title="Vyndi Demo Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>

          {/* Engagement Metrics */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border-2 border-gray-200 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-turquoise-600" />
                <span className="text-2xl font-bold text-navy-900">1,250+</span>
              </div>
              <p className="text-sm text-gray-600">Megtekintés</p>
            </div>

            <div className="bg-white rounded-xl p-4 border-2 border-gray-200 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-5 h-5 text-turquoise-600" />
                <span className="text-2xl font-bold text-navy-900">500+</span>
              </div>
              <p className="text-sm text-gray-600">Aktív felhasználó</p>
            </div>

            <div className="bg-white rounded-xl p-4 border-2 border-gray-200 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="text-2xl font-bold text-navy-900">4.9/5</span>
              </div>
              <p className="text-sm text-gray-600">Értékelés</p>
            </div>

            <div className="bg-white rounded-xl p-4 border-2 border-gray-200 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl font-bold text-turquoise-600">98%</span>
              </div>
              <p className="text-sm text-gray-600">Elégedettség</p>
            </div>
          </div>

          {/* Key Features Highlighted */}
          <div className="mt-8 bg-gradient-to-r from-turquoise-50 to-blue-50 rounded-2xl p-8 border-2 border-turquoise-200">
            <h3 className="text-xl font-bold text-navy-900 mb-4 text-center text-balance">
              Mit fogsz látni a videóban:
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-turquoise-600 text-white flex items-center justify-center flex-shrink-0 font-bold min-h-[32px] min-w-[32px]">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-navy-900 mb-1 text-balance">
                    AI ajánlat generálás
                  </h4>
                  <p className="text-sm text-gray-600 text-pretty">
                    Automatikus tartalom és árazás
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-turquoise-600 text-white flex items-center justify-center flex-shrink-0 font-bold min-h-[32px] min-w-[32px]">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-navy-900 mb-1 text-balance">
                    Testreszabás egyszerűen
                  </h4>
                  <p className="text-sm text-gray-600 text-pretty">Drag & drop szerkesztő</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-turquoise-600 text-white flex items-center justify-center flex-shrink-0 font-bold min-h-[32px] min-w-[32px]">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-navy-900 mb-1 text-balance">
                    Küldés és követés
                  </h4>
                  <p className="text-sm text-gray-600 text-pretty">Real-time értesítések</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4 text-lg text-pretty">Készen állsz kipróbálni?</p>
          <Link
            href="/login?redirect=/new"
            className="inline-flex items-center justify-center bg-turquoise-600 hover:bg-turquoise-700 text-white font-semibold px-8 py-4 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 min-h-[44px]"
          >
            Kezdd el ingyen
          </Link>
        </div>
      </div>
    </section>
  );
}
