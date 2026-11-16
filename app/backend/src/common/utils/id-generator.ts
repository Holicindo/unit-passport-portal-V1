import { customAlphabet } from 'nanoid';

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoid = customAlphabet(alphabet, 7);

const numericAlphabet = '0123456789';
const nanoidNumeric = customAlphabet(numericAlphabet, 4);

export function generatePrefixedId(prefix: string): string {
  if (prefix === 'ID') {
    // Format nomor pendek berbasis angka murni: ID_XXXX (e.g., ID_2168, ID_2169)
    return `ID_${nanoidNumeric()}`;
  }
  return `${prefix}-${nanoid()}`;
}

export function generateNumericCallId(): string {
  return nanoidNumeric();
}
