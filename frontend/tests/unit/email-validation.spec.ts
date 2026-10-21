import { describe, it, expect } from 'vitest';

function isValidEmail(email: string): boolean {
    if (typeof email !== "string" || email.length > 254 || email.length < 3) {
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

describe('Email Validation', () => {
    it('should accept valid email addresses', () => {
        expect(isValidEmail('user@example.com')).toBe(true);
        expect(isValidEmail('test.user@example.co.uk')).toBe(true);
        expect(isValidEmail('user+tag@example.com')).toBe(true);
        expect(isValidEmail('user123@example-domain.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
        expect(isValidEmail('invalid')).toBe(false);
        expect(isValidEmail('@example.com')).toBe(false);
        expect(isValidEmail('user@')).toBe(false);
        expect(isValidEmail('user@example')).toBe(false);
        expect(isValidEmail('user example.com')).toBe(false);
        expect(isValidEmail('')).toBe(false);
    });

    it('should reject emails that are too short or too long', () => {
        expect(isValidEmail('ab')).toBe(false);
        expect(isValidEmail('a@b.c')).toBe(true);
        expect(isValidEmail('a'.repeat(250) + '@example.com')).toBe(false);
    });

    it('should handle edge cases', () => {
        expect(isValidEmail('user@sub.example.com')).toBe(true);
        expect(isValidEmail('user.name@example.com')).toBe(true);
    });
});

