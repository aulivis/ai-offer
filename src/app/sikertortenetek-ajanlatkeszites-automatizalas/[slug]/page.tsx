import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCaseStudyBySlug } from '@/lib/case-studies';
import { CaseStudyStructuredData } from '@/components/case-study-structured-data';
import { CaseStudyDetailClient } from './CaseStudyDetailClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug);

  if (!caseStudy) {
    return {
      title: 'Sikertörténet nem található',
    };
  }

  return {
    title: `${caseStudy.companyName} sikertörténete | Vyndi`,
    description: caseStudy.shortDescription,
    openGraph: {
      title: `${caseStudy.companyName} sikertörténete`,
      description: caseStudy.shortDescription,
      type: 'article',
    },
  };
}

export default async function CaseStudyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug);

  if (!caseStudy) {
    notFound();
  }

  return (
    <>
      <CaseStudyStructuredData caseStudy={caseStudy} />
      <CaseStudyDetailClient caseStudy={caseStudy} />
    </>
  );
}
