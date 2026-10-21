import type { Driver } from 'driver.js'

import { useHomeTour } from './home'
import { useGraphTour } from './graph'
import { useArchiveTour } from './archive'
import { useAssetsTour } from './assets'
import { useAvatarTour } from './avatar'
import { useQuickGenerationTour } from './quick-generation'
import { useQuickThumbnailTour } from './quick-thumbnail'
import { useSketchTour } from './sketch'
import { useChatTour } from './chat'
import { usePhotoshootTour } from './photoshoot'
import { useImageToImageTour } from './image-to-image';
import { usePipelineTour } from './pipeline';
import { usePipelineCreateTour } from './pipeline-create';

const STORAGE_KEY = 'kithumbs-driver-tour';

interface KiThumbsDriverTour {
    allCompleted: boolean;
    pages: {
        "/": boolean;
        "/graph": boolean;
        "/archive": boolean;
        "/assets": boolean;
        "/avatars": boolean;
        "/quick-generation": boolean;
        "/quick-thumb": boolean;
        "/sketch": boolean;
        "/chat": boolean;
        "/photoshoot": boolean;
        "/image-to-image": boolean;
        "/pipeline": boolean;
        "/pipeline/create": boolean;
    }
};
export type KiThumbsDriverPage = keyof KiThumbsDriverTour['pages'];

export const useDriver = () => {
    const { $driver } = useNuxtApp()
    const driver = $driver as Driver;
    
    const { steps: homeSteps } = useHomeTour();
    const { steps: graphSteps } = useGraphTour();
    const { steps: archiveSteps } = useArchiveTour();
    const { steps: assetsSteps } = useAssetsTour();
    const { steps: avatarSteps } = useAvatarTour();
    const { steps: quickGenerationSteps } = useQuickGenerationTour();
    const { steps: quickThumbnailSteps } = useQuickThumbnailTour();
    const { steps: sketchSteps } = useSketchTour();
    const { steps: chatSteps } = useChatTour();
    const { steps: photoshootSteps } = usePhotoshootTour();
    const { steps: imageToImageSteps } = useImageToImageTour();
    const { steps: pipelineSteps } = usePipelineTour();
    const { steps: pipelineCreateSteps } = usePipelineCreateTour();

    const _emptyTourStatus = {
        allCompleted: false,
        pages: {
            "/": false,
            "/graph": false,
            "/archive": false,
            "/assets": false,
            "/avatars": false,
            "/quick-generation": false,
            "/quick-thumb": false,
            "/sketch": false,
            "/chat": false,
            "/photoshoot": false,
            "/image-to-image": false,
            "/pipeline": false,
            "/pipeline/create": false,
        },
    };

    const _getTourStatus = () => {
        if (import.meta.server) return _emptyTourStatus;
        const storedValue = localStorage.getItem(STORAGE_KEY);
        if (!storedValue) return _emptyTourStatus;
        return JSON.parse(storedValue) as KiThumbsDriverTour;
    }

    const isTourCompleted = (page: KiThumbsDriverPage) => {
        const tourStatus = _getTourStatus();
        return tourStatus.pages[page] === true;
    }

    const markTourCompleted = (page: KiThumbsDriverPage) => {
        if (import.meta.server) return;
        const tourStatus = _getTourStatus();
        tourStatus.pages[page] = true;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tourStatus));
    }

    const resetTour = (page: KiThumbsDriverPage): void => {
        if (import.meta.server) return
        startTour(page, { force: true });
    }

    const startTour = async (page: KiThumbsDriverPage, options?: { force?: boolean }): Promise<void> => {
        if (import.meta.server) return

        if (!options?.force && isTourCompleted(page)) return;

        let completed = false
        const markCompleted = (page: KiThumbsDriverPage) => {
            if (!completed) {
                completed = true
                    markTourCompleted(page)
                }
            }

        const originalDestroy = driver.destroy.bind(driver)
        driver.destroy = () => {
            markCompleted(page)
            originalDestroy()
        }

        switch (page) {
            case '/':
                driver.setSteps(homeSteps)
                break;
            case '/graph':
                driver.setSteps(graphSteps)
                break;
            case '/archive':
                driver.setSteps(archiveSteps)
                break;
            case '/assets':
                driver.setSteps(assetsSteps)
                break;
            case '/avatars':
                driver.setSteps(avatarSteps)
                break;
            case '/quick-generation':
                driver.setSteps(quickGenerationSteps)
                break;
            case '/quick-thumb':
                driver.setSteps(quickThumbnailSteps)
                break;
            case '/sketch':
                driver.setSteps(sketchSteps)
                break;
            case '/chat':
                driver.setSteps(chatSteps)
                break;
            case '/photoshoot':
                driver.setSteps(photoshootSteps)
                break;
            case '/image-to-image':
                driver.setSteps(imageToImageSteps)
                break;
            case '/pipeline':
                driver.setSteps(pipelineSteps)
                break;
            case '/pipeline/create':
                driver.setSteps(pipelineCreateSteps)
                break;
            default:
                throw new Error(`Unknown page: ${page}`);
        };
        
        try {
            driver.drive();
        } finally {
            markCompleted(page);
            driver.destroy = originalDestroy;
        }
    }

    return {
        driver,
        isTourCompleted,
        markTourCompleted,
        resetTour,
        startTour,
    }
};