# Migrations & Environment Tracking

This document tracks database migrations, application versions, and environment-specific deployment information.

## Current Status

### Environments

| Environment | Status | Database Version | App Version | Last Updated | Notes |
|------------|--------|------------------|-------------|--------------|-------|
| **Local** | 🟢 Active | `0004_polar_billing` | `1.3.0` | - | Polar columns added; Stripe columns retained |
| **Staging** | 🟢 Active | `0003_narrow_polaris` | `1.3.0` | - | Pre-production testing |
| **Production** | 🔴 Not migrated | `0003_narrow_polaris` | `1.2.0` | - | Live environment; apply `0004_polar_billing` before Polar checkout |