/**
 * ABBA Data Parser
 * Parses CSV/JSON data from ABBA format into standardized records
 */

import type {
  ABBAMarketPrice,
  ABBAFeedstockData,
  ABBAImportError,
  ABBAFeedstockCategory,
  ABBARegion,
} from './types';
import {
  ABBA_FEEDSTOCK_CATEGORIES,
  ABBA_REGIONS,
} from './types';

/**
 * Parse a CSV string into records
 */
export function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = values[index].trim();
      });
      records.push(record);
    }
  }

  return records;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Normalize feedstock category to standard ABBA category
 */
export function normalizeFeedstockCategory(category: string): ABBAFeedstockCategory | null {
  const normalized = category.toUpperCase().replace(/[\s-]+/g, '_');

  // Direct match
  if (ABBA_FEEDSTOCK_CATEGORIES.includes(normalized as ABBAFeedstockCategory)) {
    return normalized as ABBAFeedstockCategory;
  }

  // Common aliases
  const aliases: Record<string, ABBAFeedstockCategory> = {
    'USED_COOKING_OIL': 'UCO',
    'COOKING_OIL': 'UCO',
    'ANIMAL_FAT': 'Tallow',
    'ANIMAL_FATS': 'Tallow',
    'BEEF_TALLOW': 'Tallow',
    'PFAD': 'Palm_PFAD',
    'PALM_FATTY_ACID': 'Palm_PFAD',
    'CANOLA_OIL': 'Canola',
    'RAPESEED': 'Canola',
    'RAPESEED_OIL': 'Canola',
    'SOY': 'Soybean',
    'SOY_OIL': 'Soybean',
    'SOYBEAN_OIL': 'Soybean',
    'SUNFLOWER_OIL': 'Sunflower',
    'DCO': 'Corn_Oil',
    'DISTILLERS_CORN_OIL': 'Corn_Oil',
    'TRAP_GREASE': 'Brown_Grease',
    'FOG': 'Brown_Grease', // Fats, Oils, Grease
  };

  return aliases[normalized] || null;
}

/**
 * Normalize region code
 */
export function normalizeRegion(region: string): ABBARegion {
  const normalized = region.toUpperCase().trim();

  if (ABBA_REGIONS.includes(normalized as ABBARegion)) {
    return normalized as ABBARegion;
  }

  // Regional aliases
  const aliases: Record<string, ABBARegion> = {
    'AUSTRALIA': 'AU',
    'AUS': 'AU',
    'EUROPE': 'EU',
    'EUR': 'EU',
    'USA': 'US',
    'AMERICA': 'US',
    'UNITED_STATES': 'US',
    'ASIA': 'APAC',
    'ASIA_PACIFIC': 'APAC',
    'ASIAPAC': 'APAC',
  };

  return aliases[normalized.replace(/[\s-]+/g, '_')] || 'AU';
}

/**
 * Parse market price records from raw data
 */
export function parseMarketPrices(
  records: Record<string, string>[]
): { prices: ABBAMarketPrice[]; errors: ABBAImportError[] } {
  const prices: ABBAMarketPrice[] = [];
  const errors: ABBAImportError[] = [];

  records.forEach((record, index) => {
    const rowNum = index + 2; // Account for header row

    // Required fields
    const category = normalizeFeedstockCategory(
      record.feedstock_category || record.category || record.feedstock || ''
    );

    if (!category) {
      errors.push({
        row: rowNum,
        field: 'feedstock_category',
        message: `Invalid feedstock category: ${record.feedstock_category || record.category || 'missing'}`,
        raw_data: record,
      });
      return;
    }

    const region = normalizeRegion(record.region || 'AU');

    const priceDate = parseDate(record.price_date || record.date || '');
    if (!priceDate) {
      errors.push({
        row: rowNum,
        field: 'price_date',
        message: `Invalid date: ${record.price_date || record.date || 'missing'}`,
        raw_data: record,
      });
      return;
    }

    const priceAud = parseNumber(
      record.price_aud_per_tonne || record.price_aud || record.price || ''
    );
    if (priceAud === null) {
      errors.push({
        row: rowNum,
        field: 'price_aud_per_tonne',
        message: `Invalid price: ${record.price_aud_per_tonne || record.price || 'missing'}`,
        raw_data: record,
      });
      return;
    }

    prices.push({
      feedstock_category: category,
      region,
      price_date: priceDate,
      price_aud_per_tonne: priceAud,
      price_usd_per_tonne: parseNumber(record.price_usd_per_tonne || record.price_usd || '') || undefined,
      price_low: parseNumber(record.price_low || '') || undefined,
      price_high: parseNumber(record.price_high || '') || undefined,
      volume_available_tonnes: parseNumber(record.volume_available_tonnes || record.volume || '') || undefined,
      source: (record.source as ABBAMarketPrice['source']) || 'ABBA',
    });
  });

  return { prices, errors };
}

/**
 * Parse feedstock data records from raw data
 */
export function parseFeedstockData(
  records: Record<string, string>[]
): { feedstocks: ABBAFeedstockData[]; errors: ABBAImportError[] } {
  const feedstocks: ABBAFeedstockData[] = [];
  const errors: ABBAImportError[] = [];

  records.forEach((record, index) => {
    const rowNum = index + 2;

    const name = record.name || record.feedstock_name || '';
    if (!name) {
      errors.push({
        row: rowNum,
        field: 'name',
        message: 'Missing feedstock name',
        raw_data: record,
      });
      return;
    }

    const category = normalizeFeedstockCategory(
      record.category || record.feedstock_category || ''
    );
    if (!category) {
      errors.push({
        row: rowNum,
        field: 'category',
        message: `Invalid category: ${record.category || 'missing'}`,
        raw_data: record,
      });
      return;
    }

    feedstocks.push({
      name,
      category,
      description: record.description || undefined,
      region: normalizeRegion(record.region || 'AU'),
      supplier_name: record.supplier_name || record.supplier || undefined,
      volume_tonnes: parseNumber(record.volume_tonnes || record.volume || '') || undefined,
      price_indication_low: parseNumber(record.price_low || record.price_indication_low || '') || undefined,
      price_indication_high: parseNumber(record.price_high || record.price_indication_high || '') || undefined,
      carbon_intensity: parseNumber(record.carbon_intensity || record.ci || '') || undefined,
      certification: record.certification || record.cert || undefined,
      available_from: parseDate(record.available_from || record.availability || '') || undefined,
    });
  });

  return { feedstocks, errors };
}

/**
 * Parse a date string in various formats
 */
function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;

  // Try ISO format first
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    return `${dmyMatch[3]}-${month}-${day}`;
  }

  // Try MM/DD/YYYY (US format)
  const mdyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (mdyMatch) {
    // Assume month if first number > 12, it's day
    const first = parseInt(mdyMatch[1], 10);
    const second = parseInt(mdyMatch[2], 10);

    if (first > 12 && second <= 12) {
      // DD/MM/YYYY
      return `${mdyMatch[3]}-${mdyMatch[2].padStart(2, '0')}-${mdyMatch[1].padStart(2, '0')}`;
    }
    // Assume MM/DD/YYYY
    return `${mdyMatch[3]}-${mdyMatch[1].padStart(2, '0')}-${mdyMatch[2].padStart(2, '0')}`;
  }

  return null;
}

/**
 * Parse a number from string, handling currency symbols and commas
 */
function parseNumber(numStr: string): number | null {
  if (!numStr) return null;

  // Remove currency symbols, commas, spaces
  const cleaned = numStr.replace(/[$€£,\s]/g, '');
  const num = parseFloat(cleaned);

  return isNaN(num) ? null : num;
}
