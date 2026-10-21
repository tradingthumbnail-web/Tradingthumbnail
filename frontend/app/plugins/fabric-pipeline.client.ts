import { FabricObject } from 'fabric';

declare module 'fabric' {
    interface FabricObject {
        pipelineElementId?: string;
    }
}

const existing = (FabricObject as any).customProperties as string[] | undefined;
(FabricObject as any).customProperties = existing ? [...existing, 'pipelineElementId'] : ['pipelineElementId'];