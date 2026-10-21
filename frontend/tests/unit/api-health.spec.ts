import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sql } from 'drizzle-orm';

const mockExecute = vi.fn();
const mockSetResponseStatus = vi.fn();

vi.mock('h3', () => ({
    defineEventHandler: vi.fn((handler: any) => handler),
}));

Object.assign(globalThis, {
    defineEventHandler: vi.fn((handler: any) => handler),
    setResponseStatus: mockSetResponseStatus,
});

vi.mock('~~/server/database', () => ({
    db: {
        execute: (...args: unknown[]) => mockExecute(...args),
    },
}));

describe('API: health', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns healthy when the database responds', async () => {
        mockExecute.mockResolvedValue([{ '?column?': 1 }]);
        const handler = (await import('~~/server/api/health.get')).default;
        const result = await handler({} as any);

        expect(mockExecute).toHaveBeenCalled();
        const query = mockExecute.mock.calls[0][0];
        expect(query).toEqual(sql`SELECT 1`);
        expect(result.status).toBe('healthy');
        expect(result.checks.database).toBe(true);
        expect(mockSetResponseStatus).toHaveBeenCalledWith({}, 200);
    });

    it('returns unhealthy when the database check fails', async () => {
        mockExecute.mockRejectedValue(new Error('connection refused'));
        const handler = (await import('~~/server/api/health.get')).default;
        const result = await handler({} as any);

        expect(result.status).toBe('unhealthy');
        expect(result.checks.database).toBe(false);
        expect(mockSetResponseStatus).toHaveBeenCalledWith({}, 503);
    });
});
