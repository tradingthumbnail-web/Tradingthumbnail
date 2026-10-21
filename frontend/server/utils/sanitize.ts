export function sanitizeHtml(input: string | null | undefined): string {
    if (!input) return '';
    
    return String(input)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

export function sanitizeText(input: string | null | undefined): string {
    if (!input) return '';
    return String(input).trim();
}

