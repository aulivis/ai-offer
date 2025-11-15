'use client';

import Link from 'next/link';
import SparklesIcon from '@heroicons/react/24/outline/SparklesIcon';
import RocketLaunchIcon from '@heroicons/react/24/outline/RocketLaunchIcon';
import ClockIcon from '@heroicons/react/24/outline/ClockIcon';
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon';
import BoltIcon from '@heroicons/react/24/outline/BoltIcon';
import PlayIcon from '@heroicons/react/24/outline/PlayIcon';
import DocumentTextIcon from '@heroicons/react/24/outline/DocumentTextIcon';
import PaintBrushIcon from '@heroicons/react/24/outline/PaintBrushIcon';
import BriefcaseIcon from '@heroicons/react/24/outline/BriefcaseIcon';

export function EmptyState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Welcome hero */}
        <div className="text-center mb-12 pt-12">
          <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <SparklesIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Üdvözlünk a Vyndi-ben! 👋
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Kezdd el az első professzionális ajánlatod készítését most
          </p>
        </div>

        {/* Quick start guide */}
        <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <RocketLaunchIcon className="w-6 h-6 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">3 lépés a sikeres ajánlatig</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-teal-50 rounded-xl border-2 border-teal-200">
              <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Válassz sablont</h3>
                <p className="text-sm text-gray-600">
                  Kezdj egy profi sablonnal vagy hozz létre sajátot
                </p>
              </div>
              <ClockIcon className="w-5 h-5 text-teal-600" />
              <span className="text-sm font-semibold text-teal-600">2 perc</span>
            </div>

            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Töltsd ki az ajánlatot</h3>
                <p className="text-sm text-gray-600">Add meg a szolgáltatásokat és az árakat</p>
              </div>
              <ClockIcon className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-600">5 perc</span>
            </div>

            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border-2 border-green-200">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Küld el az ügyfélnek</h3>
                <p className="text-sm text-gray-600">Egy kattintás és már úton is van!</p>
              </div>
              <ClockIcon className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-green-600">1 perc</span>
            </div>
          </div>

          <Link
            href="/new"
            className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white py-5 px-8 rounded-xl font-bold text-lg mt-6 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 group"
          >
            <BoltIcon className="w-6 h-6" />
            <span>Első ajánlatom elkészítése</span>
            <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Template preview cards */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Vagy kezdj egy sablonnal</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/new?template=web"
              className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:border-teal-300 transition-all text-left group"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <DocumentTextIcon className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">
                Webfejlesztés sablon
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Teljes webes projekt ajánlat előre kitöltött tételekkel
              </p>
              <div className="flex items-center gap-2 text-teal-600 text-sm font-semibold">
                <span>Sablon használata</span>
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/new?template=marketing"
              className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:border-teal-300 transition-all text-left group"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <PaintBrushIcon className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">
                Marketing sablon
              </h4>
              <p className="text-sm text-gray-600 mb-4">SEO, PPC és social media kampány ajánlat</p>
              <div className="flex items-center gap-2 text-teal-600 text-sm font-semibold">
                <span>Sablon használata</span>
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/new?template=consulting"
              className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:border-teal-300 transition-all text-left group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <BriefcaseIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">
                Tanácsadás sablon
              </h4>
              <p className="text-sm text-gray-600 mb-4">Üzleti tanácsadás és stratégiai projekt</p>
              <div className="flex items-center gap-2 text-teal-600 text-sm font-semibold">
                <span>Sablon használata</span>
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>

        {/* Video tutorial */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl p-8 text-center text-white">
          <PlayIcon className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h3 className="text-2xl font-bold mb-3">2 perces videó útmutató</h3>
          <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
            Nézd meg, hogyan készíts professzionális ajánlatot percek alatt
          </p>
          <button className="bg-white text-purple-600 py-3 px-8 rounded-xl font-bold hover:shadow-xl transition-all">
            Videó megtekintése
          </button>
        </div>
      </div>
    </div>
  );
}
