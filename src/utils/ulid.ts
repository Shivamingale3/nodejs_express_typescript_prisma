/**
 * ULID (Universally Unique Lexicographically Sortable Identifier) utility
 *
 * ULID is a 26-character string using Crockford's Base32 encoding:
 * - First 10 characters: timestamp (milliseconds since Unix epoch 2010-01-01)
 * - Last 16 characters:  random data
 *
 * Properties:
 * - Lexicographically sortable (time-based ordering)
 * - 128-bit entropy (80 bits random + 48 bits timestamp)
 * - URL-safe characters (no special chars)
 * - 26 chars vs UUID's 36 chars (more compact)
 * - Millisecond precision (1.21e+24 unique ULIDs per millisecond)
 * - Monotonic within same millisecond (last random bit incremented)
 */

import { ulid, monotonicUlid } from 'ulid';

const ULID_EPOCH = 1288834974657;

/**
 * Generate a new ULID string
 * @returns 26-character ULID string (e.g., "01ARZ3NDEKTSV4RRFFQ69G5FAV")
 */
export const generateUlid = (): string => ulid();

/**
 * Generate a monotonic ULID (safe for concurrent generation within same ms)
 * Guarantees strictly increasing values when called multiple times in same ms
 * @returns 26-character monotonic ULID string
 */
export const generateMonotonicUlid = (): string => monotonicUlid();

/**
 * Check if a string is a valid ULID
 * @param value - String to validate
 * @returns true if valid ULID format
 */
export const isValidUlid = (value: string): boolean => {
  if (!value || typeof value !== 'string') return false;
  if (value.length !== 26) return false;
  // Crockford's Base32 alphabet: 01I2345679ABCDEFGHJKMNPQRSTVWXYZ (no I, L, O, U)
  return /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/i.test(value);
};

/**
 * Extract timestamp from a ULID
 * @param ulidStr - Valid ULID string
 * @returns Date object representing when the ULID was generated
 */
export const extractTimestamp = (ulidStr: string): Date => {
  if (!isValidUlid(ulidStr)) {
    throw new Error(`Invalid ULID: ${ulidStr}`);
  }
  // Decode timestamp from first 10 chars
  const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let timestamp = 0;

  for (let i = 0; i < 10; i++) {
    const charIndex = ENCODING.indexOf(ulidStr[i].toUpperCase());
    timestamp = timestamp * 32 + charIndex;
  }

  return new Date(timestamp + ULID_EPOCH);
};

/**
 * Compare two ULIDs lexicographically (returns same order as their timestamps)
 * @param a - First ULID
 * @param b - Second ULID
 * @returns -1 if a < b, 1 if a > b, 0 if equal
 */
export const compareUlid = (a: string, b: string): number => {
  return a.localeCompare(b);
};

export default {
  generateUlid,
  generateMonotonicUlid,
  isValidUlid,
  extractTimestamp,
  compareUlid,
};
