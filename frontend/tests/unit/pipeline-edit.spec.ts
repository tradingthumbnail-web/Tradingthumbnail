// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { usePipelineStore } from '../../app/stores/pipeline';
import type { Pipeline, PipelineElement } from '../../server/database/schemas/pipeline.schema';

vi.mock('#imports', () => ({
    $fetch: vi.fn(),
}));

describe('Pipeline Edit', () => {
    let pipelineStore: ReturnType<typeof usePipelineStore>;

    const mockPipeline: Pipeline = {
        id: 'pipeline-1',
        userId: 'user-1',
        name: 'My Pipeline',
        description: 'Test description',
        canvasData: {
            fabricJson: {
                version: '6.0',
                objects: [
                    { type: 'textbox', pipelineElementId: 'elem-1', left: 100, top: 100 },
                    { type: 'image', pipelineElementId: 'elem-2', left: 200, top: 200 },
                ],
            },
            elements: [
                {
                    id: 'elem-1',
                    fabricObjectId: 'fabric-1',
                    type: 'TEXT',
                    label: 'Title',
                    position: { x: 100, y: 100, width: 200, height: 50 },
                    isConfigurable: true,
                    textOptions: { placeholder: 'Enter title', defaultText: 'Default' },
                } as PipelineElement,
                {
                    id: 'elem-2',
                    fabricObjectId: 'fabric-2',
                    type: 'ASSET',
                    label: 'Image',
                    position: { x: 200, y: 200, width: 300, height: 200 },
                    isConfigurable: false,
                    assetOptions: { assetIds: ['asset-1'], defaultAssetId: 'asset-1' },
                } as PipelineElement,
            ],
        },
        config: { thumbnailStyle: 'cinematic' },
        executionCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    };

    beforeEach(() => {
        setActivePinia(createPinia());
        pipelineStore = usePipelineStore();
        vi.clearAllMocks();
    });

    describe('loadPipelineToEditor', () => {
        it('loads pipeline metadata into editor', () => {
            pipelineStore.loadPipelineToEditor(mockPipeline);

            expect(pipelineStore.editorName).toBe('My Pipeline');
            expect(pipelineStore.editorDescription).toBe('Test description');
            expect(pipelineStore.editorConfig).toEqual({ thumbnailStyle: 'cinematic' });
        });

        it('loads elements into editor', () => {
            pipelineStore.loadPipelineToEditor(mockPipeline);

            expect(pipelineStore.editorElements).toHaveLength(2);
            expect(pipelineStore.editorElements[0].id).toBe('elem-1');
            expect(pipelineStore.editorElements[0].type).toBe('TEXT');
            expect(pipelineStore.editorElements[1].id).toBe('elem-2');
            expect(pipelineStore.editorElements[1].type).toBe('ASSET');
        });

        it('preserves element order for canvas reviver', () => {
            pipelineStore.loadPipelineToEditor(mockPipeline);

            const elements = pipelineStore.editorElements;
            expect(elements[0].id).toBe('elem-1');
            expect(elements[1].id).toBe('elem-2');
        });
    });

    describe('reviver logic for loadFromJSON', () => {
        it('maps pipelineElementId from JSON when present', () => {
            const obj = { pipelineElementId: 'elem-1', type: 'textbox' };
            const elements = mockPipeline.canvasData.elements;
            let elementIndex = 0;

            const reviver = (jsonObj: Record<string, unknown>, _fabricObj: any) => {
                const elementId =
                    (jsonObj.pipelineElementId as string) || elements[elementIndex]?.id;
                if (elementId) {
                    _fabricObj.pipelineElementId = elementId;
                }
                elementIndex++;
            };

            const fabricObj = {} as any;
            reviver(obj, fabricObj);

            expect(fabricObj.pipelineElementId).toBe('elem-1');
        });

        it('falls back to element by index when pipelineElementId missing', () => {
            const obj = { type: 'textbox' };
            const elements = mockPipeline.canvasData.elements;
            let elementIndex = 0;

            const reviver = (jsonObj: Record<string, unknown>, _fabricObj: any) => {
                const elementId =
                    (jsonObj.pipelineElementId as string) || elements[elementIndex]?.id;
                if (elementId) {
                    _fabricObj.pipelineElementId = elementId;
                }
                elementIndex++;
            };

            const fabricObj = {} as any;
            reviver(obj, fabricObj);

            expect(fabricObj.pipelineElementId).toBe('elem-1');
        });
    });

    describe('getCanvasData', () => {
        it('merges fabric JSON with editor elements', () => {
            pipelineStore.loadPipelineToEditor(mockPipeline);
            const fabricJson = { version: '6.0', objects: [] };

            const canvasData = pipelineStore.getCanvasData(fabricJson);

            expect(canvasData.fabricJson).toEqual(fabricJson);
            expect(canvasData.elements).toEqual(pipelineStore.editorElements);
        });
    });
});