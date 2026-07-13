/**
 * Standardized Bin Location and Empty Bin Formatter for Thor WMS.
 */

export type WmsInputType = 'product' | 'bin' | 'empty_bin' | 'empty';

/**
 * Rules for Bin Location:
 * 1. Automatically uppercase letters.
 * 2. Ignore spaces, slashes and hyphens while typing.
 * 3. Insert hyphens automatically.
 * 4. Add leading zero ONLY to the FIRST numeric group (aisle number).
 * 5. Add leading zero ONLY if the aisle number is between 1 and 9.
 * 6. Never add a leading zero if the aisle number is already two or more digits.
 * 7. Never modify the LAST numeric group (level).
 */
export const formatBinLocation = (val: string): string => {
  if (!val) return '';
  const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Special formatting rule only for the BB location type
  if (clean.startsWith('BB')) {
    const digits = clean.slice(2);
    return digits ? `BB-${digits}` : 'BB';
  }

  const match = clean.match(/^([A-Z]+)(\d*)([A-Z]*)(\d*)$/);
  if (!match) return clean;

  const [_, zone, aisle, shelf, level] = match;
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

  if (shelf) {
    result += `-${shelf}`;
  }

  if (level) {
    result += `-${level}`;
  }

  return result;
};

/**
 * Rules for Empty Bin:
 * 1. First part must contain exactly 3 alphabetic characters.
 * 2. Convert lowercase to uppercase automatically.
 * 3. Automatically insert '-' after the third letter.
 * 4. The second part accepts unlimited digits.
 * 5. Ignore spaces and special characters.
 * 6. No leading zero logic is needed.
 */
export const formatEmptyBin = (val: string): string => {
  if (!val) return '';
  const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length <= 3) {
    return clean;
  }
  const letters = clean.slice(0, 3);
  const digits = clean.slice(3);
  return `${letters}-${digits}`;
};

/**
 * Automatically classifies typed/scanned strings.
 */
export const detectInputType = (val: string): WmsInputType => {
  if (!val || val.trim() === '') {
    return 'empty';
  }
  const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // 1. Product: Only numbers
  const isNumOnly = /^[0-9]+$/.test(clean);
  if (isNumOnly) {
    return 'product';
  }

  // 2. Empty Bin: Exactly 3 letters followed by optional digits
  const isEmptyBinPattern = /^[A-Z]{3}\d*$/.test(clean);
  if (isEmptyBinPattern) {
    return 'empty_bin';
  }

  // 3. Otherwise: Bin Location
  return 'bin';
};

/**
 * Returns type and standardized format.
 */
export const formatSmartInput = (val: string): { type: WmsInputType, formatted: string } => {
  const type = detectInputType(val);
  if (type === 'empty') {
    return { type, formatted: '' };
  }
  if (type === 'product') {
    return { type, formatted: val.replace(/[^0-9]/g, '') };
  }
  if (type === 'empty_bin') {
    return { type, formatted: formatEmptyBin(val) };
  }
  return { type, formatted: formatBinLocation(val) };
};
