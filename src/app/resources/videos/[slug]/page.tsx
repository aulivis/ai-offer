import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowRight, ChevronRight, Calendar, Clock, Eye, Bookmark, ThumbsUp } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getResourceBySlug, getRelatedResources } from '@/lib/resources';
import { ResourceCard } from '@/components/resource-card';
import { ResourceStructuredData } from '@/components/resource-structured-data';
import { VideoPlayer } from '@/components/videos/VideoPlayer';
import { VideoChapters } from '@/components/videos/VideoChapters';
import { VideoSeries } from '@/components/videos/VideoSeries';
import { VideoTranscript } from '@/components/videos/VideoTranscript';
import { VideoDescription } from '@/components/videos/VideoDescription';
import { VideoComments } from '@/components/videos/VideoComments';
import { ShareDropdown } from '@/components/guides/ShareDropdown';

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

  const chapters = [
    {
      time: 0,
      timeFormatted: '00:00',
      title: 'Bevezetés',
      description: 'Áttekintés a videó tartalmáról',
      thumbnail: resource.featuredImage || '/placeholder.svg?height=80&width=120',
    },
    {
      time: 70,
      timeFormatted: '01:10',
      title: 'Regisztráció és beállítás',
      description: 'Hogyan hozz létre fiókot',
      thumbnail: resource.featuredImage || '/placeholder.svg?height=80&width=120',
    },
    {
      time: 200,
      timeFormatted: '03:20',
      title: 'Első lépések az ajánlatkészítésben',
      description: 'Alapvető funkciók bemutatása',
      thumbnail: resource.featuredImage || '/placeholder.svg?height=80&width=120',
    },
  ];

  const transcript = [
    { time: '00:00', text: 'Üdvözöllek a Vyndi bevezető videójában...' },
    { time: '00:15', text: 'Ma megmutatom, hogyan kezdheted el használni...' },
    { time: '01:30', text: 'Regisztráció és belépés' },
    { time: '03:00', text: 'Első sablon kiválasztása' },
    { time: '05:20', text: 'Testreszabás és szerkesztés' },
    { time: '07:15', text: 'Exportálás és megosztás' },
  ];

  const currentVideoIndex = playlist.findIndex((v) => v.slug === slug) + 1;

  return (
    <div className="min-h-screen bg-white">
      <ResourceStructuredData resource={resource} />

      {/* Enhanced Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Breadcrumb */}
        <nav className="text-sm mb-6 flex items-center gap-2 text-gray-600" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-teal-600 transition-colors">
            Főoldal
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/resources" className="hover:text-teal-600 transition-colors">
            Erőforrások
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/resources#videos" className="hover:text-teal-600 transition-colors">
            Videók
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{resource.title}</span>
        </nav>

        {/* Enhanced Video Player */}
        <div className="mb-8">
          <VideoPlayer
            videoUrl={resource.videoUrl || '/videos/intro-video.mp4'}
            poster={resource.featuredImage}
            title={resource.title}
            duration={resource.videoDuration}
          />
        </div>

        {/* Video metadata and actions */}
        <div className="mb-8">
          <div className="flex items-start gap-3 mb-4">
            <span className="bg-teal-500 text-white text-sm px-4 py-1.5 rounded-full font-semibold">
              Videó
            </span>
            <span
              className={`text-sm px-3 py-1 rounded-full font-medium ${
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

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            {resource.title}
          </h1>

          <p className="text-xl text-gray-700 leading-relaxed mb-6">
            {resource.excerpt || resource.description}
          </p>

          {/* Metadata and actions row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm text-gray-600">
              {resource.videoDuration && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{resource.videoDuration} perc</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>{resource.views.toLocaleString()} megtekintés</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{resource.publishedDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-teal-500 transition-colors min-h-[44px]">
                <ThumbsUp className="w-5 h-5" />
                <span className="font-medium">Tetszik</span>
                <span className="text-gray-600">(243)</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-teal-500 transition-colors min-h-[44px]">
                <Bookmark className="w-5 h-5" />
                <span className="font-medium">Mentés</span>
              </button>
              <ShareDropdown url={`/resources/videos/${slug}`} title={resource.title} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Main content - 8 columns */}
              <div className="lg:col-span-8">
                {/* Video Description */}
                <VideoDescription resource={resource} />

                {/* Interactive Chapters */}
                <VideoChapters chapters={chapters} />

                {/* Transcript */}
                <VideoTranscript transcript={transcript} />

                {/* Comments */}
                <VideoComments videoId={slug} />
              </div>

              {/* Sidebar - 4 columns */}
              <aside className="lg:col-span-4">
                <div className="lg:sticky lg:top-24 space-y-6">
                  {/* Series Navigation */}
                  {playlist.length > 0 && (
                    <VideoSeries
                      playlist={playlist}
                      currentSlug={slug}
                      currentIndex={currentVideoIndex}
                    />
                  )}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Related Videos */}
      {relatedResources.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Kapcsolódó videók</h2>
                  <p className="text-gray-600">Folytasd a tanulást ezekkel a videókkal</p>
                </div>
                <Link
                  href="/resources#videos"
                  className="text-teal-600 font-semibold hover:underline flex items-center gap-2"
                >
                  <span>Összes videó</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
