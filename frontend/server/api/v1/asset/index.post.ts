import { randomUUID } from "crypto";

import type { Asset } from "~~/server/database/schemas/assets.schema";

import { storage } from "~~/server/storage";
import { saveAssetToDB } from "~~/server/services/asset";
import { generateAssetStorageKey } from "~~/server/storage/keys";

interface AssetFile {
    fileName: string;
    base64: string;
}

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { files }: { files: AssetFile[] } = await readBody(event);
    if (!files) {
        throw createError({ statusCode: 400, statusMessage: 'Files are required' });
    }
    
    try {
        let savedAssets: Asset[] = [];
        for (const { fileName, base64 } of files) {
            const assetId = randomUUID();
            const assetStorageKey = generateAssetStorageKey(user.id, 'OBJECT', assetId);

            const assetBuffer = Buffer.from(base64, 'base64');
            await storage.put(assetStorageKey, assetBuffer, 'image/png');

            const asset = await saveAssetToDB({
                userId: user.id,
                name: fileName,
                type: 'OBJECT',
                storageKey: assetStorageKey,
            });
            savedAssets.push(asset);
        };

        return {
            assets: savedAssets,
        }
    } catch (error) {
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});