import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetQuery = vi.fn();
const mockSendRedirect = vi.fn((_event, location, statusCode) => ({
    location,
    statusCode,
}));
const mockCreateError = vi.fn((opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage);
    (err as any).statusCode = opts.statusCode;
    return err;
});

const mockConsumeFlow = vi.fn();
const mockExchangeCode = vi.fn();
const mockVerifyIdentity = vi.fn();
const mockFindOrCreateUser = vi.fn();
const mockIssueSession = vi.fn();

vi.mock("h3", () => ({
    defineEventHandler: vi.fn((handler: any) => handler),
    getQuery: (...args: unknown[]) => mockGetQuery(...args),
    sendRedirect: (...args: unknown[]) => mockSendRedirect(...args),
    createError: (...args: unknown[]) => mockCreateError(...args),
}));

Object.assign(globalThis, {
    defineEventHandler: vi.fn((handler: any) => handler),
    getQuery: mockGetQuery,
    sendRedirect: mockSendRedirect,
    createError: mockCreateError,
});

vi.mock("~~/server/services/auth/google-oauth", () => ({
    consumeGoogleOAuthFlowCookie: (...args: unknown[]) => mockConsumeFlow(...args),
    exchangeGoogleAuthCode: (...args: unknown[]) => mockExchangeCode(...args),
    verifyGoogleIdentity: (...args: unknown[]) => mockVerifyIdentity(...args),
    findOrCreateGoogleUser: (...args: unknown[]) => mockFindOrCreateUser(...args),
    issueAuthSession: (...args: unknown[]) => mockIssueSession(...args),
}));

describe("API: /api/v1/auth/google/callback.get", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejects callback when code or state is missing", async () => {
        mockGetQuery.mockReturnValue({});
        const handler = (await import("~~/server/api/v1/auth/google/callback.get")).default;

        await expect(handler({} as any)).resolves.toEqual({
            location: "/login?oauthError=google_signin_failed",
            statusCode: 302,
        });
    });

    it("rejects callback when provider returns an error", async () => {
        mockGetQuery.mockReturnValue({
            error: "access_denied",
            error_description: "User denied",
        });
        const handler = (await import("~~/server/api/v1/auth/google/callback.get")).default;

        await expect(handler({} as any)).resolves.toEqual({
            location: "/login?oauthError=google_signin_failed",
            statusCode: 302,
        });
    });

    it("rejects callback on state mismatch", async () => {
        mockGetQuery.mockReturnValue({
            code: "oauth-code",
            state: "incoming-state",
        });
        mockConsumeFlow.mockReturnValue({
            state: "different-state",
            codeVerifier: "verifier",
            redirectTo: "/home",
            createdAt: Date.now(),
        });

        const handler = (await import("~~/server/api/v1/auth/google/callback.get")).default;
        await expect(handler({} as any)).resolves.toEqual({
            location: "/login?oauthError=google_signin_failed",
            statusCode: 302,
        });
    });

    it("redirects to login with a safe error when token exchange fails", async () => {
        mockGetQuery.mockReturnValue({
            code: "oauth-code",
            state: "state-1",
        });
        mockConsumeFlow.mockReturnValue({
            state: "state-1",
            codeVerifier: "verifier-1",
            redirectTo: "/settings",
            createdAt: Date.now(),
        });
        mockExchangeCode.mockRejectedValue(new Error("token exchange failed"));

        const handler = (await import("~~/server/api/v1/auth/google/callback.get")).default;
        await expect(handler({} as any)).resolves.toEqual({
            location: "/login?oauthError=google_signin_failed",
            statusCode: 302,
        });
    });

    it("creates session and redirects to safe destination on valid callback", async () => {
        mockGetQuery.mockReturnValue({
            code: "oauth-code",
            state: "state-1",
        });
        mockConsumeFlow.mockReturnValue({
            state: "state-1",
            codeVerifier: "verifier-1",
            redirectTo: "/settings",
            createdAt: Date.now(),
        });
        mockExchangeCode.mockResolvedValue({ idToken: "id-token" });
        mockVerifyIdentity.mockResolvedValue({
            email: "user@example.com",
            name: "User Name",
            givenName: "User",
        });
        mockFindOrCreateUser.mockResolvedValue("user-id");
        mockIssueSession.mockResolvedValue(undefined);

        const handler = (await import("~~/server/api/v1/auth/google/callback.get")).default;
        const result = await handler({} as any);

        expect(mockExchangeCode).toHaveBeenCalledWith(expect.anything(), {
            code: "oauth-code",
            codeVerifier: "verifier-1",
        });
        expect(mockVerifyIdentity).toHaveBeenCalledWith(expect.anything(), "id-token");
        expect(mockFindOrCreateUser).toHaveBeenCalledTimes(1);
        expect(mockIssueSession).toHaveBeenCalledWith(expect.anything(), "user-id");
        expect(result).toEqual({
            location: "/settings",
            statusCode: 302,
        });
    });
});
