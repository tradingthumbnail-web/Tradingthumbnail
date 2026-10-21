import { Polar } from "@polar-sh/sdk";
import type { H3Event } from "h3";

export type PolarServer = "sandbox" | "production";

export function getPolarConfig(event?: H3Event) {
    const config = event ? useRuntimeConfig(event) : useRuntimeConfig();
    const accessToken = config.polar?.accessToken as string | undefined;
    const webhookSecret = config.polar?.webhookSecret as string | undefined;
    const server = (config.polar?.server === "production" ? "production" : "sandbox") as PolarServer;
    return { accessToken, webhookSecret, server };
}

export function createPolarClient(event?: H3Event): Polar {
    const { accessToken, server } = getPolarConfig(event);
    if (!accessToken) {
        throw createError({ statusCode: 503, statusMessage: "Polar is not configured" });
    }
    return new Polar({ accessToken, server });
}
