import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const PREFIX = "scrypt$";
const KEY_LEN = 64;

/** Indica se o valor armazenado já é hash (novos usuários / senha alterada). */
export function isStoredPasswordHash(stored: string): boolean {
  return stored.startsWith(PREFIX);
}

export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, KEY_LEN);
  return `${PREFIX}${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  if (!isStoredPasswordHash(stored)) {
    return stored === plain;
  }
  const rest = stored.slice(PREFIX.length);
  const firstSep = rest.indexOf("$");
  if (firstSep <= 0) return false;
  const saltB64 = rest.slice(0, firstSep);
  const hashB64 = rest.slice(firstSep + 1);
  try {
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");
    const actual = scryptSync(plain, salt, expected.length);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
