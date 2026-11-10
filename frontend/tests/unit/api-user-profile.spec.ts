import { beforeEach, describe, expect, it, vi } from "vitest";

const mockReadBody = vi.fn();
const mockCreateError = vi.fn((options: { statusCode: number; statusMessage: string }) => {
    const error = new Error(options.statusMessage);
    (error as any).statusCode = options.statusCode;
    return error;
});

vi.mock("h3", () => ({
    defineEventHandler: vi.fn((handler: any) => handler),
    readBody: (...args: unknown[]) => mockReadBody(...args),
    createError: (...args: unknown[]) => mockCreateError(...args),
}));

Object.assign(globalThis, {
    defineEventHandler: vi.fn((handler: any) => handler),
    readBody: mockReadBody,
    createError: mockCreateError,
});

const mockFindFirst = vi.fn();
const mockUpdateReturning = vi.fn();

vi.mock("~~/server/database", () => ({
    db: {
        query: {
            userTable: {
                findFirst: (...args: unknown[]) => mockFindFirst(...args),
            },
        },
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => ({
                    returning: (...args: unknown[]) => mockUpdateReturning(...args),
                })),
            })),
        })),
    },
}));

describe("API: /api/v1/user/profile.post", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 401 when user is not authenticated", async () => {
        const handler = (await import("~~/server/api/v1/user/profile.post")).default;
        await expect(handler({ context: {} } as any)).rejects.toMatchObject({
            statusCode: 401,
            message: "Unauthorized",
        });
    });

    it("returns 400 for invalid payload", async () => {
        mockReadBody.mockResolvedValue({
            name: "User Name",
            username: "",
            notifications: true,
        });

        const handler = (await import("~~/server/api/v1/user/profile.post")).default;
        await expect(handler({ context: { user: { id: "user-1" } } } as any)).rejects.toMatchObject({
            statusCode: 400,
            message: "Invalid profile payload",
        });
    });

    it("returns 409 when username already exists", async () => {
        mockReadBody.mockResolvedValue({
            name: "User Name",
            username: "taken_username",
            notifications: true,
        });
        mockFindFirst.mockResolvedValue({ id: "user-2" });

        const handler = (await import("~~/server/api/v1/user/profile.post")).default;
        await expect(handler({ context: { user: { id: "user-1" } } } as any)).rejects.toMatchObject({
            statusCode: 409,
            message: "Username already exists",
        });
    });

    it("updates and returns persisted profile fields", async () => {
        mockReadBody.mockResolvedValue({
            name: "Updated Name",
            username: "updated_username",
            notifications: false,
        });
        mockFindFirst.mockResolvedValue(null);
        mockUpdateReturning.mockResolvedValue([{
            id: "user-1",
            name: "Updated Name",
            username: "updated_username",
            notifications: false,
            email: "user@example.com",
        }]);

        const handler = (await import("~~/server/api/v1/user/profile.post")).default;
        const result = await handler({ context: { user: { id: "user-1" } } } as any);

        expect(result).toMatchObject({
            id: "user-1",
            name: "Updated Name",
            username: "updated_username",
            notifications: false,
            email: "user@example.com",
        });
        expect(mockFindFirst).toHaveBeenCalledTimes(1);
        expect(mockUpdateReturning).toHaveBeenCalledTimes(1);
    });
});
