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

  // Special metadata for marketing-ugynokseg-sablon-automatizacio
  if (slug === 'marketing-ugynokseg-sablon-automatizacio') {
    return {
      title: 'Creative Agency | 80% gyorsulás ajánlatkészítésben - Vyndi esettanulmány',
      description:
        'Hogyan spórolt 96 munkaórát a 12 fős Creative Agency a Vyndi-vel? Valós eredmények: 80% időmegtakarítás, 100% márkakonzisztencia. Olvasd el a teljes történetet!',
      openGraph: {
        title: 'Creative Agency | 80% gyorsulás ajánlatkészítésben - Vyndi esettanulmány',
        description:
          'Hogyan spórolt 96 munkaórát a 12 fős Creative Agency a Vyndi-vel? Valós eredmények: 80% időmegtakarítás, 100% márkakonzisztencia. Olvasd el a teljes történetet!',
        type: 'article',
      },
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
