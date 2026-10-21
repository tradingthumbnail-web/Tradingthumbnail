import { removeBackground } from '@imgly/background-removal';
import type { Config } from '@imgly/background-removal';

export const useBackgroundRemoval = () => {
    const isRemoving = ref(false);
    
    const removeBackgroundFromImage = async (sourceImageUrl: string, assetId: string) => {
        let blobUrl: string | null = null;
        
        try {
            isRemoving.value = true;
            
            // Step 1: Fetch the image as a blob to avoid JSON parse errors
            const response = await fetch(sourceImageUrl);
            if (!response.ok) throw new Error('Failed to fetch source image');
            const sourceBlob = await response.blob();
            
            console.log('Source blob type:', sourceBlob.type, 'Size:', sourceBlob.size);
            
            // Step 2: Validate blob is an image
            if (!sourceBlob.type.startsWith('image/')) {
                throw new Error(`Invalid image format: ${sourceBlob.type}`);
            }
            
            // Step 3: Convert blob to data URL instead of blob URL
            // Some browsers have issues with blob URLs in workers
            const sourceDataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(sourceBlob);
            });
            
            // Step 4: Configure @imgly/background-removal
            const runtimeConfig = useRuntimeConfig();
            const config: Config = {
                publicPath: `${runtimeConfig.public.appUrl}/models/background-removal/`,
                model: "isnet_quint8",
                debug: true,
            };

            // Step 5: Remove background using the data URL
            const resultBlob = await removeBackground(sourceDataUrl, config);

            // Step 6: Convert result blob to data URL for server-side fetch compatibility
            const resultDataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(resultBlob);
            });

            // Step 6: Save as new image
            const newSavedImage = await $fetch(`/api/v1/asset/${assetId}/save-removed-bg`, {
                method: 'POST',
                body: {
                    assedSrc: resultDataUrl,
                },
            });

            return newSavedImage;
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            // Clean up blob URL to prevent memory leaks
            if (blobUrl) URL.revokeObjectURL(blobUrl);
            isRemoving.value = false;
        }
    }

    return { isRemoving, removeBackgroundFromImage }
}