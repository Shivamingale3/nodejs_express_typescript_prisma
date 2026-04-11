/**
 * Branded type for ULID strings - provides type safety for ID fields
 * ULID format: 26 characters, Crockford's Base32 (e.g., "01ARZ3NDEKTSV4RRFFQ69G5FAV")
 */
export type ULID = string & { readonly __brand: 'ULID' };

export interface User {
  userId: ULID;
  email: string;
  password: string;
  name?: string | null;
  role?: string;
}

/**
 * Type guard to validate a string is a valid ULID
 * Use this when parsing external ULID input
 */
export function isULID(value: string): value is ULID {
  if (!value || typeof value !== 'string') return false;
  if (value.length !== 26) return false;
  return /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/i.test(value);
}

/**
 * Assert a string is a valid ULID, throws if not
 */
export function assertULID(value: string): ULID {
  if (!isULID(value)) {
    throw new Error(`Invalid ULID format: ${value}`);
  }
  return value;
}
