export type Profile = {
  company_name?: string;
  company_address?: string;
  company_tax_id?: string;
  company_phone?: string;
  company_email?: string;
  industries?: string[];
  brand_logo_url?: string | null;
  brand_logo_path?: string | null;
  brand_color_primary?: string | null;
  brand_color_secondary?: string | null;
  offer_template?: string | null;
  enable_reference_photos?: boolean;
  enable_testimonials?: boolean;
};

export type ActivityRow = {
  id: string;
  name: string;
  unit: string;
  default_unit_price: number;
  default_vat: number;
  industries: string[];
  reference_images?: string[] | null;
};

export type Testimonial = {
  id: string;
  user_id: string;
  activity_id?: string | null;
  text: string;
  created_at: string;
  updated_at: string;
};

export const ALL_INDUSTRIES_HU = [
  'Marketing',
  'Informatika',
  'Építőipar',
  'Tanácsadás',
  'Szolgáltatás',
  'Gyártás',
  'Oktatás',
  'Egészségügy',
  'Pénzügy',
  'E-kereskedelem',
  'Ingatlan',
] as const;

export function validatePhoneHU(v: string): boolean {
  const cleaned = v.replace(/[()\s.-]/g, '');
  return /^\+?\d{9,16}$/.test(cleaned);
}

export function validateTaxHU(v: string): boolean {
  return /^\d{8}-\d-\d{2}$/.test(v.trim());
}

export function validateAddress(v: string): boolean {
  return (v?.trim()?.length || 0) >= 8;
}












