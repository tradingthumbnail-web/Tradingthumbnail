export function isValidEmail(email: unknown): email is string {
    if (typeof email !== 'string' || email.length > 254 || email.length < 3) {
        return false;
    }
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
