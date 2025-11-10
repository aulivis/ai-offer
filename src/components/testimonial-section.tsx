'use client';

import { useState, useEffect, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import Image from 'next/image';

export function TestimonialSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const testimonials = [
    {
      name: 'Kiss Júlia',
      role: 'Marketing Vezető',
      company: 'Creative Agency',
      image: '/placeholder.svg?height=100&width=100',
      quote:
        'A Vyndi segítségével 70% időt spórolunk meg az ajánlatkészítésen. Most több időnk marad az ügyfelekkel való kapcsolattartásra.',
      rating: 5,
      result: '70% időmegtakarítás',
      resultValue: '+15 ajánlat/hét',
    },
    {
      name: 'Nagy Péter',
      role: 'Értékesítési Igazgató',
      company: 'Tech Solutions Kft',
      image: '/placeholder.svg?height=100&width=100',
      quote:
        'Hihetetlen, hogy milyen gyorsan és professzionálisan tudunk most ajánlatot készíteni. Az ügyfeleink is észreveszik a különbséget.',
      rating: 5,
      result: '3x gyorsabb',
      resultValue: '98% pontosság',
    },
    {
      name: 'Szabó Anna',
      role: 'Ügyvezető',
      company: 'Growth Partners',
      image: '/placeholder.svg?height=100&width=100',
      quote:
        'A Vyndi nélkül már el sem tudom képzelni a munkánkat. Az AI funkciók egyszerűen zseniálisak, és a csapatom imádja használni.',
      rating: 5,
      result: '50+ ajánlat/hó',
      resultValue: '85% elfogadási arány',
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
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-turquoise-600 font-semibold text-sm uppercase tracking-wide mb-3">
            ÜGYFELEINK MONDJÁK
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4 text-balance">
            Csatlakozz a Vyndi közösséghez
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto text-pretty">
            500+ vállalkozás bízik már a Vyndiben. Nézd meg, mit mondanak rólunk!
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-16">
          <div className="text-center">
            <div className="text-4xl font-bold text-turquoise-600 mb-2">500+</div>
            <div className="text-gray-600">Aktív felhasználó</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-turquoise-600 mb-2">10K+</div>
            <div className="text-gray-600">Létrehozott ajánlat</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-turquoise-600 mb-2">98%</div>
            <div className="text-gray-600">Elégedettségi mutató</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-turquoise-600 mb-2">24/7</div>
            <div className="text-gray-600">Ügyfélszolgálat</div>
          </div>
        </div>

        {/* Testimonial Carousel */}
        <div className="max-w-5xl mx-auto">
          <div
            className="relative bg-white rounded-2xl shadow-2xl p-8 md:p-12 border-2 border-turquoise-100"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Quote Icon */}
            <div className="absolute top-8 left-8 text-turquoise-200">
              <Quote className="w-16 h-16" />
            </div>

            {/* Content */}
            <div className="relative">
              {/* User Info */}
              <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
                <div className="relative">
                  <Image
                    src={currentTestimonial.image || '/placeholder.svg'}
                    alt={currentTestimonial.name}
                    width={100}
                    height={100}
                    className="rounded-full border-4 border-turquoise-200"
                    loading="lazy"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-turquoise-600 text-white rounded-full p-2">
                    <Star className="w-4 h-4 fill-white" />
                  </div>
                </div>

                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold text-navy-900 mb-1 text-balance">
                    {currentTestimonial.name}
                  </h3>
                  <p className="text-gray-600 mb-2 text-pretty">
                    {currentTestimonial.role} • {currentTestimonial.company}
                  </p>

                  {/* Star Rating */}
                  <div className="flex gap-1 justify-center md:justify-start">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Quote */}
              <blockquote className="text-xl md:text-2xl text-gray-700 leading-relaxed mb-8 italic text-pretty">
                &ldquo;{currentTestimonial.quote}&rdquo;
              </blockquote>

              {/* Results */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="bg-turquoise-50 border-2 border-turquoise-200 px-6 py-3 rounded-full">
                  <span className="font-bold text-turquoise-700">{currentTestimonial.result}</span>
                </div>
                <div className="bg-green-50 border-2 border-green-200 px-6 py-3 rounded-full">
                  <span className="font-bold text-green-700">{currentTestimonial.resultValue}</span>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <div className="absolute top-1/2 -translate-y-1/2 left-4 md:-left-6">
              <button
                onClick={goToPrevious}
                className="bg-white hover:bg-gray-50 rounded-full p-3 shadow-lg border-2 border-gray-200 transition-all hover:scale-110 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-6 h-6 text-navy-900" />
              </button>
            </div>

            <div className="absolute top-1/2 -translate-y-1/2 right-4 md:-right-6">
              <button
                onClick={goToNext}
                className="bg-white hover:bg-gray-50 rounded-full p-3 shadow-lg border-2 border-gray-200 transition-all hover:scale-110 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-6 h-6 text-navy-900" />
              </button>
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="flex gap-2 justify-center mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={`Go to testimonial ${index + 1}`}
              >
                <span
                  className={`h-2 rounded-full transition-all ${
                    index === activeIndex
                      ? 'w-8 bg-turquoise-600'
                      : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
