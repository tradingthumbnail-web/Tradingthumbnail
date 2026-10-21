import { Path, Canvas } from "fabric";

export const useCanvasPath = () => {
    const isPathClosed: Ref<boolean> = ref(false);
    const pathWarning: Ref<string> = ref('');
    const { t } = useI18n();

    const checkPathClosure = (
        canvas: Canvas
    ) => {
        if (!canvas) return;

        const paths = canvas.getObjects().filter(obj => obj instanceof Path);
    
        if (paths.length === 0) {
            isPathClosed.value = false;
            pathWarning.value = t('canvas.inpainting.unclosedPathWarning');
            return;
        }
    
        // For each path, check if it's closed
        let allPathsClosed = true;
    
        paths.forEach(path => {
            if (path instanceof Path) {
                // Get the actual SVG path string which shows if path is closed
                const svgPath = path.toSVG();
    
                // A path is closed if it contains the "Z" command (case insensitive)
                const hasCloseCommand = svgPath.includes(' Z"') || svgPath.includes(' z"');
    
                if (!hasCloseCommand) {
                    // Alternative check - does Fabric consider it a complete shape?
                    // When Fabric renders a closed shape, it adds a fill
                    const isFillable = path.fill !== '';
    
                    if (!isFillable) {
                        // One more check - is it a simple closed path?
                        // In Fabric, try converting to a simple shape
                        try {
                            // If we can get bounding rect info, treat it as closed enough for inpainting
                            const { width, height } = path.getBoundingRect();
                            if (width < 5 || height < 5) {
                                // Too small to be useful
                                allPathsClosed = false;
                            }
                        } catch (e) {
                            // If getBoundingRect fails, it's definitely not a closed path
                            allPathsClosed = false;
                        }
                    }
                }
            }
        });
    
        isPathClosed.value = allPathsClosed;
        pathWarning.value = allPathsClosed ? '' : t('canvas.inpainting.unclosedPathWarning');
    };

    const autoClosePath = (e: any, canvas: Canvas | null) => {
        if (!canvas) return;
    
        const path = e.path;
        if (!(path instanceof Path)) return;
    
        // Get the path data
        const pathData = path.path;
        if (!pathData || pathData.length < 2) return;
    
        // Get start and end points
        const startX = pathData[0]?.[1];
        const startY = pathData[0]?.[2];
    
        let lastCommandWithCoords = null;
        for (let i = pathData.length - 1; i >= 0; i--) {
            if (pathData[i] && pathData[i]!.length >= 3) {
                lastCommandWithCoords = pathData[i];
                break;
            }
        };
        if (!lastCommandWithCoords) return;
    
        const endX = lastCommandWithCoords[1];
        const endY = lastCommandWithCoords[2];
    
        // Calculate distance
        const distance = Math.sqrt(
            Math.pow(endX as number - (startX as number), 2) + Math.pow(endY as number - (startY as number), 2)
        );
    
        // If distance is greater than threshold, add a line back to start and close the path
        if (distance > 5) {
            // Add line to start point
            pathData.push(['L', startX as number, startY as number]);
            // Add close command
            pathData.push(['Z']);
    
            // Update the path
            path.path = pathData;
    
            // Set fill to make it obvious it's closed
            path.set({
                fill: 'rgba(255, 0, 0, 0.2)',
                fillRule: 'evenodd'
            });
    
            canvas.renderAll();
        }
    
        // Run the check
        checkPathClosure(canvas);
    };

    const convertPathToMask = async (path: any, dimensions: { width: number, height: number }): Promise<string> => {
        // Create a temporary canvas for the mask
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = dimensions.width;
        tempCanvas.height = dimensions.height;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) {
            throw new Error(t('canvas.errors.initializationFailed'));
        }
    
        // Fill with black background
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    
        // Draw the path in white
        ctx.fillStyle = 'white';
        ctx.beginPath();
    
        // Convert the fabric path to canvas path
        const pathData = path.path;
        if (pathData && pathData.length > 0) {
            for (let i = 0; i < pathData.length; i++) {
                const cmd = pathData[i];
                switch (cmd[0]) {
                    case 'M':
                        ctx.moveTo(cmd[1], cmd[2]);
                        break;
                    case 'L':
                        ctx.lineTo(cmd[1], cmd[2]);
                        break;
                    case 'Q':
                        ctx.quadraticCurveTo(cmd[1], cmd[2], cmd[3], cmd[4]);
                        break;
                    case 'C':
                        ctx.bezierCurveTo(cmd[1], cmd[2], cmd[3], cmd[4], cmd[5], cmd[6]);
                        break;
                    case 'Z':
                        ctx.closePath();
                        break;
                }
            }
        }
    
        ctx.fill();
    
        // Convert to data URL
        return tempCanvas.toDataURL('image/png');
    };

    const clearPath = (canvas: Canvas) => {
        if (!canvas) return;
        const paths = canvas.getObjects().filter(obj => obj instanceof Path);
        paths.forEach(path => {
            canvas.remove(path);
        });
        canvas.requestRenderAll();
    };

    return {
        isPathClosed,
        pathWarning,

        checkPathClosure,
        autoClosePath,
        convertPathToMask,
        clearPath,
    }
};