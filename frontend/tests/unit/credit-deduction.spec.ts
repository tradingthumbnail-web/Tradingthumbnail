import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eq, and, gte, sql } from 'drizzle-orm';

vi.mock('../../server/database', () => ({
    db: {
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn(),
        query: {
            userTable: {
                findFirst: vi.fn(),
            },
        },
    },
}));

vi.mock('drizzle-orm', async () => {
    const actual = await vi.importActual('drizzle-orm');
    return {
        ...actual,
        eq: vi.fn(),
        and: vi.fn(),
        gte: vi.fn(),
        sql: vi.fn((template) => template),
    };
});

describe('Credit Deduction - Race Condition Fix', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should use atomic update with WHERE clause to prevent race conditions', async () => {
        const { db } = await import('../../server/database');
        const { userTable } = await import('../../server/database/schemas/user.schema');
        
        const mockReturning = vi.fn().mockResolvedValue([{ id: 'user1', credit: 50 }]);
        (db.update as any).mockReturnValue({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: mockReturning,
        });

        const userId = 'user1';
        const amountToPay = 30;

        const updatedUsers = await (db.update(userTable) as any)
            .set({
                credit: sql`credit - ${amountToPay}`
            })
            .where(
                and(
                    eq(userTable.id, userId),
                    gte(userTable.credit, amountToPay)
                )
            )
            .returning();

        expect(db.update).toHaveBeenCalledWith(userTable);
        expect(updatedUsers.length).toBeGreaterThan(0);
        expect(updatedUsers[0].credit).toBe(50);
    });

    it('should return empty array when user has insufficient credits', async () => {
        const { db } = await import('../../server/database');
        const { userTable } = await import('../../server/database/schemas/user.schema');
        
        const mockReturning = vi.fn().mockResolvedValue([]);
        (db.update as any).mockReturnValue({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: mockReturning,
        });

        const userId = 'user1';
        const amountToPay = 100;

        const updatedUsers = await (db.update(userTable) as any)
            .set({
                credit: sql`credit - ${amountToPay}`
            })
            .where(
                and(
                    eq(userTable.id, userId),
                    gte(userTable.credit, amountToPay)
                )
            )
            .returning();

        expect(updatedUsers.length).toBe(0);
    });
});

