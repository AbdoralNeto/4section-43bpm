
/**
 * Auth utilities using the native Web Crypto API (PBKDF2).
 * No external dependencies required.
 */

const ITERATIONS = 100_000;
const HASH_ALG = 'SHA-256';
const KEY_LENGTH = 256;

function buf2hex(buf: ArrayBuffer): string {
    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function hex2buf(hex: string): Uint8Array {
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return arr;
}

/**
 * Hash a plain-text password with PBKDF2 + random salt.
 * Returns a string in the format: "salt:hash"
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );
    const derived = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: HASH_ALG },
        keyMaterial,
        KEY_LENGTH
    );
    return `${buf2hex(salt.buffer)}:${buf2hex(derived)}`;
}

/**
 * Verify a plain-text password against a stored "salt:hash" string.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
    const [saltHex, hashHex] = stored.split(':');
    if (!saltHex || !hashHex) return false;
    const salt = hex2buf(saltHex);
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );
    const derived = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: HASH_ALG },
        keyMaterial,
        KEY_LENGTH
    );
    return buf2hex(derived) === hashHex;
}
