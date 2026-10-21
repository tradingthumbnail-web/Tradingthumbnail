import { describe, it, expect } from 'vitest';
import { getModelCreditsWithOptions, getModelCredits, getModelConfig } from '../../server/constants/models-db';

describe('Nano Banana 2 Credits', () => {
    describe('getModelCreditsWithOptions', () => {
        it('returns base credits (4) when no options provided', () => {
            expect(getModelCreditsWithOptions('fal-ai/nano-banana-2')).toBe(4);
        });

        it('calculates 0.5K credits correctly (0.75x = 3)', () => {
            expect(getModelCreditsWithOptions('fal-ai/nano-banana-2', { resolution: '0.5K' })).toBe(3);
        });

        it('calculates 1K credits correctly (1x = 4)', () => {
            expect(getModelCreditsWithOptions('fal-ai/nano-banana-2', { resolution: '1K' })).toBe(4);
        });

        it('calculates 2K credits correctly (1.5x = 6)', () => {
            expect(getModelCreditsWithOptions('fal-ai/nano-banana-2', { resolution: '2K' })).toBe(6);
        });

        it('calculates 4K credits correctly (2x = 8)', () => {
            expect(getModelCreditsWithOptions('fal-ai/nano-banana-2', { resolution: '4K' })).toBe(8);
        });

        it('adds web search credits (+2) when enabled', () => {
            expect(getModelCreditsWithOptions('fal-ai/nano-banana-2', { 
                resolution: '1K', 
                webSearch: true 
            })).toBe(6);
        });

        it('adds web search credits to 4K resolution', () => {
            expect(getModelCreditsWithOptions('fal-ai/nano-banana-2', { 
                resolution: '4K', 
                webSearch: true 
            })).toBe(10);
        });

        it('does not add web search credits when disabled', () => {
            expect(getModelCreditsWithOptions('fal-ai/nano-banana-2', { 
                resolution: '1K', 
                webSearch: false 
            })).toBe(4);
        });

        it('returns base credits for models without variable pricing', () => {
            expect(getModelCreditsWithOptions('fal-ai/flux-2')).toBe(2);
            expect(getModelCreditsWithOptions('fal-ai/flux-2', { resolution: '4K' })).toBe(2);
            expect(getModelCreditsWithOptions('fal-ai/flux-2', { webSearch: true })).toBe(2);
        });
    });

    describe('getModelCredits (backwards compatibility)', () => {
        it('returns base credits for nano-banana-2', () => {
            expect(getModelCredits('fal-ai/nano-banana-2')).toBe(4);
        });

        it('returns credits for other models unchanged', () => {
            expect(getModelCredits('fal-ai/flux-2')).toBe(2);
            expect(getModelCredits('fal-ai/nano-banana')).toBe(2);
            expect(getModelCredits('gpt-image-1.5')).toBe(2);
        });
    });

    describe('getModelConfig', () => {
        it('returns config with resolution options for nano-banana-2', () => {
            const config = getModelConfig('fal-ai/nano-banana-2');
            
            expect(config.resolutionOptions).toBeDefined();
            expect(config.resolutionOptions).toHaveLength(4);
            expect(config.resolutionOptions![0]).toEqual({ value: '0.5K', label: '512px', creditMultiplier: 0.75 });
            expect(config.resolutionOptions![1]).toEqual({ value: '1K', label: '1024px', creditMultiplier: 1 });
            expect(config.resolutionOptions![2]).toEqual({ value: '2K', label: '2048px', creditMultiplier: 1.5 });
            expect(config.resolutionOptions![3]).toEqual({ value: '4K', label: '4096px', creditMultiplier: 2 });
        });

        it('returns config with web search support for nano-banana-2', () => {
            const config = getModelConfig('fal-ai/nano-banana-2');
            
            expect(config.supportsWebSearch).toBe(true);
            expect(config.webSearchCredits).toBe(2);
        });

        it('returns config without resolution options for flux-2', () => {
            const config = getModelConfig('fal-ai/flux-2');
            
            expect(config.resolutionOptions).toBeUndefined();
            expect(config.supportsWebSearch).toBeUndefined();
        });

        it('returns correct display name and provider for nano-banana-2', () => {
            const config = getModelConfig('fal-ai/nano-banana-2');
            
            expect(config.displayName).toBe('Nano Banana 2');
            expect(config.provider).toBe('google');
            expect(config.in_use).toBe(true);
            expect(config.selectableFor).toContain('quickGeneration');
            expect(config.selectableFor).toContain('fineEdit');
        });
    });
});