// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockReadBody = vi.fn();
const mockGetRouterParam = vi.fn();
const mockCreateError = vi.fn((options: { statusCode: number; statusMessage: string }) => {
    const error = new Error(options.statusMessage);
    (error as any).statusCode = options.statusCode;
    return error;
});

vi.mock('h3', () => ({
    createError: mockCreateError,
    readBody: mockReadBody,
    getRouterParam: mockGetRouterParam,
    defineEventHandler: vi.fn((handler: any) => handler),
}));

Object.assign(globalThis, {
    defineEventHandler: vi.fn((handler: any) => handler),
    readBody: mockReadBody,
    getRouterParam: mockGetRouterParam,
    createError: mockCreateError,
});

const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();

vi.mock('~~/server/database', () => ({
    db: {
        query: {
            pipelineTable: {
                findMany: mockFindMany,
                findFirst: mockFindFirst,
            },
        },
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn().mockResolvedValue([
                    {
                        id: 'new-pipeline-id',
                        name: 'New Pipeline',
                        userId: 'user-123',
                        canvasData: {},
                        config: {},
                        executionCount: 0,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        deletedAt: null,
                    },
                ]),
            })),
        })),
        update: vi.fn(() => ({
            set: vi.fn(() => {
                const whereResult: any = {
                    returning: vi.fn().mockResolvedValue([
                        {
                            id: 'pipeline-1',
                            name: 'Updated',
                            userId: 'user-123',
                            canvasData: {},
                            config: {},
                            executionCount: 0,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            deletedAt: null,
                        },
                    ]),
                };
                whereResult.then = (fn: any) => Promise.resolve(undefined).then(fn);
                whereResult.catch = (fn: any) => Promise.resolve(undefined).catch(fn);
                return { where: vi.fn(() => whereResult) };
            }),
        })),
    },
}));

const mockPipeline = {
    id: 'pipeline-1',
    userId: 'user-123',
    name: 'Test Pipeline',
    description: 'A test',
    canvasData: { fabricJson: {}, elements: [] },
    config: {},
    executionCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
};

describe('API: /api/v1/pipeline', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    beforeEach(() => {
        vi.clearAllMocks();
        mockFindMany.mockResolvedValue([mockPipeline]);
        mockFindFirst.mockResolvedValue(mockPipeline);
    });

    describe('GET /api/v1/pipeline (index.get)', () => {
        it('returns pipelines for authenticated user', async () => {
            const handler = (await import('~~/server/api/v1/pipeline/index.get')).default;
            const event = { context: { user: mockUser } } as any;

            const result = await handler(event);

            expect(mockFindMany).toHaveBeenCalled();
            expect(result).toEqual([mockPipeline]);
        });

        it('returns 401 when user is not authenticated', async () => {
            const handler = (await import('~~/server/api/v1/pipeline/index.get')).default;
            const event = { context: {} } as any;

            await expect(handler(event)).rejects.toMatchObject({
                message: 'Unauthorized',
                statusCode: 401,
            });
        });
    });

    describe('POST /api/v1/pipeline (index.post)', () => {
        it('creates pipeline with valid data', async () => {
            mockReadBody.mockResolvedValue({
                name: 'New Pipeline',
                description: 'Description',
                canvasData: { fabricJson: {}, elements: [{ id: '1', type: 'TEXT' }] },
                config: {},
            });

            const handler = (await import('~~/server/api/v1/pipeline/index.post')).default;
            const event = { context: { user: mockUser } } as any;

            const result = await handler(event);

            expect(mockReadBody).toHaveBeenCalled();
            expect(result).toMatchObject({ id: 'new-pipeline-id', name: 'New Pipeline' });
        });

        it('returns 400 when name is missing', async () => {
            mockReadBody.mockResolvedValue({
                description: 'Desc',
                canvasData: { fabricJson: {}, elements: [] },
            });

            const handler = (await import('~~/server/api/v1/pipeline/index.post')).default;
            const event = { context: { user: mockUser } } as any;

            await expect(handler(event)).rejects.toMatchObject({
                statusCode: 400,
                message: 'Name and canvasData are required',
            });
        });

        it('returns 400 when canvasData is missing', async () => {
            mockReadBody.mockResolvedValue({
                name: 'Pipeline',
                description: 'Desc',
            });

            const handler = (await import('~~/server/api/v1/pipeline/index.post')).default;
            const event = { context: { user: mockUser } } as any;

            await expect(handler(event)).rejects.toMatchObject({
                statusCode: 400,
                message: 'Name and canvasData are required',
            });
        });

        it('returns 401 when user is not authenticated', async () => {
            mockReadBody.mockResolvedValue({
                name: 'Pipeline',
                canvasData: { fabricJson: {}, elements: [] },
            });

            const handler = (await import('~~/server/api/v1/pipeline/index.post')).default;
            const event = { context: {} } as any;

            await expect(handler(event)).rejects.toMatchObject({
                message: 'Unauthorized',
                statusCode: 401,
            });
        });
    });
});

