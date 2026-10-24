import { isPaymentsEnabled } from "~~/server/utils/payments";

function isBillingApi(path: string): boolean {
  return (
    path.startsWith("/api/v1/stripe/") ||
    path.startsWith("/api/v1/polar/") ||
    path.startsWith("/api/v1/payment") ||
    path.startsWith("/api/v1/billing/invoices") ||
    path.startsWith("/api/v1/billing/unsubscribe")
  );
}

function isPaymentWebhook(path: string): boolean {
  return path.startsWith("/api/webhook/stripe/") || path.startsWith("/api/webhook/polar");
}

export default defineEventHandler((event) => {
  if (isPaymentsEnabled(event)) return;

  const path = getRequestURL(event).pathname;

  if (isPaymentWebhook(path)) {
    setResponseStatus(event, 202);
    return { received: true, paymentsDisabled: true };
  }

  if (isBillingApi(path)) {
    throw createError({
      statusCode: 503,
      statusMessage: "Payments are temporarily disabled",
    });
  }
});

