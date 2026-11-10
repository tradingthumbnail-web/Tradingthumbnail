import { beforeEach, describe, expect, it, vi } from "vitest";

const mockReadBody = vi.fn();
const mockGetRouterParams = vi.fn();
const mockCreateError = vi.fn((opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage);
    (err as any).statusCode = opts.statusCode;
    return err;
});
const mockFindFirst = vi.fn();
const mockStoragePut = vi.fn();
const mockSaveAssetToDB = vi.fn();

vi.mock("h3", () => ({
    createError: mockCreateError,
    readBody: mockReadBody,
    getRouterParams: mockGetRouterParams,
    defineEventHandler: vi.fn((handler: any) => handler),
}));

Object.assign(globalThis, {
    defineEventHandler: vi.fn((handler: any) => handler),
    readBody: mockReadBody,
    getRouterParams: mockGetRouterParams,
    createError: mockCreateError,
});

vi.mock("~~/server/database", () => ({
    db: {
        query: {
            assetTable: {
                findFirst: (...args: unknown[]) => mockFindFirst(...args),
            },
        },
    },
}));

vi.mock("~~/server/services/asset", () => ({
    saveAssetToDB: (...args: unknown[]) => mockSaveAssetToDB(...args),
}));

vi.mock("~~/server/storage", () => ({
    storage: {
        put: (...args: unknown[]) => mockStoragePut(...args),
    },
}));

vi.mock("~~/server/storage/keys", () => ({
    generateAssetStorageKey: vi.fn(() => "user-id/assets/dev/PHOTO/new-id.png"),
}));

describe("API: save removed background", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetRouterParams.mockReturnValue({ assetId: "asset-1" });
        mockFindFirst.mockResolvedValue({
            id: "asset-1",
            userId: "user-id",
            name: "asset",
            type: "PHOTO",
        });
        mockSaveAssetToDB.mockResolvedValue({ id: "new-asset" });
    });

    it("rejects non data-url payloads", async () => {
        mockReadBody.mockResolvedValue({ assedSrc: "https://evil.example/image.png" });
        const fetchSpy = vi.spyOn(globalThis, "fetch");
        const handler = (await import("~~/server/api/v1/asset/[assetId]/save-removed-bg.post")).default;
        await expect(handler({ context: { user: { id: "user-id" } } } as any)).rejects.toMatchObject({
            statusCode: 400,
        });
        expect(fetchSpy).not.toHaveBeenCalled();
        expect(mockStoragePut).not.toHaveBeenCalled();
        fetchSpy.mockRestore();
    });

    it("stores decoded data-url payload in storage", async () => {
        mockReadBody.mockResolvedValue({ assedSrc: "data:image/png;base64,aGVsbG8=" });
        const handler = (await import("~~/server/api/v1/asset/[assetId]/save-removed-bg.post")).default;
        await handler({ context: { user: { id: "user-id" } } } as any);

        expect(mockStoragePut).toHaveBeenCalledWith(
            "user-id/assets/dev/PHOTO/new-id.png",
            expect.any(Buffer),
            "image/png",
        );
        expect(mockSaveAssetToDB).toHaveBeenCalled();
    });
});
