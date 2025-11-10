'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Star,
  ChevronLeft,
  ChevronRight,
  Quote,
  Users,
  FileCheck,
  ThumbsUp,
  Headphones,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getAuthorImage } from '@/lib/testimonial-images';

export function TestimonialSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const testimonials = [
    {
      name: 'Kiss Júlia',
      role: 'Marketing Vezető',
      company: 'Creative Agency',
      image: getAuthorImage('Kiss Júlia'),
      quote:
        'A Vyndi segítségével 70% időt spórolunk meg az ajánlatkészítésen. Most több időnk marad az ügyfelekkel való kapcsolattartásra.',
      rating: 5,
      metrics: [
        { label: '70% időmegtakarítás', icon: TrendingUp },
        { label: '+15 ajánlat/hét', icon: FileCheck },
      ],
      verified: true,
    },
    {
      name: 'Nagy Péter',
      role: 'Értékesítési Igazgató',
      company: 'Tech Solutions Kft',
      image: getAuthorImage('Nagy Péter'),
      quote:
        'Hihetetlen, hogy milyen gyorsan és professzionálisan tudunk most ajánlatot készíteni. Az ügyfeleink is észreveszik a különbséget.',
      rating: 5,
      metrics: [
        { label: '3x gyorsabb', icon: TrendingUp },
        { label: '98% pontosság', icon: CheckCircle },
      ],
      verified: true,
    },
    {
      name: 'Szabó Anna',
      role: 'Ügyvezető',
      company: 'Growth Partners',
      image: getAuthorImage('Szabó Anna'),
      quote:
        'A Vyndi nélkül már el sem tudom képzelni a munkánkat. Az AI funkciók egyszerűen zseniálisak, és a csapatom imádja használni.',
      rating: 5,
      metrics: [
        { label: '50+ ajánlat/hó', icon: FileCheck },
        { label: '85% elfogadási arány', icon: ThumbsUp },
      ],
      verified: true,
    },
  ];

  // Auto-rotate every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [testimonials.length]);

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % testimonials.length);
  };

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + testimonials.length) % testimonials.length);
  };

  // Touch swipe handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    }
    if (isRightSwipe) {
      goToPrevious();
    }
  };

  const currentTestimonial = testimonials[activeIndex];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-turquoise-100 text-turquoise-700 rounded-full font-semibold text-sm mb-6 border border-turquoise-300">
            ÜGYFELEINK MONDJÁK
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-navy-900 mb-6 leading-tight text-balance">
            Csatlakozz a Vyndi közösséghez
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto text-pretty">
            500+ vállalkozás bízik már a Vyndiben. Nézd meg, mit mondanak rólunk!
          </p>
        </div>

        {/* Stats Grid */}
        {/* Enhanced stats with icons, cards, and larger numbers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-20">
          {/* Stat 1: Active Users */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 text-center">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
            <div className="text-4xl md:text-5xl font-bold text-navy-900 mb-2">500+</div>
            <div className="text-gray-600 font-medium">Aktív felhasználó</div>
          </div>

          {/* Stat 2: Proposals Created */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 text-center">
            <div className="w-14 h-14 bg-turquoise-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <FileCheck className="w-7 h-7 text-turquoise-600" />
            </div>
            <div className="text-4xl md:text-5xl font-bold text-navy-900 mb-2">10K+</div>
            <div className="text-gray-600 font-medium">Létrehozott ajánlat</div>
          </div>

          {/* Stat 3: Satisfaction Rate */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <ThumbsUp className="w-7 h-7 text-green-600" />
            </div>
            <div className="text-4xl md:text-5xl font-bold text-navy-900 mb-2">98%</div>
            <div className="text-gray-600 font-medium">Elégedettségi mutató</div>
          </div>

          {/* Stat 4: Support */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 text-center">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Headphones className="w-7 h-7 text-purple-600" />
            </div>
            <div className="text-4xl md:text-5xl font-bold text-navy-900 mb-2">24/7</div>
            <div className="text-gray-600 font-medium">Ügyfélszolgálat</div>
          </div>
        </div>

        {/* Testimonial Carousel */}
        <div className="max-w-5xl mx-auto relative">
          {/* Enhanced testimonial card with better design and prominence */}
          <div
            className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-200 relative overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Decorative Quote Mark */}
            <div className="absolute top-8 right-8 opacity-10">
              <Quote className="w-32 h-32 text-turquoise-500" />
            </div>

            {/* Profile Section */}
            <div className="flex items-start gap-6 mb-8 relative z-10">
              {/* Avatar with Verification Badge */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden ring-4 ring-turquoise-100">
                  <Image
                    src={currentTestimonial.image || '/placeholder.svg'}
                    alt={currentTestimonial.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                {currentTestimonial.verified && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-turquoise-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>

              {/* Name, Title, Rating */}
              <div className="flex-1">
                <h3 className="text-2xl md:text-3xl font-bold text-navy-900 mb-2 text-balance">
                  {currentTestimonial.name}
                </h3>
                <p className="text-gray-600 text-lg mb-4 text-pretty">
                  {currentTestimonial.role} • {currentTestimonial.company}
                </p>

                {/* Larger, more prominent star rating */}
                <div className="flex items-center gap-1">
                  {[...Array(currentTestimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            </div>

            {/* Quote */}
            {/* Larger, more readable quote text */}
            <blockquote className="text-xl md:text-2xl text-gray-700 leading-relaxed mb-8 relative z-10 italic text-pretty">
              &ldquo;{currentTestimonial.quote}&rdquo;
            </blockquote>

            {/* Metric Badges */}
            {/* Larger, more prominent metric badges with icons */}
            <div className="flex flex-wrap gap-4 relative z-10">
              {currentTestimonial.metrics.map((metric, index) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={index}
                    className="inline-flex items-center gap-3 bg-turquoise-100 text-turquoise-700 px-6 py-3 rounded-full font-bold text-base border border-turquoise-300"
                  >
                    <Icon className="w-5 h-5" />
                    {metric.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Arrows */}
          {testimonials.length > 1 && (
            <>
              {/* Better styled navigation buttons */}
              <button
                onClick={goToPrevious}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200 z-20 min-h-[44px] min-w-[44px]"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-6 h-6 text-navy-900" />
              </button>

              <button
                onClick={goToNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200 z-20 min-h-[44px] min-w-[44px]"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-6 h-6 text-navy-900" />
              </button>
            </>
          )}

          {/* Carousel Dots */}
          {testimonials.length > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`transition-all rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center ${
                    index === activeIndex
                      ? 'w-8 h-3 bg-turquoise-500'
                      : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Trust Indicators */}
        {/* Added trust indicators section */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6 text-lg text-pretty">
            Csatlakozz a sikeres vállalkozások közösségéhez
          </p>
          <Link
            href="/login?redirect=/new"
            className="inline-block bg-turquoise-600 hover:bg-turquoise-700 text-white font-bold px-12 py-5 rounded-xl text-lg shadow-2xl hover:shadow-2xl transition-all transform hover:scale-105 min-h-[44px]"
          >
            Kezdd el ingyen →
          </Link>
          <p className="text-sm text-gray-500 mt-4 text-pretty">
            Ingyenes próba • Nincs bankkártya szükséges • Azonnali hozzáférés
          </p>
        </div>
      </div>
    </section>
  );
}
