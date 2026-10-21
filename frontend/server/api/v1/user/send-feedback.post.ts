import { Resend } from "resend";
import Handlebars from "handlebars";

import { sanitizeHtml, sanitizeText } from "~~/server/utils/sanitize";
import { log } from "~~/server/utils/logger";
import { CLICKLAB_EMAIL_FROM } from "~~/shared/clicklab/email";
import { CLICKLAB_PRODUCT_NAME, CLICKLAB_SUPPORT_EMAIL } from "~~/shared/clicklab/brand";

type Mood = { value: number; label: string; emoji: string }

interface FeedbackPayload {
    rating: string,
    mood: Mood,
    comment: string,
    path: string,
    createdAt: string,
}

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    const config = useRuntimeConfig(event);
    const resendKey = config.resendApiKey;
    if (!resendKey) {
        throw createError({ statusCode: 500, statusMessage: 'Resend API key is not configured' });
    };

    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    };

    const payload = await readBody<FeedbackPayload>(event);
    if (!payload) {
        throw createError({ statusCode: 400, statusMessage: 'Payload is required' });
    };

    try {
        const resend = new Resend(resendKey);
        const template = Handlebars.compile(HTML_TEMPLATE_FOR_FEEDBACK);
        const ratingNumber = Math.max(0, Math.min(5, Number(payload.rating)));
        const htmlContent = template({
            rating: ratingNumber,
            ratingPercent: ratingNumber * 20,
            moodLabel: sanitizeHtml(payload.mood?.label),
            moodEmoji: sanitizeText(payload.mood?.emoji),
            comment: sanitizeHtml(payload.comment),
            path: sanitizeHtml(payload.path),
            username: sanitizeHtml(user.username),
            email: sanitizeHtml(user.email),
            createdAt: sanitizeHtml(payload.createdAt),
        });
        await resend.emails.send({
            from: CLICKLAB_EMAIL_FROM,
            to: CLICKLAB_SUPPORT_EMAIL,
            cc: user.email,
            subject: `New feedback received - ${CLICKLAB_PRODUCT_NAME}`,
            html: htmlContent,
        });
    } catch (error) {
        log.error("Error sending feedback", error, { userId: user.id });
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});

const HTML_TEMPLATE_FOR_FEEDBACK = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ClickLab – User Feedback</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                background-color: #F6F7FB;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                color: #222222;
                line-height: 1.5;
            }
            .container {
                max-width: 640px;
                margin: 0 auto;
                padding: 24px 20px;
            }
            .card {
                background-color: #FFFFFF;
                border-radius: 12px;
                border: 1px solid #E5E7EB;
                overflow: hidden;
            }
            .header-bar {
                background-color: #7C3AED;
                color: #FFFFFF;
                padding: 16px 20px;
                font-weight: 600;
                font-size: 16px;
                letter-spacing: 0.5px;
            }
            .section {
                padding: 16px 20px;
                border-top: 1px solid #E5E7EB;
            }
            .label {
                font-size: 12px;
                text-transform: uppercase;
                color: #666666;
                letter-spacing: 0.08em;
                margin-bottom: 8px;
                display: block;
            }
            .rating-value {
                font-size: 18px;
                font-weight: 600;
                color: #222222;
                margin-bottom: 8px;
            }
            .rating-bar {
                height: 8px;
                background-color: #E5E7EB;
                border-radius: 999px;
                overflow: hidden;
            }
            .rating-fill {
                height: 100%;
                background-color: #7C3AED;
            }
            .mood-chip {
                display: inline-block;
                background-color: #E5E7EB;
                padding: 6px 10px;
                border-radius: 999px;
                font-size: 13px;
                color: #222222;
            }
            .comment {
                background-color: #FCFCFD;
                padding: 12px 14px;
                border-radius: 8px;
                border-left: 4px solid #7C3AED;
                line-height: 1.6;
                word-wrap: break-word;
                color: #222222;
            }
            .meta-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px 16px;
            }
            .meta-item {
                background-color: #FCFCFD;
                border: 1px solid #E5E7EB;
                border-radius: 8px;
                padding: 10px 12px;
            }
            .meta-key {
                display: block;
                font-size: 11px;
                text-transform: uppercase;
                color: #999999;
                letter-spacing: 0.06em;
                margin-bottom: 4px;
            }
            .meta-val {
                word-break: break-word;
                font-size: 13px;
                color: #222222;
            }
            @media (max-width: 480px) {
                .meta-grid { grid-template-columns: 1fr; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="card">
                <div class="header-bar">New ClickLab feedback received</div>
                <div class="section">
                    <span class="label">Rating</span>
                    <div class="rating-value">{{rating}}/5</div>
                    <div class="rating-bar">
                        <div class="rating-fill" style="width: {{ratingPercent}}%;"></div>
                    </div>
                </div>
                <div class="section">
                    <span class="label">Mood</span>
                    <div class="mood-chip">{{moodEmoji}} {{moodLabel}}</div>
                </div>
                <div class="section">
                    <span class="label">Comment</span>
                    <div class="comment">{{comment}}</div>
                </div>
                <div class="section">
                    <span class="label">Details</span>
                    <div class="meta-grid">
                        <div class="meta-item">
                            <span class="meta-key">Page</span>
                            <span class="meta-val">{{path}}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-key">Submitted</span>
                            <span class="meta-val">{{createdAt}}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-key">Username</span>
                            <span class="meta-val">{{username}}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-key">Email</span>
                            <span class="meta-val">{{email}}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
`