import type { FC } from 'react';

export interface CaseStudyMetric {
  id: string;
  value: string;
  label: string;
  description: string;
  before?: string;
  after?: string;
  improvement?: string;
}

export interface CaseStudyTestimonial {
  quote: string;
  fullQuote: string;
  author: string;
  authorInitials: string;
  role: string;
}

export interface CaseStudyTimeline {
  week: string;
  period: string;
  title: string;
  description: string;
  metrics?: string;
}

export interface CaseStudyImplementationStep {
  title: string;
  description: string;
}

export interface CaseStudy {
  id: string;
  slug: string;
  companyName: string;
  companyLogo?: string;
  industry: string;
  industryLabel: string;
  companySize: string;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  timeline: string;
  featured: boolean;

  // Summary
  shortDescription: string;
  mainResult: string;

  // Metrics
  metrics: CaseStudyMetric[];

  // Story sections
  challenge: string;
  challengePoints: string[];
  solution: string;
  featuresUsed: string[];

  // Timeline
  resultTimeline: CaseStudyTimeline[];

  // Implementation
  implementationSteps: CaseStudyImplementationStep[];

  // Testimonial
  testimonial: CaseStudyTestimonial;

  // Metadata
  publishedDate: string;
  featuredImage?: string;
  relatedCaseStudies: string[]; // slugs

  // Legacy support
  company?: string;
  results?: Array<{
    metric: string;
    label: string;
    icon?: FC<{ className?: string }>;
  }>;
  stats?: {
    timeSaved?: string;
    revenue?: string;
    proposals?: string;
  };
  hasVideo?: boolean;
  hasPDF?: boolean;
}