describe('API: /api/v1/pipeline/[id]', () => {
    const mockUser = { id: 'user-123' };

    beforeEach(() => {
        vi.clearAllMocks();
        mockGetRouterParam.mockReturnValue('pipeline-1');
        mockFindFirst.mockResolvedValue(mockPipeline);
    });

    describe('GET /api/v1/pipeline/[id] ([id]/index.get)', () => {
        it('returns pipeline for authenticated owner', async () => {
            const handler = (await import('~~/server/api/v1/pipeline/[id]/index.get')).default;
            const event = { context: { user: mockUser } } as any;

            const result = await handler(event);

            expect(mockGetRouterParam).toHaveBeenCalledWith(event, 'id');
            expect(mockFindFirst).toHaveBeenCalled();
            expect(result).toEqual(mockPipeline);
        });

        it('returns 404 when pipeline not found', async () => {
            mockFindFirst.mockResolvedValue(null);

            const handler = (await import('~~/server/api/v1/pipeline/[id]/index.get')).default;
            const event = { context: { user: mockUser } } as any;

            await expect(handler(event)).rejects.toMatchObject({
                statusCode: 404,
                message: 'Pipeline not found',
            });
        });

        it('returns 400 when id is missing', async () => {
            mockGetRouterParam.mockReturnValue(undefined);

            const handler = (await import('~~/server/api/v1/pipeline/[id]/index.get')).default;
            const event = { context: { user: mockUser } } as any;

            await expect(handler(event)).rejects.toMatchObject({
                statusCode: 400,
                message: 'Pipeline ID is required',
            });
        });

        it('returns 401 when user is not authenticated', async () => {
            const handler = (await import('~~/server/api/v1/pipeline/[id]/index.get')).default;
            const event = { context: {} } as any;

            await expect(handler(event)).rejects.toMatchObject({
                message: 'Unauthorized',
                statusCode: 401,
            });
        });
    });

    describe('PUT /api/v1/pipeline/[id] ([id]/index.put)', () => {
        it('updates pipeline with valid data', async () => {
            mockReadBody.mockResolvedValue({
                name: 'Updated Name',
                description: 'Updated desc',
                canvasData: { fabricJson: {}, elements: [] },
            });

            const handler = (await import('~~/server/api/v1/pipeline/[id]/index.put')).default;
            const event = { context: { user: mockUser } } as any;

            const result = await handler(event);

            expect(result).toMatchObject({ id: 'pipeline-1', name: 'Updated' });
        });

        it('returns 404 when pipeline not found', async () => {
            mockFindFirst.mockResolvedValue(null);
            mockReadBody.mockResolvedValue({ name: 'Updated' });

            const handler = (await import('~~/server/api/v1/pipeline/[id]/index.put')).default;
            const event = { context: { user: mockUser } } as any;

            await expect(handler(event)).rejects.toMatchObject({
                statusCode: 404,
                message: 'Pipeline not found',
            });
        });

        it('returns 401 when user is not authenticated', async () => {
            mockReadBody.mockResolvedValue({ name: 'Updated' });

            const handler = (await import('~~/server/api/v1/pipeline/[id]/index.put')).default;
            const event = { context: {} } as any;

            await expect(handler(event)).rejects.toMatchObject({
                message: 'Unauthorized',
                statusCode: 401,
            });
        });
    });

    describe('DELETE /api/v1/pipeline/[id] ([id]/index.delete)', () => {
        it('soft-deletes pipeline', async () => {
            const handler = (await import('~~/server/api/v1/pipeline/[id]/index.delete')).default;
            const event = { context: { user: mockUser } } as any;

            const result = await handler(event);

            expect(result).toEqual({ success: true });
        });

        it('returns 404 when pipeline not found', async () => {
            mockFindFirst.mockResolvedValue(null);

            const handler = (await import('~~/server/api/v1/pipeline/[id]/index.delete')).default;
            const event = { context: { user: mockUser } } as any;

            await expect(handler(event)).rejects.toMatchObject({
                statusCode: 404,
                message: 'Pipeline not found',
            });
        });

        it('returns 401 when user is not authenticated', async () => {
            const handler = (await import('~~/server/api/v1/pipeline/[id]/index.delete')).default;
            const event = { context: {} } as any;

            await expect(handler(event)).rejects.toMatchObject({
                message: 'Unauthorized',
                statusCode: 401,
            });
        });
    });
});