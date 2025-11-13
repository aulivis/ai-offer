import { notFound } from 'next/navigation';
import { supabaseAnonServer } from '@/app/lib/supabaseAnonServer';
import { buildOfferHtml } from '@/app/pdf/templates/engine';
import { normalizeBranding } from '@/app/pdf/templates/theme';
import { getBrandLogoUrl } from '@/lib/branding';
import { getUserProfile } from '@/lib/services/user';
import { formatOfferIssueDate } from '@/lib/datetime';
import { createTranslator, resolveLocale } from '@/copy';
import { sanitizeInput, sanitizeHTML } from '@/lib/sanitize';
import { getRequestIp } from '@/lib/auditLogging';
import { headers } from 'next/headers';
import OfferResponseForm from './OfferResponseForm';
import { DownloadPdfButton } from './DownloadPdfButton';

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
      } | null);

  if (!offer) {
    notFound();
  }

  // Load user profile for branding
  const profile = await getUserProfile(sb, offer.user_id);

  // Parse offer data
  const inputs = (offer.inputs as Record<string, unknown>) || {};
  const priceRows = (offer.price_json as Array<unknown>) || [];
  const templateId = (inputs.templateId as string) || 'free.minimal@1.0.0';
  const locale = (inputs.language as string) || 'hu';

  // Build branding
  const brandingOptions = normalizeBranding({
    primaryColor:
      typeof profile?.brand_color_primary === 'string' ? profile.brand_color_primary : null,
    secondaryColor:
      typeof profile?.brand_color_secondary === 'string' ? profile.brand_color_secondary : null,
    logoUrl: await getBrandLogoUrl(
      sb,
      typeof profile?.brand_logo_path === 'string' ? profile.brand_logo_path : null,
      typeof profile?.brand_logo_url === 'string' ? profile.brand_logo_url : null,
    ),
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

  const html = buildOfferHtml({
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

        {/* Offer HTML Content */}
        <div
          className="mb-8 rounded-lg bg-white p-8 shadow-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />

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
