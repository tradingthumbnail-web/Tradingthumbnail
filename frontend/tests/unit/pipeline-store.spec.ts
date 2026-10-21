// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { usePipelineStore } from '../../app/stores/pipeline';
import type { Pipeline, PipelineElement } from '../../server/database/schemas/pipeline.schema';

vi.mock('#imports', () => ({
    $fetch: vi.fn()
}));

describe('Pipeline Store', () => {
    let pipelineStore: ReturnType<typeof usePipelineStore>;

    beforeEach(() => {
        setActivePinia(createPinia());
        pipelineStore = usePipelineStore();
        vi.clearAllMocks();
    });

    describe('Initial State', () => {
        it('should have correct initial state', () => {
            expect(pipelineStore.pipelines).toEqual([]);
            expect(pipelineStore.currentPipeline).toBeNull();
            expect(pipelineStore.editorElements).toEqual([]);
            expect(pipelineStore.editorName).toBe('');
            expect(pipelineStore.editorDescription).toBe('');
            expect(pipelineStore.loading).toBe(false);
            expect(pipelineStore.error).toBeNull();
            expect(pipelineStore.hasInitialized).toBe(false);
        });

        it('should have correct default editor config', () => {
            expect(pipelineStore.editorConfig).toEqual({
                thumbnailStyle: 'cinematic',
                backgroundColor: '#ffffff',
                generationModel: 'gpt-image-1.5',
            });
        });
    });

    describe('Getters', () => {
        beforeEach(() => {
            pipelineStore.editorElements = [
                { id: '1', type: 'ASSET', isConfigurable: true } as PipelineElement,
                { id: '2', type: 'AVATAR', isConfigurable: false } as PipelineElement,
                { id: '3', type: 'TEXT', isConfigurable: true } as PipelineElement,
            ];
        });

        it('configurableElements should return only configurable elements', () => {
            const configurable = pipelineStore.configurableElements;
            expect(configurable).toHaveLength(2);
            expect(configurable.every(e => e.isConfigurable)).toBe(true);
        });

        it('fixedElements should return only non-configurable elements', () => {
            const fixed = pipelineStore.fixedElements;
            expect(fixed).toHaveLength(1);
            expect(fixed.every(e => !e.isConfigurable)).toBe(true);
        });

        it('assetElements should return only ASSET type elements', () => {
            const assets = pipelineStore.assetElements;
            expect(assets).toHaveLength(1);
            expect(assets.every(e => e.type === 'ASSET')).toBe(true);
        });

        it('avatarElements should return only AVATAR type elements', () => {
            const avatars = pipelineStore.avatarElements;
            expect(avatars).toHaveLength(1);
            expect(avatars.every(e => e.type === 'AVATAR')).toBe(true);
        });

        it('textElements should return only TEXT type elements', () => {
            const texts = pipelineStore.textElements;
            expect(texts).toHaveLength(1);
            expect(texts.every(e => e.type === 'TEXT')).toBe(true);
        });
    });

    describe('Actions', () => {
        describe('resetEditor', () => {
            it('should reset editor to default state', () => {
                pipelineStore.editorElements = [{ id: '1', type: 'ASSET' } as PipelineElement];
                pipelineStore.editorName = 'Test Name';
                pipelineStore.editorDescription = 'Test Description';
                pipelineStore.editorConfig.thumbnailStyle = 'default';

                pipelineStore.resetEditor();

                expect(pipelineStore.editorElements).toEqual([]);
                expect(pipelineStore.editorName).toBe('');
                expect(pipelineStore.editorDescription).toBe('');
                expect(pipelineStore.editorConfig).toEqual({
                    thumbnailStyle: 'cinematic',
                    backgroundColor: '#ffffff',
                    generationModel: 'gpt-image-1.5',
                });
            });
        });

        describe('loadPipelineToEditor', () => {
            it('should load pipeline data to editor', () => {
                const mockPipeline: Pipeline = {
                    id: 'pipe-1',
                    name: 'Test Pipeline',
                    description: 'Test Description',
                    canvasData: {
                        fabricJson: {},
                        elements: [{ id: 'elem-1', type: 'ASSET' } as PipelineElement]
                    },
                    config: { thumbnailStyle: 'default' },
                    executionCount: 0,
                    userId: 'user-1',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                };

                pipelineStore.loadPipelineToEditor(mockPipeline);

                expect(pipelineStore.editorName).toBe('Test Pipeline');
                expect(pipelineStore.editorDescription).toBe('Test Description');
                expect(pipelineStore.editorElements).toEqual(mockPipeline.canvasData.elements);
                expect(pipelineStore.editorConfig).toEqual(mockPipeline.config);
            });
        });

        describe('addElement', () => {
            it('should add element to editor', () => {
                const element: PipelineElement = { id: 'elem-1', type: 'ASSET' } as PipelineElement;
                
                pipelineStore.addElement(element);
                
                expect(pipelineStore.editorElements).toContainEqual(element);
                expect(pipelineStore.editorElements).toHaveLength(1);
            });
        });

        describe('updateElement', () => {
            it('should update existing element', () => {
                const element: PipelineElement = { 
                    id: 'elem-1', 
                    type: 'ASSET',
                    label: 'Old Label'
                } as PipelineElement;
                pipelineStore.editorElements = [element];

                pipelineStore.updateElement('elem-1', { label: 'New Label' });

                expect(pipelineStore.editorElements[0].label).toBe('New Label');
            });

            it('should not update non-existent element', () => {
                const element: PipelineElement = { id: 'elem-1', type: 'ASSET' } as PipelineElement;
                const originalElements = [element];
                pipelineStore.editorElements = originalElements;

                pipelineStore.updateElement('non-existent', { label: 'New' });

                expect(pipelineStore.editorElements).toEqual(originalElements);
            });
        });

        describe('removeElement', () => {
            it('should remove element from editor', () => {
                const element1: PipelineElement = { id: 'elem-1', type: 'ASSET' } as PipelineElement;
                const element2: PipelineElement = { id: 'elem-2', type: 'AVATAR' } as PipelineElement;
                pipelineStore.editorElements = [element1, element2];

                pipelineStore.removeElement('elem-1');

                expect(pipelineStore.editorElements).toHaveLength(1);
                expect(pipelineStore.editorElements).toContainEqual(element2);
                expect(pipelineStore.editorElements).not.toContainEqual(element1);
            });
        });

        describe('getCanvasData', () => {
            it('should return canvas data with fabric json and elements', () => {
                const fabricJson = { version: '5.0.0', objects: [] };
                const elements: PipelineElement[] = [
                    { id: 'elem-1', type: 'ASSET' } as PipelineElement
                ];
                pipelineStore.editorElements = elements;

                const canvasData = pipelineStore.getCanvasData(fabricJson);

                expect(canvasData).toEqual({
                    fabricJson,
                    elements,
                });
            });
        });
    });
});