/**
 * ABBA (Australian Biofuel & Biomass Association) Data Types
 * For importing market prices and feedstock availability data
 */

export interface ABBAMarketPrice {
  feedstock_category: string;
  region: 'AU' | 'EU' | 'US' | 'APAC';
  price_date: string;
  price_aud_per_tonne: number;
  price_usd_per_tonne?: number;
  price_low?: number;
  price_high?: number;
  volume_available_tonnes?: number;
  source: 'ABBA' | 'Platts' | 'Argus' | 'manual';
}

export interface ABBAFeedstockData {
  name: string;
  category: string;
  description?: string;
  region: string;
  supplier_name?: string;
  volume_tonnes?: number;
  price_indication_low?: number;
  price_indication_high?: number;
  carbon_intensity?: number;
  certification?: string;
  available_from?: string;
}

export interface ABBAImportResult {
  success: boolean;
  import_type: 'feedstock' | 'price' | 'volume' | 'full';
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  errors: ABBAImportError[];
  started_at: string;
  completed_at: string;
}

export interface ABBAImportError {
  row: number;
  field?: string;
  message: string;
  raw_data?: unknown;
}

// Standard feedstock categories used by ABBA
export const ABBA_FEEDSTOCK_CATEGORIES = [
  'UCO', // Used Cooking Oil
  'Tallow', // Animal Fats
  'Palm_PFAD', // Palm Fatty Acid Distillate
  'Canola', // Canola Oil
  'Soybean', // Soybean Oil
  'Sunflower', // Sunflower Oil
  'POME', // Palm Oil Mill Effluent
  'Corn_Oil', // Distillers Corn Oil
  'Brown_Grease', // Trap/Brown Grease
  'Yellow_Grease', // Yellow Grease
  'Waste_Lipids', // Other Waste Lipids
] as const;

export type ABBAFeedstockCategory = typeof ABBA_FEEDSTOCK_CATEGORIES[number];

// Regional codes
export const ABBA_REGIONS = ['AU', 'EU', 'US', 'APAC'] as const;
export type ABBARegion = typeof ABBA_REGIONS[number];

// Price source identifiers
export const ABBA_PRICE_SOURCES = ['ABBA', 'Platts', 'Argus', 'manual'] as const;
export type ABBAPriceSource = typeof ABBA_PRICE_SOURCES[number];
