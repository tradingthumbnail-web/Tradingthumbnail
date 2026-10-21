import { eq } from "drizzle-orm";

import { db } from "~~/server/database";
import { userTable } from "~~/server/database/schemas/user.schema";
import { productTable } from "~~/server/database/schemas/product.schema";
import { log } from "~~/server/utils/logger";

type BundleMetadata = {
    credits?: number;
    avatarCredits?: number;
};

export async function processBundleProduct({ 
    userId, 
    productId 
}: { 
    userId: string; 
    productId: string;
}) {
    try {
        const product = await db.query.productTable.findFirst({
            where: eq(productTable.id, productId),
        });

        if (!product) {
            throw createError({
                statusCode: 400,
                statusMessage: "Product not found"
            });
        }

        const user = await db.query.userTable.findFirst({
            where: eq(userTable.id, userId)
        });

        if (!user) {
            throw createError({
                statusCode: 400,
                statusMessage: "User not found"
            });
        }

        const bundleMetadata = product.metadata as BundleMetadata;
        const creditsToAdd = bundleMetadata?.credits ?? 0;
        const avatarCreditsToAdd = bundleMetadata?.avatarCredits ?? 0;

        if (creditsToAdd === 0 && avatarCreditsToAdd === 0) {
            log.warn("Bundle product has no credits to grant", { productId, userId });
            return user;
        }

        const updatedUser = await db.update(userTable).set({
            credit: user.credit + creditsToAdd,
            avatarCredit: user.avatarCredit + avatarCreditsToAdd,
            updatedAt: new Date()
        }).where(eq(userTable.id, userId)).returning();

        log.info("Bundle product processed", { 
            userId, 
            productId, 
            creditsAdded: creditsToAdd, 
            avatarCreditsAdded: avatarCreditsToAdd 
        });

        return updatedUser[0];
    } catch (error) {
        log.error("Error processing bundle product", error, { userId, productId });
        throw error;
    }
};