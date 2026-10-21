import { eq } from "drizzle-orm";

import { db } from "~~/server/database";
import { tierTable } from "~~/server/database/schemas/tier.schema";
import { createPolarClient } from "~~/server/services/polar/client";
import { getPolarProductIdForInterval } from "~~/server/services/polar/catalog";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.email || !user.id) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const { productId, priceId, tierId, interval } = await readBody(event);
    if (!tierId) {
        throw createError({ statusCode: 400, statusMessage: "Bad Request" });
    }

    const billingInterval = interval === "year" ? "year" : "month";
    const tier = await db.query.tierTable.findFirst({
        where: eq(tierTable.id, Number(tierId)),
    });
    if (!tier) {
        throw createError({ statusCode: 400, statusMessage: "Tier not found" });
    }

    const polarProductId = getPolarProductIdForInterval(tier, billingInterval);
    if (!polarProductId) {
        throw createError({ statusCode: 503, statusMessage: "Polar product is not configured for this plan" });
    }

    const config = useRuntimeConfig(event);
    const appUrl = config.public.appUrl;
    if (!appUrl) {
        throw createError({ statusCode: 500, statusMessage: "App URL is not configured" });
    }

    try {
        const polar = createPolarClient(event);
        const checkout = await polar.checkouts.create({
            products: [polarProductId],
            customerEmail: user.email,
            customerName: user.name,
            externalCustomerId: user.id,
            allowDiscountCodes: true,
            successUrl: `${appUrl}/settings/plans/success?tierId=${tier.id}&userId=${user.id}&checkout_id={CHECKOUT_ID}`,
            returnUrl: `${appUrl}/settings/plans/cancel`,
            metadata: {
                userId: user.id,
                tierId: String(tier.id),
                interval: billingInterval,
                priceId: priceId ?? "",
                productId: productId ?? polarProductId,
            },
        });

        if (!checkout.url) {
            throw createError({ statusCode: 500, statusMessage: "Failed to create Polar checkout session" });
        }

        return { checkoutUrl: checkout.url };
    } catch (error: any) {
        if (error?.statusCode) throw error;
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: "Internal Server Error" });
    }
});
