import { notFound } from 'next/navigation';
import { supabaseAnonServer } from '@/app/lib/supabaseAnonServer';
import { normalizeBranding } from '@/lib/branding';
import { getBrandLogoUrl } from '@/lib/branding';
import { getUserProfile } from '@/lib/services/user';
import { resolveEffectivePlan } from '@/lib/subscription';
import type { SubscriptionPlan } from '@/app/lib/offerTemplates';
import { formatOfferIssueDate } from '@/lib/datetime';
import { createTranslator, resolveLocale } from '@/copy';
import { sanitizeInput, sanitizeHTML } from '@/lib/sanitize';
import { getRequestIp } from '@/lib/auditLogging';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';
import { renderOfferHtml } from '@/lib/offers/renderer';
import OfferResponseForm from './OfferResponseForm';
import { DownloadPdfButton } from './DownloadPdfButton';
import { OfferDisplay } from './OfferDisplay';

type PageProps = {
  params: Promise<{
    token?: string;
  }>;
  searchParams: Promise<{
    pdf?: string;
  }>;
};

/**
 * Public offer view page
 * GET /offer/[token]
 *
 * This page allows customers to view offers without authentication
 * and respond to them (accept/reject).
 *
 * Note: We use dynamic rendering to check share expiration, but add cache headers
 * for CDN caching of the rendered HTML.
 */
export const dynamic = 'force-dynamic'; // Ensure we check share expiration

// Cache configuration: cache for 5 minutes, allow stale content for 1 hour
// This balances freshness with performance
export const revalidate = 300; // 5 minutes

