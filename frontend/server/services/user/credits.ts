import { and, eq, gte, sql } from "drizzle-orm";

import { db } from "~~/server/database";
import { userTable } from "~~/server/database/schemas/user.schema";

export type CreditCharge = {
    amount: number;
    refund: () => Promise<void>;
};

function assertCreditAmount(amount: number): number {
    if (!Number.isFinite(amount) || amount < 0) {
        throw createError({ statusCode: 400, statusMessage: "Invalid credit amount" });
    }
    return Math.ceil(amount);
}

export async function deductUserCredits(userId: string, amount: number): Promise<CreditCharge> {
    const credits = assertCreditAmount(amount);
    if (credits === 0) {
        return { amount: 0, refund: async () => {} };
    }

    const updatedUsers = await db.update(userTable)
        .set({
            credit: sql`${userTable.credit} - ${credits}`,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(userTable.id, userId),
                gte(userTable.credit, credits),
            ),
        )
        .returning({ id: userTable.id, credit: userTable.credit });

    if (updatedUsers.length === 0) {
        throw createError({
            statusCode: 402,
            statusMessage: "User does not have enough credit",
        });
    }

    let refunded = false;
    return {
        amount: credits,
        refund: async () => {
            if (refunded || credits === 0) return;
            refunded = true;
            await db.update(userTable)
                .set({
                    credit: sql`${userTable.credit} + ${credits}`,
                    updatedAt: new Date(),
                })
                .where(eq(userTable.id, userId));
        },
    };
}

export async function runChargedWork<T>(userId: string, amount: number, work: () => Promise<T>): Promise<T> {
    const charge = await deductUserCredits(userId, amount);
    try {
        return await work();
    } catch (error) {
        await charge.refund();
        throw error;
    }
}
