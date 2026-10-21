import { requireUserId } from "~~/server/utils/require-user";

export default defineEventHandler(async (event) => {
    const userId = requireUserId(event);
    const user = event.context.user;

    return {
        statusCode: 200,
        statusMessage: "Credits are charged by generation endpoints",
        remainingCredits: user?.credit ?? 0,
        userId,
    };
});
