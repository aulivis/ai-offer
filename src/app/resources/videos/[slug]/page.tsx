import Link from 'next/link';
import { Metadata } from 'next';
import {
  ArrowRight,
  ChevronRight,
  Calendar,
  Clock,
  Eye,
  Bookmark,
  Share2,
  Play,
  PlayCircle,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { getResourceBySlug, getRelatedResources } from '@/lib/resources';
import { ResourceCard } from '@/components/resource-card';
import { ResourceStructuredData } from '@/components/resource-structured-data';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resource = getResourceBySlug('video', slug);

  if (!resource) {
    return {
      title: 'Videó nem található',
    };
  }

  return {
    title: `${resource.title} | Vyndi Videó`,
    description: resource.excerpt || resource.description,
    openGraph: {
      title: resource.title,
      description: resource.excerpt || resource.description,
      type: 'video.other',
    },
  };
}

export default async function VideoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = getResourceBySlug('video', slug);

  if (!resource) {
    notFound();
  }

  const relatedResources = getRelatedResources(slug, 3);

  // Mock video playlist/series
  const playlist = [
    {
      id: '1',
      title: 'Bevezető videó: Első lépések a Vyndi-vel',
      duration: '5:30',
      thumbnail: '/placeholder.svg?height=80&width=120',
      slug: 'getting-started-with-vyndi',
    },
    {
      id: '2',
      title: 'Sablonok használata',
      duration: '8:15',
      thumbnail: '/placeholder.svg?height=80&width=120',
      slug: 'using-templates',
    },
    {
      id: '3',
      title: 'AI szöveggenerálás',
      duration: '12:45',
      thumbnail: '/placeholder.svg?height=80&width=120',
      slug: 'ai-text-generation',
    },
    {
      id: '4',
      title: 'Exportálás és megosztás',
      duration: '6:20',
      thumbnail: '/placeholder.svg?height=80&width=120',
      slug: 'export-and-share',
    },
  ];

  const transcript = [
    { time: '00:00', text: 'Bevezetés' },
    { time: '01:30', text: 'Regisztráció és belépés' },
    { time: '03:00', text: 'Első sablon kiválasztása' },
    { time: '05:20', text: 'Testreszabás és szerkesztés' },
    { time: '07:15', text: 'Exportálás és megosztás' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <ResourceStructuredData resource={resource} />
      <section className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
              <Link href="/resources" className="hover:text-turquoise-600">
                Erőforrások
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/resources/videos" className="hover:text-turquoise-600">
                Videók
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-navy-900">{resource.title}</span>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl mb-8 bg-black">
              {/* Placeholder for video player - replace with actual video embed */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                  <Play className="w-10 h-10 text-white ml-2" />
                </div>
              </div>
              {/* Video duration overlay */}
              {resource.videoDuration && (
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 text-white text-sm rounded font-semibold">
                  {resource.videoDuration}:00
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                  Videó
                </span>
                <span
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    resource.difficulty === 'Kezdő'
                      ? 'bg-green-100 text-green-700'
                      : resource.difficulty === 'Haladó'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                  }`}
                >
                  {resource.difficulty}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4">
                {resource.title}
              </h1>

              <p className="text-xl text-gray-700 mb-6">
                {resource.excerpt || resource.description}
              </p>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-6">
                {resource.videoDuration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    {resource.videoDuration} perc
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  {resource.views} megtekintés
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {resource.publishedDate}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <button className="px-6 py-3 bg-turquoise-600 hover:bg-turquoise-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 min-h-[44px]">
                  <Bookmark className="w-5 h-5" />
                  Mentés később
                </button>
                <button className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-navy-900 font-bold rounded-xl transition-all flex items-center gap-2 min-h-[44px]">
                  <Share2 className="w-5 h-5" />
                  Megosztás
                </button>
              </div>
            </div>

            {/* Transcript/Description */}
            <div className="prose prose-lg max-w-none mb-12">
              <h2>Videó tartalma</h2>
              <ul>
                {transcript.map((item, index) => (
                  <li key={index}>
                    <strong>{item.time}</strong> - {item.text}
                  </li>
                ))}
              </ul>

              <h2>Leírás</h2>
              <p>
                Ebben az alapvető útmutatóban végigvezetünk a Vyndi platform használatának első
                lépésein. Megmutatjuk, hogyan regisztrálhatsz, hogyan választhatod ki az első
                sablont, és hogyan készíthetsz el első ajánlatodat percek alatt.
              </p>
            </div>

            {/* Video Series/Playlist */}
            {playlist.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-navy-900 mb-6">Ebből a sorozatból</h2>
                <div className="space-y-4">
                  {playlist.map((video) => (
                    <Link
                      key={video.id}
                      href={`/resources/videos/${video.slug}`}
                      className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all group"
                    >
                      <div className="relative w-32 h-20 bg-gradient-to-br from-turquoise-400 to-blue-500 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <PlayCircle className="w-8 h-8 text-white relative z-10" />
                        <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded font-semibold z-20">
                          {video.duration}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-navy-900 mb-1 group-hover:text-turquoise-600 transition-colors">
                          {video.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Rövid leírás a videóról és annak tartalmáról
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-turquoise-600 group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Videos */}
      {relatedResources.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-navy-900 mb-8">Kapcsolódó videók</h2>

              <div className="grid md:grid-cols-3 gap-8">
                {relatedResources.map((related) => (
                  <ResourceCard key={related.id} resource={related} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Lead Gen CTA */}
      <section className="py-20 bg-gradient-to-br from-turquoise-500 to-blue-500 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Szeretnél többet tanulni?</h2>
            <p className="text-xl mb-8 text-white/90">
              Iratkozz fel hírlevelünkre és értesülj elsőként új videóinkról
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="pelda@email.com"
                className="flex-1 px-6 py-4 rounded-xl text-navy-900 focus:outline-none focus:ring-2 focus:ring-white min-h-[44px]"
              />
              <button className="bg-white hover:bg-gray-50 text-turquoise-600 font-bold px-8 py-4 rounded-xl transition-all whitespace-nowrap min-h-[44px]">
                Feliratkozom
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
