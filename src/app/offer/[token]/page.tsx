import { notFound } from 'next/navigation';
import { supabaseAnonServer } from '@/app/lib/supabaseAnonServer';
import { buildOfferHtml } from '@/app/pdf/templates/engine';
import { listTemplates, loadTemplate } from '@/app/pdf/templates/engineRegistry';
import { normalizeBranding } from '@/app/pdf/templates/theme';
import { getBrandLogoUrl } from '@/lib/branding';
import { getUserProfile } from '@/lib/services/user';
import { resolveEffectivePlan } from '@/lib/subscription';
import {
  normalizeTemplateId,
  DEFAULT_OFFER_TEMPLATE_ID,
  type SubscriptionPlan,
} from '@/app/lib/offerTemplates';
import type { OfferTemplate, TemplateId, TemplateTier } from '@/app/pdf/templates/types';
import { formatOfferIssueDate } from '@/lib/datetime';
import { createTranslator, resolveLocale } from '@/copy';
import { sanitizeInput, sanitizeHTML } from '@/lib/sanitize';
import { getRequestIp } from '@/lib/auditLogging';
import { headers } from 'next/headers';
import OfferResponseForm from './OfferResponseForm';
import { DownloadPdfButton } from './DownloadPdfButton';
import { OfferDisplay } from './OfferDisplay';
import type { AIResponseBlocks } from '@/lib/ai/blocks';

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
 */
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
  const offerData = share.offers;
  const offer = Array.isArray(offerData)
    ? offerData[0]
    : (offerData as {
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

  // Resolve template ID with fallback:
  // 1. From offer inputs (templateId during creation)
  // 2. From user profile (offer_template in settings)
  // 3. Default template for plan
  function planToTemplateTier(plan: SubscriptionPlan): TemplateTier {
    return plan === 'pro' ? 'premium' : 'free';
  }

  const planTier = planToTemplateTier(plan);
  const allTemplates = listTemplates() as Array<OfferTemplate>;
  const fallbackTemplate =
    allTemplates.find((tpl) => tpl.id === DEFAULT_OFFER_TEMPLATE_ID) ||
    loadTemplate(DEFAULT_OFFER_TEMPLATE_ID);

  const freeTemplates = allTemplates.filter((tpl) => tpl.tier === 'free');
  const defaultTemplateForPlan =
    planTier === 'premium'
      ? allTemplates[0] || fallbackTemplate
      : freeTemplates[0] || fallbackTemplate;

  const requestedTemplateId = inputs.templateId
    ? normalizeTemplateId(typeof inputs.templateId === 'string' ? inputs.templateId : null)
    : null;

  const requestedTemplate = requestedTemplateId
    ? allTemplates.find((tpl) => tpl.id === requestedTemplateId) || null
    : null;

  const profileTemplateId = normalizeTemplateId(
    typeof profile?.offer_template === 'string' ? profile.offer_template : null,
  );
  const profileTemplate = profileTemplateId
    ? allTemplates.find((tpl) => tpl.id === profileTemplateId) || null
    : null;

  const isTemplateAllowed = (tpl: OfferTemplate) => planTier === 'premium' || tpl.tier === 'free';

  let template = defaultTemplateForPlan;
  let resolvedTemplateId: TemplateId;

  if (requestedTemplate) {
    resolvedTemplateId = requestedTemplate.id;
    template = isTemplateAllowed(requestedTemplate) ? requestedTemplate : fallbackTemplate;
  } else if (profileTemplate && isTemplateAllowed(profileTemplate)) {
    template = profileTemplate;
    resolvedTemplateId = template.id;
  } else {
    template = defaultTemplateForPlan;
    resolvedTemplateId = template.id;
  }

  const templateId = resolvedTemplateId;

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

  // Build offer HTML
  const aiHtml = sanitizeHTML(offer.ai_text || '');
  const safeTitle = sanitizeInput(offer.title || '');
  const defaultTitle = sanitizeInput(translator.t('pdf.templates.common.defaultTitle'));

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
  const aiBlocks =
    offer.ai_blocks && typeof offer.ai_blocks === 'object'
      ? (offer.ai_blocks as AIResponseBlocks)
      : null;

  const fullHtml = buildOfferHtml({
    offer: {
      title: safeTitle || defaultTitle,
      companyName: sanitizeInput(profile?.company_name || ''),
      bodyHtml: aiHtml,
      templateId,
      legacyTemplateId: templateId.includes('@') ? templateId.split('@')[0] : templateId,
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
      aiBlocks,
    },
    rows: normalizedRows,
    branding: brandingOptions,
    i18n: translator,
    templateId,
  });

  // Log access
  const headersList = await headers();
  const ipAddress = getRequestIp(headersList);
  const userAgent = headersList.get('user-agent') || '';

  await sb.from('offer_share_access_logs').insert({
    share_id: share.id,
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  // Update access count
  await sb
    .from('offer_shares')
    .update({
      access_count: (share.access_count || 0) + 1,
      last_accessed_at: new Date().toISOString(),
    })
    .eq('id', share.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Download PDF Button - hidden in PDF mode */}
        {!isPdfMode && <DownloadPdfButton token={token} offerId={offer.id} />}

        {/* Offer HTML Content with Template and Branding */}
        <OfferDisplay html={fullHtml} />

        {/* Response Form - hidden in PDF mode */}
        {!isPdfMode && (
          <>
            {existingResponse ? (
              <div className="rounded-lg bg-green-50 p-6 text-center">
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
              <OfferResponseForm shareId={share.id} offerId={offer.id} token={token} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
