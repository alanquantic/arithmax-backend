import * as crypto from 'crypto';

const bcrypt: {
  hash: (data: string, saltOrRounds: number) => Promise<string>;
  compare: (data: string, encrypted: string) => Promise<boolean>;
} = require('bcryptjs');

const BCRYPT_ROUNDS = 12;

// Alfabeto phpass (WordPress portable hashes)
const ITOA64 =
  './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export type PasswordCheck = {
  valid: boolean;
  // true cuando el hash almacenado usa un formato legacy de WordPress y
  // debe re-hashearse a bcrypt tras un login exitoso
  needsRehash: boolean;
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/**
 * Verifica una contraseña contra un hash que puede venir en tres formatos:
 *  - bcrypt propio ($2a$/$2b$/$2y$)
 *  - WordPress >= 6.8 ($wp$2y$...): bcrypt sobre base64(HMAC-SHA384(trim(pass), 'wp-sha384'))
 *  - phpass portable ($P$/$H$): esquema md5 iterado de WordPress clasico
 */
export async function verifyPassword(
  plain: string,
  storedHash: string
): Promise<PasswordCheck> {
  if (!plain || !storedHash) {
    return { valid: false, needsRehash: false };
  }

  if (storedHash.startsWith('$wp$')) {
    const preHashed = wordPressPreHash(plain);
    const bcryptHash = normalizeBcryptPrefix(storedHash.slice(3));
    const valid = await bcrypt.compare(preHashed, bcryptHash);
    return { valid, needsRehash: valid };
  }

  if (storedHash.startsWith('$P$') || storedHash.startsWith('$H$')) {
    const valid = phpassVerify(plain, storedHash);
    return { valid, needsRehash: valid };
  }

  if (/^\$2[abxy]\$/.test(storedHash)) {
    const valid = await bcrypt.compare(plain, normalizeBcryptPrefix(storedHash));
    return { valid, needsRehash: false };
  }

  return { valid: false, needsRehash: false };
}

// WordPress 6.8+ pre-hashea la contraseña antes de bcrypt para evitar el limite
// de 72 bytes: base64(hmac_sha384(trim(password), 'wp-sha384'))
function wordPressPreHash(plain: string): string {
  return crypto
    .createHmac('sha384', 'wp-sha384')
    .update(plain.trim())
    .digest('base64');
}

// bcryptjs no reconoce las variantes $2y$/$2x$ de PHP; son equivalentes a $2a$
function normalizeBcryptPrefix(hash: string): string {
  return hash.replace(/^\$2[xy]\$/, '$2a$');
}

function phpassVerify(plain: string, storedHash: string): boolean {
  if (storedHash.length !== 34) {
    return false;
  }

  const countLog2 = ITOA64.indexOf(storedHash[3]);
  if (countLog2 < 7 || countLog2 > 30) {
    return false;
  }

  const salt = storedHash.substring(4, 12);
  if (salt.length !== 8) {
    return false;
  }

  const password = Buffer.from(plain, 'utf8');
  let hash = md5(Buffer.concat([Buffer.from(salt, 'utf8'), password]));
  let count = 1 << countLog2;
  while (count--) {
    hash = md5(Buffer.concat([hash, password]));
  }

  const computed = storedHash.substring(0, 12) + phpassEncode64(hash, 16);
  return timingSafeEqualStr(computed, storedHash);
}

function md5(data: Buffer): Buffer {
  return crypto.createHash('md5').update(data).digest();
}

function phpassEncode64(input: Buffer, count: number): string {
  let output = '';
  let i = 0;

  while (i < count) {
    let value = input[i++];
    output += ITOA64[value & 0x3f];
    if (i < count) {
      value |= input[i] << 8;
    }
    output += ITOA64[(value >> 6) & 0x3f];
    if (i++ >= count) {
      break;
    }
    if (i < count) {
      value |= input[i] << 16;
    }
    output += ITOA64[(value >> 12) & 0x3f];
    if (i++ >= count) {
      break;
    }
    output += ITOA64[(value >> 18) & 0x3f];
  }

  return output;
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

// Contraseña temporal legible: sin caracteres ambiguos (0/O, 1/l/I)
const TEMP_PASSWORD_ALPHABET =
  'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateTempPassword(length = 12): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += TEMP_PASSWORD_ALPHABET[crypto.randomInt(TEMP_PASSWORD_ALPHABET.length)];
  }
  return out;
}
