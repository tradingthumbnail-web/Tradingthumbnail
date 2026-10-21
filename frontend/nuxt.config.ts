import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  app: {
    head: {
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
    },
  },
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  modules: ['@nuxt/icon', '@nuxtjs/i18n', '@pinia/nuxt', 'nuxt-vue3-google-signin', 'nuxt-security'],

  security: {
    headers: false,
    rateLimiter: {
      tokensPerInterval: 5_000,
      interval: 30_000,
      headers: false,
      whiteList: [],
      throwError: true,
      driver: { name: 'lruCache' }
    }
  },

  routeRules: {
    '/blog': { redirect: { to: 'https://kithumbs.com/blog', statusCode: 302 } },
    '/graph': {
      security: {
        rateLimiter: {
          tokensPerInterval: 10_000,
          interval: 60_000,
          headers: false,
          whiteList: [],
          throwError: false,
        }
      }
    },
    '/api/v1/generation/sketch': {
      security: {
        requestSizeLimiter: {
          maxRequestSizeInBytes: 4_000_000,
          maxUploadFileRequestInBytes: 4_000_000,
          throwError: true,
        }
      }
    }
  },

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      // Avoid pre-bundling dynamic webgpu import which breaks optimize step
      exclude: ['onnxruntime-web', '@imgly/background-removal'],
    },
  },
  css: [
    '~/assets/styles/main.css',
    '~/assets/styles/clicklab.css',
    '~/assets/styles/branch-lanes.css',
    '~/assets/styles/fonts.css',
    '~/assets/styles/animation.css',
    'v-network-graph/lib/style.css',
  ],

  i18n: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', iso: 'en-US', name: 'English', file: 'en.ts' },
      { code: 'es', iso: 'es-ES', name: 'Español', file: 'es.ts' },
      { code: 'ca', iso: 'ca-ES', name: 'Català', file: 'ca.ts' },
    ],
    strategy: 'no_prefix',
    // English on first open; user can switch in Settings (cookie via locale-preference plugin).
    detectBrowserLanguage: false,
  },

  googleSignIn: {
    clientId: process.env.NUXT_GOOGLE_CLIENT_ID || "594613851325-oqmrpqbhdeb9enrfa8rqslobm9jacsup.apps.googleusercontent.com",
  },

  runtimeConfig: {
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL,
      enableSignIn: process.env.NUXT_PUBLIC_ENABLE_SIGN_IN ?? 'true',
      posthog: {
        key: process.env.NUXT_PUBLIC_POSTHOG_PUBLIC_KEY,
        host: process.env.NUXT_PUBLIC_POSTHOG_HOST,
      }
    },
    databaseConnectionString: process.env.NUXT_DATABASE_CONNECTION_STRING,
    resendApiKey: process.env.NUXT_RESEND_API_KEY,
    stripe: {
      publishableKey: process.env.NUXT_STRIPE_PUBLISHABLE_KEY,
      secretKey: process.env.NUXT_STRIPE_SECRET_KEY,
      webhookSecret: {
        payment: process.env.NUXT_STRIPE_WEBHOOK_SECRET_PAYMENT,
        billingCycle: process.env.NUXT_STRIPE_WEBHOOK_SECRET_BILLING_CYCLE,
        paymentFailed: process.env.NUXT_STRIPE_WEBHOOK_SECRET_PAYMENT_FAILED,
        cancelSubscription: process.env.NUXT_STRIPE_WEBHOOK_SECRET_CANCEL_SUBSCRIPTION
      }
    },
    polar: {
      accessToken: process.env.NUXT_POLAR_ACCESS_TOKEN,
      webhookSecret: process.env.NUXT_POLAR_WEBHOOK_SECRET,
      server: process.env.NUXT_POLAR_SERVER || 'sandbox',
    },
    s3: {
      accessKeyId: process.env.NUXT_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.NUXT_S3_SECRET_ACCESS_KEY,
      region: process.env.NUXT_S3_REGION,
      bucket: process.env.NUXT_S3_BUCKET,
      endpoint: process.env.NUXT_S3_ENDPOINT,
    },
    falApiKey: process.env.NUXT_FAL_API_KEY,
    openRouterApiKey: process.env.NUXT_OPEN_ROUTER_API_KEY,
    openRouterBaseURL: process.env.NUXT_OPEN_ROUTER_BASE_URL,
    openaiApiKey: process.env.NUXT_OPENAI_API_KEY,

    googleClientId: process.env.NUXT_GOOGLE_CLIENT_ID,
    googleSecretId: process.env.NUXT_GOOGLE_SECRET_ID,
    beehiiv: {
      apiKey: process.env.NUXT_BEEHIIV_API_KEY,
      publicationId: process.env.NUXT_BEEHIIV_PUBLICATION_ID,
    },
  },

  nitro: {
    alias: {
      'libsodium-wrappers': resolve(rootDir, 'node_modules/libsodium-wrappers/dist/modules/libsodium-wrappers.js'),
      libsodium: resolve(rootDir, 'node_modules/libsodium/dist/modules/libsodium.js'),
    },
    externals: {
      inline: ['stripe', '@polar-sh/sdk', 'lru-cache'],
    },
    // Docker/Dokploy: Bun. Vercel/Netlify set VERCEL=1 / NETLIFY=1 and need matching presets.
    preset: process.env.VERCEL ? 'vercel' : process.env.NETLIFY ? 'netlify' : 'bun',
  }
});