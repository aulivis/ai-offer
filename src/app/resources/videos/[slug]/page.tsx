import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowRight, ChevronRight, Clock, Bookmark } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getResourceBySlug, getRelatedResources } from '@/lib/resources';
import { ResourceCard } from '@/components/resource-card';
import { ResourceStructuredData } from '@/components/resource-structured-data';
import { VideoPlayer } from '@/components/videos/VideoPlayer';
import { VideoChapters } from '@/components/videos/VideoChapters';
import { VideoSeries } from '@/components/videos/VideoSeries';
import { VideoTranscript } from '@/components/videos/VideoTranscript';
import { VideoDescription } from '@/components/videos/VideoDescription';
import { ShareDropdown } from '@/components/guides/ShareDropdown';
import { NewsletterSubscription } from '@/components/landing/NewsletterSubscription';

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
            {...(resource.featuredImage && { poster: resource.featuredImage })}
            title={resource.title}
            {...(resource.videoDuration !== undefined && { duration: resource.videoDuration })}
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
            {resource.videoDuration && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{resource.videoDuration} perc</span>
              </div>
            )}

            <div className="flex items-center gap-3">
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
                Szeretnéd elsőként kipróbálni az újdonságokat?
              </h2>
              <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-3xl mx-auto text-pretty">
                Iratkozz fel, és értesülj az újdonságokról, tippekről és az új funkciók indulásáról.
                <br />
                Csatlakozz több mint 200 vállalkozáshoz, akik már hatékonyabban dolgoznak az
                ajánlatkészítésben.
              </p>
            </div>

            {/* Newsletter subscription form */}
            <NewsletterSubscription source="video_page" />
          </div>
        </div>
      </section>
    </div>
  );
}
