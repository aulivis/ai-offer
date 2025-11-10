import { CaseStudy } from '@/types/case-study';

interface CaseStudyStructuredDataProps {
  caseStudy: CaseStudy;
  baseUrl?: string;
}

export function CaseStudyStructuredData({
  caseStudy,
  baseUrl = 'https://vyndi.hu',
}: CaseStudyStructuredDataProps) {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${caseStudy.companyName} sikertörténete`,
    description: caseStudy.shortDescription,
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
    datePublished: caseStudy.publishedDate,
    image: caseStudy.featuredImage
      ? `${baseUrl}${caseStudy.featuredImage}`
      : `${baseUrl}/og-images/success-stories.jpg`,
  };

  const reviewSchema = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'SoftwareApplication',
      name: 'Vyndi',
    },
    author: {
      '@type': 'Person',
      name: caseStudy.testimonial.author,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: '5',
      bestRating: '5',
    },
    reviewBody: caseStudy.testimonial.fullQuote,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }}
      />
    </>
  );
}
