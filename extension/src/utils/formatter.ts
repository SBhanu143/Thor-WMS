/**
 * Thor WMS — Formatter Utilities
 * Verified formatting rules for BIN, BB, and Empty Bin codes.
 */

export type WmsInputType = 'product' | 'bin' | 'bb' | 'empty_bin' | 'empty';

/**
 * BIN LOCATION FORMATTER
 * 
 * Rules:
 * 1. Uppercase all letters.
 * 2. Strip non-alphanumeric, auto-insert hyphens.
 * 3. Pattern: ZONE(letters) - AISLE(digits) - SHELF(letters) - LEVEL(digits)
 * 4. Aisle (middle numeric): pad 1-9 to 01-09. 10+ stays unchanged.
 * 5. Level (last numeric): NEVER padded. Kept exactly as entered.
 * 
 * Examples:
 *   a1d5     → A-01-D-5
 *   A-9-D-7  → A-09-D-7
 *   A-10-D-7 → A-10-D-7
 *   A-100-D-9→ A-100-D-9
 */
export const formatBinLocation = (val: string): string => {
  if (!val) return '';
  const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // BB rule: BB followed by digits, no hyphen
  if (clean.startsWith('BB')) {
    const digits = clean.slice(2);
    return digits ? `BB${digits}` : 'BB';
  }

  const match = clean.match(/^([A-Z]+)(\d*)([A-Z]*)(\d*)$/);
  if (!match) return clean;

  const [, zone, aisle, shelf, level] = match;
  let result = zone;

  if (aisle) {
    const parsedAisle = parseInt(aisle, 10);
    if (!isNaN(parsedAisle)) {
      if (parsedAisle >= 1 && parsedAisle <= 9) {
        result += `-0${parsedAisle}`;
      } else {
        result += `-${parsedAisle}`;
      }
    } else {
      result += `-${aisle}`;
    }
  }

  if (shelf) result += `-${shelf}`;
  if (level) result += `-${level}`;

  return result;
};

/**
 * BB (BIGBASKET) FORMATTER
 * 
 * Rules:
 * - Output: BB + digits. NO hyphen. NO spaces.
 * - bb12345 → BB12345
 * - BB999999 → BB999999
 */
export const formatBB = (val: string): string => {
  if (!val) return '';
  const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!clean.startsWith('BB')) return clean;
  const digits = clean.slice(2).replace(/[^0-9]/g, '');
  return digits ? `BB${digits}` : 'BB';
};

/**
 * EMPTY BIN FORMATTER
 * 
 * Rules:
 * - Exactly 3 letters + hyphen + digits (no zero padding)
 * - abc-1 → ABC-1
 * - abc-100 → ABC-100
 */
export const formatEmptyBin = (val: string): string => {
  if (!val) return '';
  const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length <= 3) return clean;
  const letters = clean.slice(0, 3);
  const digits = clean.slice(3);
  return `${letters}-${digits}`;
};

/** Validates empty bin: exactly 3 uppercase letters + hyphen + 1 or more digits */
export const validateEmptyBin = (val: string): { valid: boolean; error?: string } => {
  if (!val || val.trim() === '') return { valid: false, error: 'Input cannot be empty.' };
  const regex = /^[A-Z]{3}-\d+$/;
  if (!regex.test(val)) return { valid: false, error: 'Expected format: ABC-123 (3 letters + hyphen + digits)' };
  return { valid: true };
};

/** Validates BB: BB followed by 1 or more digits */
export const validateBB = (val: string): { valid: boolean; error?: string } => {
  if (!val || val.trim() === '') return { valid: false, error: 'Input cannot be empty.' };
  const regex = /^BB\d+$/;
  if (!regex.test(val)) return { valid: false, error: 'Expected format: BB + digits (e.g. BB12345)' };
  return { valid: true };
};

/** Validates bin location */
export const validateBin = (val: string): { valid: boolean; error?: string } => {
  if (!val || val.trim() === '') return { valid: false, error: 'Input cannot be empty.' };
  const regex = /^[A-Z]+-\d+-[A-Z]+-\d+$/;
  if (!regex.test(val)) return { valid: false, error: 'Expected format: A-01-D-5' };
  return { valid: true };
};

/** Detects input type from raw string */
export const detectInputType = (val: string): WmsInputType => {
  if (!val || val.trim() === '') return 'empty';
  const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (/^\d+$/.test(clean)) return 'product';
  if (clean.startsWith('BB') && /^BB\d+$/.test(clean)) return 'bb';
  if (/^[A-Z]{3}\d+$/.test(clean)) return 'empty_bin';
  return 'bin';
};
