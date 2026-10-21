import { defineStore } from 'pinia';

import type { 
    Pipeline, 
    PipelineElement, 
    PipelineCanvasData, 
    PipelineConfig,
} from '~~/server/database/schemas/pipeline.schema';

export const usePipelineStore = defineStore('pipeline', {
    state: () => ({
        pipelines: [] as Pipeline[],
        currentPipeline: null as Pipeline | null,
        
        editorElements: [] as PipelineElement[],
        editorConfig: {
            thumbnailStyle: 'cinematic',
            backgroundColor: '#ffffff',
            generationModel: 'gpt-image-1.5',
        } as PipelineConfig,
        editorName: '',
        editorDescription: '',
        
        hasInitialized: false,
        loading: false,
        error: null as unknown | null,
    }),

    getters: {
        configurableElements(state): PipelineElement[] {
            return state.editorElements.filter(e => e.isConfigurable);
        },
        
        fixedElements(state): PipelineElement[] {
            return state.editorElements.filter(e => !e.isConfigurable);
        },

        assetElements(state): PipelineElement[] {
            return state.editorElements.filter(e => e.type === 'ASSET');
        },

        avatarElements(state): PipelineElement[] {
            return state.editorElements.filter(e => e.type === 'AVATAR');
        },

        textElements(state): PipelineElement[] {
            return state.editorElements.filter(e => e.type === 'TEXT');
        },
    },

    actions: {
        async fetchPipelines() {
            this.loading = true;
            this.error = null;
            try {
                const pipelines = await $fetch<Pipeline[]>('/api/v1/pipeline');
                this.pipelines = pipelines;
                this.hasInitialized = true;
            } catch (error) {
                console.error(error);
                this.error = error;
            } finally {
                this.loading = false;
            }
        },

        async fetchPipeline(id: string) {
            this.loading = true;
            this.error = null;
            try {
                const pipeline = await $fetch<Pipeline>(`/api/v1/pipeline/${id}`);
                this.currentPipeline = pipeline;
                return pipeline;
            } catch (error) {
                console.error(error);
                this.error = error;
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async createPipeline(data: { 
            name: string; 
            description?: string; 
            canvasData: PipelineCanvasData; 
            config?: PipelineConfig 
        }) {
            this.loading = true;
            this.error = null;
            try {
                const pipeline = await $fetch<Pipeline>('/api/v1/pipeline', {
                    method: 'POST',
                    body: data,
                });
                this.pipelines.unshift(pipeline);
                return pipeline;
            } catch (error) {
                console.error(error);
                this.error = error;
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async updatePipeline(id: string, data: { 
            name?: string; 
            description?: string; 
            canvasData?: PipelineCanvasData; 
            config?: PipelineConfig 
        }) {
            this.loading = true;
            this.error = null;
            try {
                const pipeline = await $fetch<Pipeline>(`/api/v1/pipeline/${id}`, {
                    method: 'PUT',
                    body: data,
                });
                const index = this.pipelines.findIndex(p => p.id === id);
                if (index !== -1) {
                    this.pipelines[index] = pipeline;
                }
                return pipeline;
            } catch (error) {
                console.error(error);
                this.error = error;
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async deletePipeline(id: string) {
            this.loading = true;
            this.error = null;
            try {
                await $fetch(`/api/v1/pipeline/${id}`, {
                    method: 'DELETE',
                });
                this.pipelines = this.pipelines.filter(p => p.id !== id);
            } catch (error) {
                console.error(error);
                this.error = error;
                throw error;
            } finally {
                this.loading = false;
            }
        },

        resetEditor() {
            this.editorElements = [];
            this.editorConfig = {
                thumbnailStyle: 'cinematic',
                backgroundColor: '#ffffff',
                generationModel: 'gpt-image-1.5',
            };
            this.editorName = '';
            this.editorDescription = '';
        },

        loadPipelineToEditor(pipeline: Pipeline) {
            this.editorName = pipeline.name;
            this.editorDescription = pipeline.description || '';
            this.editorElements = [...pipeline.canvasData.elements];
            this.editorConfig = { ...pipeline.config };
        },

        addElement(element: PipelineElement) {
            this.editorElements.push(element);
        },

        updateElement(elementId: string, updates: Partial<PipelineElement>) {
            const index = this.editorElements.findIndex(e => e.id === elementId);
            if (index !== -1) {
                this.editorElements[index] = { ...this.editorElements[index], ...updates } as PipelineElement;
            }
        },

        removeElement(elementId: string) {
            this.editorElements = this.editorElements.filter(e => e.id !== elementId);
        },

        getCanvasData(fabricJson: object): PipelineCanvasData {
            return {
                fabricJson,
                elements: this.editorElements,
            };
        },
    },
});