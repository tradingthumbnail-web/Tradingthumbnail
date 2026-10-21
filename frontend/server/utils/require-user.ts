import type { H3Event } from "h3";

export function requireUserId(event: H3Event): string {
    const user = event.context.user;
    if (!user?.id) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }
    return user.id;
}
