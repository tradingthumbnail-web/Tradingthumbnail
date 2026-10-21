import { desc, eq } from "drizzle-orm";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";

import { db } from "~~/server/database";
import { sessionTable, type Session } from "~~/server/database/schemas/session.schema";
import type { User } from "~~/server/database/schemas/user.schema";
import type { Tier } from "~~/server/database/schemas/tier.schema";
import { subscriptionTable, type Subscription } from "~~/server/database/schemas/subscription.schema";

export function generateSessionToken(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const token = encodeBase32LowerCaseNoPadding(bytes);
    return token;
}

export async function createSession(token: string, userId: string): Promise<Session> {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const session: Session = {
        id: sessionId,
        userId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    };
    await db.insert(sessionTable).values(session);
    return session;
};

export async function validateSessionBySessionId(sessionId: string): Promise<SessionValidationResult> {
    const session = await db.query.sessionTable.findFirst({
        where: eq(sessionTable.id, sessionId),
        with: {
            user: {
                with: {
                    subscriptions: {
                        with: {
                            tier: true,
                        },
                        orderBy: desc(subscriptionTable.createdAt),
                        limit: 1,
                    }
                }
            }
        },
    });
    
    if (!session) {
        return { session: null, user: null, tier: null, subscription: null };
    };
    if (Date.now() >= session.expiresAt.getTime()) {
        await db.delete(sessionTable).where(eq(sessionTable.id, session.id));
        return { session: null, user: null, tier: null, subscription: null };
    }
    if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
        session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
        await db.update(sessionTable).set({ expiresAt: session.expiresAt }).where(eq(sessionTable.id, session.id));
    }
    
    // Get the most recent subscription
    const latestSubscription = session.user.subscriptions?.[0] || null;
    
    // Only consider ACTIVE subscriptions for tier access
    const isActive = latestSubscription?.status === 'ACTIVE';
    const tier = (isActive && latestSubscription?.tier) ? latestSubscription.tier : null;
    
    return { 
        session, 
        user: session.user, 
        tier,
        subscription: latestSubscription 
    };
}

export async function invalidateSession(sessionId: string): Promise<void> {
    await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
};

export async function invalidateSessionByUserId(userId: string): Promise<void> {
    await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
};

export async function encodeUuid(uuid: string): Promise<string> {
	const hash = sha256(new TextEncoder().encode(uuid));
	return encodeHexLowerCase(hash);
}

export async function verifyUuid(uuid: string, hashedUuid: string): Promise<boolean> {
	const expectedHash = await encodeUuid(uuid);
	return expectedHash === hashedUuid;
}

export type SessionValidationResult =
    | { session: Session; user: User; tier: Tier | null; subscription: Subscription | null }
    | { session: null; user: null; tier: null; subscription: null };