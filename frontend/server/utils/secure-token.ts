import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";

const RESET_PREFIX = "reset:";
const VERIFY_PREFIX = "verify:";

export function generateSecretToken(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return encodeBase32LowerCaseNoPadding(bytes);
}

export function hashSecretToken(token: string): string {
    return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export function resetTokenHash(rawToken: string): string {
    return `${RESET_PREFIX}${hashSecretToken(rawToken)}`;
}

export function verifyTokenHash(rawToken: string): string {
    return `${VERIFY_PREFIX}${hashSecretToken(rawToken)}`;
}

export const EMAIL_VERIFICATION_TTL_MS = 1000 * 60 * 60 * 48;
export const PASSWORD_RESET_TTL_MS = 1000 * 60 * 60 * 2;
