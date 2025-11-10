'use client';

import { Play, Users, Eye, Star, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function VideoDemoSection() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-turquoise-100 text-turquoise-700 rounded-full font-semibold text-sm mb-4">
            NÉZD MEG MŰKÖDÉS KÖZBEN
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4 text-balance">
            Így működik a Vyndi
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto text-pretty">
            2 perces videó, amely megmutatja, hogyan készíts professzionális ajánlatot másodpercek
            alatt
          </p>
        </div>

        {/* Video Player Container */}
        <div className="max-w-5xl mx-auto mb-12">
          {/* Enhanced video container with better shadow and border */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-100 group">
            {/* Thumbnail/Video */}
            {!isPlaying ? (
              <>
                {/* Thumbnail Image */}
                <div className="relative aspect-video bg-gradient-to-br from-navy-800 via-navy-700 to-turquoise-800">
                  <Image
                    src="/placeholder.svg?height=720&width=1280"
                    alt="Vyndi Demo Video Thumbnail"
                    fill
                    className="object-cover opacity-80"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                    loading="lazy"
                  />

                  {/* Overlay for better play button visibility */}
                  <div className="absolute inset-0 bg-black/20"></div>

                  {/* Duration Badge */}
                  <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-semibold">
                    2:15
                  </div>

                  {/* Larger, more prominent play button with hover effect */}
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 min-h-[44px] min-w-[44px]"
                    aria-label="Play video"
                  >
                    <div className="w-24 h-24 bg-turquoise-500 hover:bg-turquoise-600 rounded-full flex items-center justify-center shadow-2xl transition-all">
                      <Play className="w-12 h-12 text-white ml-1" fill="white" />
                    </div>
                  </button>

                  {/* Video Title Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
                    <h3 className="text-white font-bold text-xl md:text-2xl mb-2 text-balance">
                      Ajánlatkészítés AI-val 2 percben
                    </h3>
                    <p className="text-gray-200 text-sm text-pretty">
                      Nézd meg, hogyan használják a legjobb vállalkozások a Vyndit
                    </p>
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

          {/* Enhanced engagement metrics with cards and icons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {/* Views */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-navy-900 mb-1">1,250+</div>
              <div className="text-sm text-gray-600 font-medium">Megtekintés</div>
            </div>

            {/* Active Users */}
            <div className="bg-gradient-to-br from-turquoise-50 to-turquoise-100 rounded-xl p-4 text-center border border-turquoise-200">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 bg-turquoise-500 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-navy-900 mb-1">500+</div>
              <div className="text-sm text-gray-600 font-medium">Aktív felhasználó</div>
            </div>

            {/* Rating */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 text-center border border-yellow-200">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" fill="white" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-navy-900 mb-1">4.9/5</div>
              <div className="text-sm text-gray-600 font-medium">Értékelés</div>
            </div>

            {/* Satisfaction */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border border-green-200">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <ThumbsUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-navy-900 mb-1">98%</div>
              <div className="text-sm text-gray-600 font-medium">Elégedettség</div>
            </div>
          </div>
        </div>

        {/* What You'll See Section */}
        {/* Enhanced with better card design and visual hierarchy */}
        <div className="max-w-4xl mx-auto mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-navy-900 text-center mb-8 text-balance">
            Mit fogsz látni a videóban:
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Point 1 */}
            <div className="bg-gradient-to-br from-turquoise-50 to-white rounded-xl p-6 border-2 border-turquoise-200 hover:border-turquoise-400 transition-colors">
              <div className="w-12 h-12 bg-turquoise-500 rounded-full flex items-center justify-center mb-4 font-bold text-white text-xl">
                1
              </div>
              <h4 className="font-bold text-navy-900 text-lg mb-2 text-balance">
                AI ajánlat generálás
              </h4>
              <p className="text-gray-600 text-sm text-pretty">Automatikus tartalom és árazás</p>
            </div>

            {/* Point 2 */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border-2 border-blue-200 hover:border-blue-400 transition-colors">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-4 font-bold text-white text-xl">
                2
              </div>
              <h4 className="font-bold text-navy-900 text-lg mb-2 text-balance">
                Testreszabás egyszerűen
              </h4>
              <p className="text-gray-600 text-sm text-pretty">Drag & drop szerkesztő</p>
            </div>

            {/* Point 3 */}
            <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-6 border-2 border-green-200 hover:border-green-400 transition-colors">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4 font-bold text-white text-xl">
                3
              </div>
              <h4 className="font-bold text-navy-900 text-lg mb-2 text-balance">
                Küldés és követés
              </h4>
              <p className="text-gray-600 text-sm text-pretty">Real-time értesítések</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <p className="text-gray-600 mb-4 text-lg text-pretty">Készen állsz kipróbálni?</p>
          <Link
            href="/login?redirect=/new"
            className="inline-block bg-turquoise-600 hover:bg-turquoise-700 text-white font-bold px-10 py-4 rounded-lg text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 min-h-[44px]"
          >
            Kezdd el ingyen →
          </Link>
        </div>
      </div>
    </section>
  );
}