export default async function PublicOfferPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const token = resolvedParams.token;
  const isPdfMode = resolvedSearchParams.pdf === 'true';

  if (!token || typeof token !== 'string') {
    notFound();
  }

  const sb = await supabaseAnonServer();

  // Load share record with offer
  const { data: share, error: shareError } = await sb
    .from('offer_shares')
    .select('*, offers(*)')
    .eq('token', token)
    .eq('is_active', true)
    .maybeSingle();

  if (shareError || !share) {
    notFound();
  }

  // Check expiration
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    notFound();
  }

  // Check if already responded (prevent multiple responses)
  const { data: existingResponse } = await sb
    .from('offer_responses')
    .select('id, decision, created_at')
    .eq('share_id', share.id)
    .maybeSingle();

  // Extract offer from share (Supabase returns it as an array or object)
  const shareOfferData = share.offers;
  const offer = Array.isArray(shareOfferData)
    ? shareOfferData[0]
    : (shareOfferData as {
        id: string;
        user_id: string;
        title: string;
        industry: string;
        ai_text: string;
        price_json: unknown;
        inputs: unknown;
        created_at: string;
        ai_blocks?: unknown;
        schedule?: unknown;
        testimonials?: unknown;
        guarantees?: unknown;
      } | null);

  if (!offer) {
    notFound();
  }

  // Load user profile for branding and plan check
  const profile = await getUserProfile(sb, offer.user_id);

  // Parse offer data
  const inputs = (offer.inputs as Record<string, unknown>) || {};
  const priceRows = (offer.price_json as Array<unknown>) || [];
  const locale = (inputs.language as string) || 'hu';

  // Check user plan
  const plan: SubscriptionPlan = resolveEffectivePlan(
    typeof profile?.plan === 'string' ? profile.plan : null,
  );
  const isProUser = plan === 'pro';

  // Resolve template using centralized utility
  const rawTemplateId = inputs.templateId
    ? typeof inputs.templateId === 'string'
      ? inputs.templateId
      : null
    : null;

  const { resolveOfferTemplate } = await import('@/lib/offers/templateResolution');
  const templateResolution = resolveOfferTemplate({
    requestedTemplateId: rawTemplateId,
    profileTemplateId: typeof profile?.offer_template === 'string' ? profile.offer_template : null,
    plan,
    offerId: offer.id,
    userId: offer.user_id,
  });

  const templateId = templateResolution.templateId;

  // Log if fallback was used
  if (templateResolution.wasFallback) {
    logger.warn('Template fallback used for offer', {
      offerId: offer.id,
      requestedTemplateId: rawTemplateId,
      resolvedTemplateId: templateId,
      resolutionReason: templateResolution.resolutionReason,
    });
  }

  // Build branding:
  // - Brand colors: available for all users
  // - Logo: only for Pro users
  const brandingOptions = normalizeBranding({
    primaryColor:
      typeof profile?.brand_color_primary === 'string' ? profile.brand_color_primary : null,
    secondaryColor:
      typeof profile?.brand_color_secondary === 'string' ? profile.brand_color_secondary : null,
    logoUrl: isProUser
      ? await getBrandLogoUrl(
          sb,
          typeof profile?.brand_logo_path === 'string' ? profile.brand_logo_path : null,
          typeof profile?.brand_logo_url === 'string' ? profile.brand_logo_url : null,
        )
      : null,
  });

  const translator = createTranslator(locale);
  const resolvedLocale = resolveLocale(locale);

  // Build offer HTML using the new unified renderer
  const safeTitle = sanitizeInput(offer.title || '');
  const defaultTitle = sanitizeInput(translator.t('pdf.templates.common.defaultTitle'));

  // Get the stored HTML body (images should already be embedded as data URLs)
  const aiHtml = sanitizeHTML(offer.ai_text || '');

  // Extract images from HTML body if they exist
  const extractImagesFromHtml = (
    html: string,
  ): Array<{ src: string; alt: string; key: string }> => {
    const images: Array<{ src: string; alt: string; key: string }> = [];
    const imgRegex = /<img\b[^>]*>/gi;
    let match: RegExpExecArray | null;
    let index = 0;

    while ((match = imgRegex.exec(html)) !== null) {
      const imgTag = match[0]!;
      const srcMatch = imgTag.match(/\ssrc=["']([^"']+)["']/i);
      const altMatch = imgTag.match(/\salt=["']([^"']*)["']/i);

      if (srcMatch && srcMatch[1]) {
        images.push({
          src: srcMatch[1]!,
          alt: altMatch && altMatch[1] ? altMatch[1]! : `Image ${index + 1}`,
          key: `img-${index++}`,
        });
      }
    }

    return images;
  };

  const extractedImages = extractImagesFromHtml(aiHtml);

  // Normalize price rows
  const normalizedRows = priceRows
    .filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null)
    .map((row) => ({
      name: typeof row.name === 'string' ? row.name : undefined,
      qty: typeof row.qty === 'number' && Number.isFinite(row.qty) ? row.qty : undefined,
      unit: typeof row.unit === 'string' ? row.unit : undefined,
      unitPrice:
        typeof row.unitPrice === 'number' && Number.isFinite(row.unitPrice)
          ? row.unitPrice
          : undefined,
      vat: typeof row.vat === 'number' && Number.isFinite(row.vat) ? row.vat : undefined,
    }));

  const sanitizeList = (value: unknown): string[] =>
    Array.isArray(value)
      ? value
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .map((item) => sanitizeInput(item))
      : [];

  const scheduleItems = sanitizeList(offer.schedule);
  const testimonialsList = sanitizeList(offer.testimonials);
  const guaranteesList = sanitizeList(offer.guarantees);

  // Render complete HTML document with new modern template system
  const fullHtml = renderOfferHtml(
    {
      title: safeTitle || defaultTitle,
      companyName: sanitizeInput(profile?.company_name || ''),
      bodyHtml: aiHtml,
      locale: resolvedLocale,
      issueDate: sanitizeInput(formatOfferIssueDate(new Date(offer.created_at), resolvedLocale)),
      contactName: sanitizeInput(
        (typeof profile?.company_contact_name === 'string'
          ? profile.company_contact_name
          : typeof profile?.representative === 'string'
            ? profile.representative
            : profile?.company_name) || '',
      ),
      contactEmail: sanitizeInput(
        (typeof profile?.company_email === 'string' ? profile.company_email : '') || '',
      ),
      contactPhone: sanitizeInput(
        (typeof profile?.company_phone === 'string' ? profile.company_phone : '') || '',
      ),
      companyWebsite: sanitizeInput(
        (typeof profile?.company_website === 'string'
          ? profile.company_website
          : typeof profile?.website === 'string'
            ? profile.website
            : '') || '',
      ),
      companyAddress: sanitizeInput(
        (typeof profile?.company_address === 'string' ? profile.company_address : '') || '',
      ),
      companyTaxId: sanitizeInput(
        (typeof profile?.company_tax_id === 'string' ? profile.company_tax_id : '') || '',
      ),
      schedule: scheduleItems,
      testimonials: testimonialsList.length ? testimonialsList : null,
      guarantees: guaranteesList.length ? guaranteesList : null,
      pricingRows: normalizedRows,
      images: extractedImages,
      ...(brandingOptions && { branding: brandingOptions }),
      templateId, // Pass template ID to use the selected template
    },
    translator,
  );

  // The new template system returns complete, self-contained HTML documents with inline styles
  // Extract body content and styles for proper display in Next.js page
  const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1]! : fullHtml;

  // Extract all styles from the HTML document (templates have inline styles)
  const styleMatches = fullHtml.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  const allStyles: string[] = [];
  for (const match of styleMatches) {
    if (match[1]) {
      allStyles.push(match[1]);
    }
  }
  const inlineStyles = allStyles.join('\n\n');

  // Log access (non-blocking for better performance)
  const headersList = await headers();
  const ipAddress = getRequestIp(headersList);
  const userAgent = headersList.get('user-agent') || '';

  // Log access asynchronously to not block response
  Promise.all([
    sb.from('offer_share_access_logs').insert({
      share_id: share.id,
      ip_address: ipAddress,
      user_agent: userAgent,
    }),
    sb
      .from('offer_shares')
      .update({
        access_count: (share.access_count || 0) + 1,
        last_accessed_at: new Date().toISOString(),
      })
      .eq('id', share.id),
  ]).catch((error) => {
    logger.warn('Failed to log offer access', {
      shareId: share.id,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Download PDF Button - hidden in PDF mode */}
        {!isPdfMode && (
          <div className="mb-6 flex justify-center">
            <DownloadPdfButton token={token} offerId={offer.id} />
          </div>
        )}

        {/* Offer HTML Content - fully self-contained with inline styles */}
        {/* The new template system generates complete HTML documents with inline styles */}
        {inlineStyles && <style dangerouslySetInnerHTML={{ __html: inlineStyles }} />}
        <OfferDisplay html={bodyHtml} />

        {/* Response Form - hidden in PDF mode */}
        {!isPdfMode && (
          <div className="mt-8">
            {existingResponse ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center shadow-sm">
                <h2 className="mb-2 text-xl font-semibold text-green-800">Köszönjük a válaszát!</h2>
                <p className="text-green-700">
                  Ön már{' '}
                  {existingResponse.decision === 'accepted'
                    ? 'elfogadta'
                    : existingResponse.decision === 'rejected'
                      ? 'elutasította'
                      : 'kérdést tett fel'}{' '}
                  ezt az ajánlatra.
                </p>
                <p className="mt-2 text-sm text-green-600">
                  Válasz ideje: {new Date(existingResponse.created_at).toLocaleString('hu-HU')}
                </p>
              </div>
            ) : (
              <OfferResponseForm
                shareId={share.id}
                offerId={offer.id}
                token={token}
                contactEmail={
                  typeof profile?.company_email === 'string' ? profile.company_email : undefined
                }
                contactPhone={
                  typeof profile?.company_phone === 'string' ? profile.company_phone : undefined
                }
                contactName={sanitizeInput(
                  (typeof profile?.company_contact_name === 'string'
                    ? profile.company_contact_name
                    : typeof profile?.representative === 'string'
                      ? profile.representative
                      : profile?.company_name) || '',
                )}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
