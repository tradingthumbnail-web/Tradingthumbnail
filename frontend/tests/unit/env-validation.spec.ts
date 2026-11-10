import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockInfo = vi.fn();
const mockWarn = vi.fn();

vi.mock("~~/server/utils/logger", () => ({
    log: {
        info: (...args: unknown[]) => mockInfo(...args),
        warn: (...args: unknown[]) => mockWarn(...args),
    },
}));

const REQUIRED_BASE_ENV = {
    NUXT_DATABASE_CONNECTION_STRING: "postgresql://db",
    NUXT_GOOGLE_CLIENT_ID: "client",
    NUXT_GOOGLE_SECRET_ID: "secret",
    NUXT_S3_ACCESS_KEY_ID: "key",
    NUXT_S3_SECRET_ACCESS_KEY: "secret",
    NUXT_S3_REGION: "auto",
    NUXT_S3_BUCKET: "bucket",
    NUXT_S3_ENDPOINT: "https://example.r2.cloudflarestorage.com",
    NUXT_RESEND_API_KEY: "resend",
} as const;

const PAYMENT_ENV = {
    NUXT_STRIPE_PUBLISHABLE_KEY: "pk",
    NUXT_STRIPE_SECRET_KEY: "sk",
    NUXT_STRIPE_WEBHOOK_SECRET_PAYMENT: "whsec_1",
    NUXT_STRIPE_WEBHOOK_SECRET_BILLING_CYCLE: "whsec_2",
    NUXT_STRIPE_WEBHOOK_SECRET_PAYMENT_FAILED: "whsec_3",
    NUXT_STRIPE_WEBHOOK_SECRET_CANCEL_SUBSCRIPTION: "whsec_4",
    NUXT_POLAR_ACCESS_TOKEN: "polar",
    NUXT_POLAR_WEBHOOK_SECRET: "polar_wh",
} as const;

describe("env-validation", () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        originalEnv = { ...process.env };
        vi.resetModules();
        vi.clearAllMocks();
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it("throws when DB connection string is missing", async () => {
        process.env = {};
        const { validateEnvironmentVariables } = await import("~~/server/utils/env-validation");
        expect(() => validateEnvironmentVariables()).toThrow("Missing required environment variables");
    });

    it("does not require payment keys when payments are disabled", async () => {
        process.env = {
            ...REQUIRED_BASE_ENV,
            NUXT_PUBLIC_ENABLE_PAYMENTS: "false",
        };
        const { validateEnvironmentVariables } = await import("~~/server/utils/env-validation");
        expect(() => validateEnvironmentVariables()).not.toThrow();
        expect(mockInfo).toHaveBeenCalled();
        expect(mockWarn).not.toHaveBeenCalled();
    });

    it("warns about payment keys when payments are enabled", async () => {
        process.env = {
            ...REQUIRED_BASE_ENV,
            NUXT_PUBLIC_ENABLE_PAYMENTS: "true",
            ...PAYMENT_ENV,
        };
        delete process.env.NUXT_STRIPE_SECRET_KEY;
        const { validateEnvironmentVariables } = await import("~~/server/utils/env-validation");
        validateEnvironmentVariables();
        expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining("NUXT_STRIPE_SECRET_KEY"));
    });
});
