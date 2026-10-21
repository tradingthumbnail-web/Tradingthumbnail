export function isSignupEnabled(enableSignIn: unknown): boolean {
    if (typeof enableSignIn === "boolean") {
        return enableSignIn;
    }
    if (typeof enableSignIn === "string") {
        return enableSignIn.toLowerCase() !== "false";
    }
    return true;
}

export function assertSignupEnabled(enableSignIn: unknown): void {
    if (!isSignupEnabled(enableSignIn)) {
        throw createError({
            statusCode: 403,
            statusMessage: "Sign in is not enabled",
        });
    }
}
