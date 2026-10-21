import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));

describe('feedback recipient', () => {
    it('does not send production feedback to the former-owner address', () => {
        const source = readFileSync(
            resolve(here, '../../server/api/v1/user/send-feedback.post.ts'),
            'utf8',
        );
        expect(source).toContain('CLICKLAB_SUPPORT_EMAIL');
        expect(source).not.toContain('pol@minerva-ds.com');
        expect(source).not.toContain('minerva-ds.com');
    });
});
