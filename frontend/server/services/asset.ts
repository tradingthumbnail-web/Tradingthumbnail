import { db } from "~~/server/database";

import { assetTable, type AssetType } from "~~/server/database/schemas/assets.schema";

/**
 * Saves an asset to the database
 * @param param0 
 * @returns 
 */
export const saveAssetToDB = async ({
    userId,
    name,
    type,
    storageKey,
}: {
    userId: string;
    name: string;
    type: AssetType;
    storageKey: string;
}) => {
    try {
        const [asset] = await db.insert(assetTable).values({
            userId,
            name,
            type,
            storageKey,
        }).returning();
        return asset;
    } catch (error) {
        console.error("-x- Error saving asset to database", error);
        throw error;
    }   
}