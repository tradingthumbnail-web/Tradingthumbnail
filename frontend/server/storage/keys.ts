import { type ImageType } from "~~/shared/enums/image-types";
import { AssetType } from "../database/schemas/assets.schema";

const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';

/**
 * Generates a storage key for an avatar
 * @param userId - The user ID
 * @param avatarId - The avatar ID
 * @returns 
 */
export const generateAvatarStorageKey = (userId: string, avatarId: string) => {
    return `${userId}/avatars/${environment}/${avatarId}`;
};

/**
 * Generates a storage key for an avatar weights
 * @param userId - The user ID
 * @param avatarId - The avatar ID
 * @param storageKey - Optional persisted avatar storage key from the database
 * @returns 
 */
export const generateAvatarWeightsKey = (userId: string, avatarId: string, storageKey?: string | null) => {
    const baseKey = storageKey && storageKey.trim().length > 0
        ? storageKey.trim().replace(/\/+$/, '')
        : generateAvatarStorageKey(userId, avatarId);
    return `${baseKey}/model.safetensors`;
};

/**
 * Generates a storage key for an avatar training image
 * @param userId - The user ID
 * @param avatarId - The avatar ID
 * @param imageIndex - The image index
 * @returns 
 */
export const generateAvatarTrainingImageKey = (userId: string, avatarId: string, imageIndex: string) => {
    return `${userId}/avatars/${environment}/${avatarId}/training-images/${imageIndex}.jpg`;
};

/**
 * Generates a storage key for an image
 * @param userId - The user ID
 * @param imageType - The type of image
 * @param imageId - The image ID
 * @returns 
 */
export const generateImageStorageKey = (userId: string, imageType: ImageType, imageId: string) => {
    return `${userId}/images/${environment}/${imageType}/${imageId}.png`;
};

/**
 * Generates a storage key for an asset
 * @param userId - The user ID
 * @param assetType - The type of asset
 * @param assetId - The asset ID
 * @returns 
 */
export const generateAssetStorageKey = (userId: string, assetType: AssetType, assetId: string) => {
    return `${userId}/assets/${environment}/${assetType}/${assetId}.png`;
};

/**
 * Generates a storage key for a style
 * @param styleId - The style ID
 * @returns 
 */
export const generateStyleStorageKey = (styleId: string) => {
    return `styles/${environment}/${styleId}.png`;
};