import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetQuery = vi.fn();
const mockUseRuntimeConfig = vi.fn();
const mockGetRequestURL = vi.fn();
const mockSetCookie = vi.fn();
const mockCreateError = vi.fn((opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage);
    (err as any).statusCode = opts.statusCode;
    return err;
});
const mockSendRedirect = vi.fn((_event, location, statusCode) => ({
    location,
    statusCode,
}));

vi.mock("h3", () => ({
    defineEventHandler: vi.fn((handler: any) => handler),
    getQuery: (...args: unknown[]) => mockGetQuery(...args),
    useRuntimeConfig: (...args: unknown[]) => mockUseRuntimeConfig(...args),
    getRequestURL: (...args: unknown[]) => mockGetRequestURL(...args),
    setCookie: (...args: unknown[]) => mockSetCookie(...args),
    createError: (...args: unknown[]) => mockCreateError(...args),
    sendRedirect: (...args: unknown[]) => mockSendRedirect(...args),
}));

Object.assign(globalThis, {
    defineEventHandler: vi.fn((handler: any) => handler),
    getQuery: mockGetQuery,
    useRuntimeConfig: mockUseRuntimeConfig,
    getRequestURL: mockGetRequestURL,
    setCookie: mockSetCookie,
    createError: mockCreateError,
    sendRedirect: mockSendRedirect,
});

vi.mock("~~/server/database", () => ({
    db: {
        query: {
            userTable: {
                findFirst: vi.fn(),
            },
        },
        insert: vi.fn(),
    },
}));

describe("API: /api/v1/auth/google/start.get", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseRuntimeConfig.mockReturnValue({
            googleClientId: "client-id",
            googleClientSecret: "client-secret",
        });
        mockGetRequestURL.mockReturnValue(new URL("http://localhost:3000/login"));
        mockGetQuery.mockReturnValue({ redirect: "/settings" });
    });

    it("creates oauth state cookie and redirects to Google auth endpoint", async () => {
        const handler = (await import("~~/server/api/v1/auth/google/start.get")).default;
        const result = await handler({} as any);

        expect(mockSetCookie).toHaveBeenCalledTimes(1);
        expect(mockSetCookie.mock.calls[0][1]).toBe("google_oauth_flow");
        expect(mockSendRedirect).toHaveBeenCalledTimes(1);

        const redirectUrl = String(result.location);
        expect(redirectUrl).toContain("https://accounts.google.com/o/oauth2/v2/auth?");
        expect(redirectUrl).toContain("client_id=client-id");
        expect(redirectUrl).toContain(encodeURIComponent("http://localhost:3000/api/v1/auth/google/callback"));
        expect(redirectUrl).toContain("code_challenge_method=S256");
        expect(redirectUrl).toContain("state=");
    });

    it("rejects when google credentials are missing", async () => {
        mockUseRuntimeConfig.mockReturnValue({
            googleClientId: "",
            googleClientSecret: "",
        });
        const handler = (await import("~~/server/api/v1/auth/google/start.get")).default;
        await expect(handler({} as any)).rejects.toMatchObject({
            statusCode: 500,
        });
    });
});
