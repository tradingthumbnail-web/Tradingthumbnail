import OpenAI from "openai";

const config = useRuntimeConfig();
const openaiApiKey = config.openaiApiKey;
if (!openaiApiKey) {
    console.error("-x- OpenAI API key is not set");
    throw createError({
        statusMessage: "Missing configuration parameters",
        statusCode: 500,
    });
};

export const openai = new OpenAI({
    apiKey: openaiApiKey,
});