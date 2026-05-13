import { customAlphabet } from 'nanoid';

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoid = customAlphabet(alphabet, 7);

export function generatePrefixedId(prefix: string): string {
  return `${prefix}-${nanoid()}`;
}
