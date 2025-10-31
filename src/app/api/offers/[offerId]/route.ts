import { NextResponse } from 'next/server';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { extractOfferStoragePath } from '@/lib/offers/storage';
import { withAuth, type AuthenticatedNextRequest } from '../../../../../middleware/auth';

type RouteParams = {
  offerId?: string;
};

export const DELETE = withAuth(
  async (request: AuthenticatedNextRequest, context: { params: RouteParams }) => {
    const { offerId } = context.params;
    if (!offerId || typeof offerId !== 'string') {
      return NextResponse.json({ error: 'Érvénytelen ajánlat azonosító.' }, { status: 400 });
    }

    try {
      const sessionClient = await supabaseServer();
      const { data: offer, error: loadError } = await sessionClient
        .from('offers')
        .select('id, user_id, pdf_url')
        .eq('id', offerId)
        .maybeSingle();

      if (loadError) {
        console.error('Failed to load offer before deletion', loadError);
        return NextResponse.json(
          { error: 'Nem sikerült betölteni az ajánlatot.' },
          { status: 500 },
        );
      }

      if (!offer) {
        return NextResponse.json({ error: 'Az ajánlat nem található.' }, { status: 404 });
      }

      if (offer.user_id !== request.user.id) {
        return NextResponse.json(
          { error: 'Nincs jogosultságod az ajánlat törléséhez.' },
          { status: 403 },
        );
      }

      const adminClient = supabaseServiceRole();

      const storagePaths = new Set<string>();
      if (offer.pdf_url) {
        const directPath = extractOfferStoragePath(offer.pdf_url);
        if (directPath) storagePaths.add(directPath);
      }
      storagePaths.add(`${offer.user_id}/${offerId}.pdf`);

      const { data: jobRows, error: jobError } = await adminClient
        .from('pdf_jobs')
        .select<{ storage_path: string | null }>('storage_path')
        .eq('offer_id', offerId)
        .eq('user_id', offer.user_id);

      if (jobError) {
        console.error('Failed to load offer PDF job storage paths', jobError);
      } else {
        jobRows?.forEach(({ storage_path }) => {
          const rawPath = typeof storage_path === 'string' ? storage_path.trim() : '';
          if (!rawPath) return;
          storagePaths.add(rawPath);
          const normalized = extractOfferStoragePath(rawPath);
          if (normalized) storagePaths.add(normalized);
        });
      }

      const { error: deleteError } = await adminClient.from('offers').delete().eq('id', offerId);
      if (deleteError) {
        console.error('Failed to delete offer', deleteError);
        return NextResponse.json({ error: 'Nem sikerült törölni az ajánlatot.' }, { status: 500 });
      }

      const storageList = Array.from(storagePaths).filter(Boolean);
      if (storageList.length > 0) {
        const { error: storageError } = await adminClient.storage
          .from('offers')
          .remove(storageList);
        if (storageError) {
          console.error('Failed to delete offer PDFs from storage', storageError);
        }
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Unexpected error during offer deletion', error);
      return NextResponse.json({ error: 'Nem sikerült törölni az ajánlatot.' }, { status: 500 });
    }
  },
);
