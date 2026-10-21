import { validateSessionBySessionId } from "~~/server/utils/auth";
import { log } from "~~/server/utils/logger";

import type { User } from "~~/server/database/schemas/user.schema";
import type { Session } from "~~/server/database/schemas/session.schema";
import type { Subscription } from "~~/server/database/schemas/subscription.schema";
import type { Tier } from "~~/server/database/schemas/tier.schema";

export default defineEventHandler(async (event) => {
	if (event.method === 'OPTIONS') {
		setResponseStatus(event, 204);
		return '';
	}

	try {
		if (event.method !== "GET") {
			const originHeader = getHeader(event, "Origin") ?? null;
			const hostHeader = getHeader(event, "Host") ?? null;
		};

		const sessionToken = getCookie(event, "auth_session") ?? null;
		if (!sessionToken) {
			log.debug("Session token not found in cookie");
			deleteCookie(event, "auth_session");
			event.context.session = null;
			event.context.user = null;
			event.context.tier = null;
			event.context.subscription = null;
			return;
		}

		const { session, user, tier, subscription } = await validateSessionBySessionId(sessionToken);
		
		if (!session || !user) {
			log.warn("Session not found in database, deleting cookie", { sessionToken });
			deleteCookie(event, "auth_session");
			event.context.tier = null;
			event.context.user = null;
			event.context.subscription = null;
			return;
		}
		event.context.session = session;
		event.context.tier = tier;
		event.context.subscription = subscription;
		event.context.user = {
			id: user?.id,
			name: user?.name,
			username: user?.username,
			email: user?.email,
			stripeCustomerId: user?.stripeCustomerId,
			polarCustomerId: user?.polarCustomerId,
			role: user?.role,
			credit: user?.credit,
			avatarCredit: user?.avatarCredit,
			createdAt: user?.createdAt,
			updatedAt: user?.updatedAt,
			lastSignedInAt: user?.lastSignedInAt,
			validationDate: user?.validationDate,
			notifications: user?.notifications,
		};
	} catch (error) {
		log.error('Auth middleware error', error);
		throw error;
	}
});

declare module "h3" {
	interface H3EventContext {
		user: Partial<User> | null;
		session: Session | null;
		tier: Tier | null;
		subscription: Subscription | null;
	}
}