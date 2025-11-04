import { DocSlots } from './types';

export const MOCK_SLOTS: DocSlots = {
  brand: { name: 'Acme Inc.', logoUrl: '' },
  doc: {
    title: 'Offer #2025-001',
    subtitle: 'Professional Services',
    date: '2025-11-05',
  },
  customer: { name: 'Client Kft.', address: 'Budapest', taxId: 'HU12345678' },
  items: [
    { name: 'Discovery & Scoping', qty: 1, unitPrice: 400, total: 400 },
    {
      name: 'Implementation',
      qty: 1,
      unitPrice: 1200,
      total: 1200,
      note: 'Includes testing',
    },
  ],
  totals: { net: 1600, vat: 432, gross: 2032, currency: 'EUR' },
  notes: 'Payment 7 days net. Prices exclude out-of-pocket costs.',
};
