export const useFile = () => {
    const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                if (!result) {
                    reject(new Error('Empty file result'));
                    return;
                }  
                // Extract base64 string from data URL (e.g., "data:image/jpeg;base64,...")
                const dataUrl = result as string;
                const base64String = dataUrl.split('base64,')[1] || '';
                
                resolve(base64String);
            };
            reader.onerror = () => {
                reject(reader.error || new Error('Failed to read file'));
            };
            reader.readAsDataURL(file);
        });
    };

    const compressImageFile = (file: File, maxDimension = 1536, quality = 0.75): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);

                let { width, height } = img;
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = (height / width) * maxDimension;
                        width = maxDimension;
                    } else {
                        width = (width / height) * maxDimension;
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(width));
                canvas.height = Math.max(1, Math.round(height));
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl.split('base64,')[1] || '');
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };

            img.src = url;
        });
    };

    return {
        convertFileToBase64,
        compressImageFile,
    }
}