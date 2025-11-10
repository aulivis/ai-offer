import { Resource } from '@/types/resource';

interface ResourceStructuredDataProps {
  resource: Resource;
  baseUrl?: string;
}

export function ResourceStructuredData({
  resource,
  baseUrl = 'https://vyndi.hu',
}: ResourceStructuredDataProps) {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: resource.title,
    description: resource.excerpt || resource.description,
    author: {
      '@type': 'Organization',
      name: 'Vyndi',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Vyndi',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/vyndi-logo.png`,
      },
    },
    datePublished: resource.publishedDate,
    dateModified: resource.updatedDate || resource.publishedDate,
    image: resource.featuredImage
      ? `${baseUrl}${resource.featuredImage}`
      : `${baseUrl}/og-images/resources.jpg`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/resources/${resource.type}s/${resource.slug}`,
    },
  };

  // Video schema for video resources
  const videoSchema =
    resource.type === 'video'
      ? {
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: resource.title,
          description: resource.excerpt || resource.description,
          thumbnailUrl: resource.featuredImage
            ? `${baseUrl}${resource.featuredImage}`
            : `${baseUrl}/og-images/video-thumbnail.jpg`,
          uploadDate: resource.publishedDate,
          duration: resource.videoDuration ? `PT${resource.videoDuration}M` : undefined,
          contentUrl: resource.videoUrl || `${baseUrl}/resources/videos/${resource.slug}`,
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {videoSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
        />
      )}
    </>
  );
}
