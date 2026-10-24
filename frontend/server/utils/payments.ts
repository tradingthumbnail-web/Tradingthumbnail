const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

export function isPaymentsEnabledValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  return TRUE_VALUES.has(value.trim().toLowerCase());
}

export function isPaymentsEnabled(event?: Parameters<typeof useRuntimeConfig>[0]): boolean {
  const config = useRuntimeConfig(event);
  return isPaymentsEnabledValue(config.public?.enablePayments);
}

export function assertPaymentsEnabled(event?: Parameters<typeof useRuntimeConfig>[0]): void {
  if (isPaymentsEnabled(event)) return;
  throw createError({
    statusCode: 503,
    statusMessage: "Payments are temporarily disabled",
  });
}

