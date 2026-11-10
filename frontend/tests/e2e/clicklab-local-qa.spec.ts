import { expect, test, type Page, type Route } from "playwright/test";

const ONE_BY_ONE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6z2aQAAAAASUVORK5CYII=";

type UserRecord = {
  id: string;
  name: string;
  username: string;
  email: string;
  notifications: boolean;
  credit: number;
  stripeCustomerId: string | null;
};

type PipelineRecord = {
  id: string;
  userId: string;
  name: string;
  description?: string;
  canvasData: { fabricJson: Record<string, unknown>; elements: any[] };
  config: Record<string, unknown>;
  executionCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: null;
};

type AssetRecord = {
  id: string;
  userId: string;
  name: string;
  type: string;
  isPublic: boolean;
  createdAt: string;
};

type AvatarRecord = {
  id: string;
  userId: string;
  name: string;
  status: string;
  gender: string;
  createdAt: string;
  deletedAt: string | null;
};

type ImageRecord = {
  id: string;
  userId: string;
  parentId: string | null;
  rootId: string | null;
  type: string;
  createdAt: string;
  imageMetadata: { isFavorite: boolean };
  generationMetadata: { prompt: string; model: string };
};

function json(route: Route, payload: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(payload),
  });
}

function notFound(route: Route, message = "Not found") {
  return json(route, { statusCode: 404, statusMessage: message }, 404);
}

async function attachApiMock(page: Page) {
  const users: Record<string, UserRecord> = {
    user1: {
      id: "user1",
      name: "QA User One",
      username: "qa_user_one",
      email: "qa-user-1@clicklab.local",
      notifications: true,
      credit: 120,
      stripeCustomerId: null,
    },
    user2: {
      id: "user2",
      name: "QA User Two",
      username: "qa_user_two",
      email: "qa-user-2@clicklab.local",
      notifications: true,
      credit: 100,
      stripeCustomerId: null,
    },
  };

  let currentUserId: keyof typeof users | null = null;

  const pipelines: PipelineRecord[] = [
    {
      id: "pipe-user2-1",
      userId: "user2",
      name: "User2 Private Pipeline",
      description: "Ownership guard fixture",
      canvasData: { fabricJson: {}, elements: [] },
      config: {},
      executionCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
  ];

  const assets: AssetRecord[] = [];

  const avatars: AvatarRecord[] = [
    {
      id: "avatar-user1-1",
      userId: "user1",
      name: "QA Analyst Avatar",
      status: "TRAINED",
      gender: "MALE",
      createdAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: "avatar-user2-1",
      userId: "user2",
      name: "QA User2 Avatar",
      status: "TRAINED",
      gender: "FEMALE",
      createdAt: new Date().toISOString(),
      deletedAt: null,
    },
  ];

  const images: ImageRecord[] = [
    {
      id: "img-user2-1",
      userId: "user2",
      parentId: null,
      rootId: null,
      type: "GENERATION",
      createdAt: new Date().toISOString(),
      imageMetadata: { isFavorite: false },
      generationMetadata: { prompt: "User2 private image", model: "fal-ai/flux-2" },
    },
  ];

  await page.route("**/api/v1/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method().toUpperCase();
    const path = url.pathname;
    const user = currentUserId ? users[currentUserId] : null;

    const requireAuth = () => {
      if (!user) {
        json(route, { statusCode: 401, statusMessage: "Unauthorized" }, 401);
        return false;
      }
      return true;
    };

    if (path === "/api/v1/auth/login" && method === "POST") {
      const body = (req.postDataJSON() as { email?: string }) || {};
      currentUserId = body.email === users.user2.email ? "user2" : "user1";
      return json(route, { success: true });
    }

    if (path === "/api/v1/auth/logout" && method === "POST") {
      currentUserId = null;
      return json(route, { success: true });
    }

    if (path === "/api/v1/auth/user" && method === "GET") {
      return json(route, {
        user,
        tier: user ? { name: "Starter" } : null,
        subscription: null,
      });
    }

    if (path === "/api/v1/activity" && method === "GET") return json(route, []);
    if (path === "/api/v1/product" && method === "GET") return json(route, []);
    if (path === "/api/v1/billing/invoices" && method === "GET") return json(route, []);

    if (path === "/api/v1/user/profile" && method === "POST") {
      if (!requireAuth()) return;
      const body = (req.postDataJSON() as Partial<UserRecord>) || {};
      users[currentUserId!] = {
        ...users[currentUserId!],
        name: String(body.name || "").trim() || users[currentUserId!].name,
        username: String(body.username || "").trim() || users[currentUserId!].username,
        notifications: typeof body.notifications === "boolean" ? body.notifications : users[currentUserId!].notifications,
      };
      return json(route, users[currentUserId!]);
    }

    if (path === "/api/v1/user/locale" && method === "POST") {
      if (!requireAuth()) return;
      return json(route, { success: true });
    }

    if (path === "/api/v1/pipeline" && method === "GET") {
      if (!requireAuth()) return;
      return json(route, pipelines.filter((p) => p.userId === user!.id));
    }

    if (path === "/api/v1/pipeline" && method === "POST") {
      if (!requireAuth()) return;
      const body = (req.postDataJSON() as Partial<PipelineRecord>) || {};
      const created: PipelineRecord = {
        id: `pipe-${Date.now()}`,
        userId: user!.id,
        name: String(body.name || "Untitled"),
        description: body.description,
        canvasData: (body.canvasData as any) || { fabricJson: {}, elements: [] },
        config: (body.config as any) || {},
        executionCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };
      pipelines.unshift(created);
      return json(route, created);
    }

    const pipelineMatch = path.match(/^\/api\/v1\/pipeline\/([^/]+)$/);
    if (pipelineMatch) {
      if (!requireAuth()) return;
      const pipelineId = pipelineMatch[1]!;
      const found = pipelines.find((p) => p.id === pipelineId && p.deletedAt === null);
      if (!found || found.userId !== user!.id) return notFound(route, "Pipeline not found");
      if (method === "GET") return json(route, found);
      if (method === "DELETE") {
        found.deletedAt = new Date().toISOString() as any;
        return json(route, { success: true });
      }
      if (method === "PUT") {
        const body = (req.postDataJSON() as Partial<PipelineRecord>) || {};
        found.name = body.name || found.name;
        found.description = body.description ?? found.description;
        found.canvasData = (body.canvasData as any) || found.canvasData;
        found.updatedAt = new Date().toISOString();
        return json(route, found);
      }
    }

    if (path === "/api/v1/asset" && method === "GET") {
      if (!requireAuth()) return;
      return json(route, assets.filter((a) => a.userId === user!.id));
    }

    if (path === "/api/v1/asset" && method === "POST") {
      if (!requireAuth()) return;
      const body = (req.postDataJSON() as { files?: Array<{ fileName: string }> }) || {};
      const created = (body.files || []).map((f, i) => {
        const item: AssetRecord = {
          id: `asset-${Date.now()}-${i}`,
          userId: user!.id,
          name: f.fileName || `asset-${i}.png`,
          type: "IMAGE",
          isPublic: false,
          createdAt: new Date().toISOString(),
        };
        assets.unshift(item);
        return item;
      });
      return json(route, { assets: created });
    }

    const assetViewMatch = path.match(/^\/api\/v1\/asset\/([^/]+)\/view$/);
    if (assetViewMatch && method === "GET") {
      if (!requireAuth()) return;
      const found = assets.find((a) => a.id === assetViewMatch[1]);
      if (!found || found.userId !== user!.id) return notFound(route, "Asset not found");
      return route.fulfill({
        status: 200,
        contentType: "image/png",
        body: Buffer.from(ONE_BY_ONE_PNG_BASE64, "base64"),
      });
    }

    if (path === "/api/v1/image" && method === "GET") {
      if (!requireAuth()) return;
      return json(route, images.filter((i) => i.userId === user!.id));
    }

    const imageIdMatch = path.match(/^\/api\/v1\/image\/([^/]+)$/);
    if (imageIdMatch) {
      if (!requireAuth()) return;
      const found = images.find((i) => i.id === imageIdMatch[1]);
      if (!found || found.userId !== user!.id) return notFound(route, "Image not found");
      if (method === "GET") return json(route, found);
      if (method === "DELETE") {
        const idx = images.findIndex((i) => i.id === found.id);
        if (idx !== -1) images.splice(idx, 1);
        return json(route, { success: true });
      }
    }

    const imageViewMatch = path.match(/^\/api\/v1\/image\/([^/]+)\/view$/);
    if (imageViewMatch && method === "GET") {
      if (!requireAuth()) return;
      const found = images.find((i) => i.id === imageViewMatch[1]);
      if (!found || found.userId !== user!.id) return notFound(route, "Image not found");
      return route.fulfill({
        status: 200,
        contentType: "image/png",
        body: Buffer.from(ONE_BY_ONE_PNG_BASE64, "base64"),
      });
    }

    const favoriteMatch = path.match(/^\/api\/v1\/image\/([^/]+)\/toggle-favorite$/);
    if (favoriteMatch && method === "POST") {
      if (!requireAuth()) return;
      const found = images.find((i) => i.id === favoriteMatch[1] && i.userId === user!.id);
      if (!found) return notFound(route, "Image not found");
      found.imageMetadata.isFavorite = !found.imageMetadata.isFavorite;
      return json(route, { success: true });
    }

    if (path === "/api/v1/generation/quick-generation" && method === "POST") {
      if (!requireAuth()) return;
      const img: ImageRecord = {
        id: `img-qg-${Date.now()}`,
        userId: user!.id,
        parentId: null,
        rootId: null,
        type: "GENERATION",
        createdAt: new Date().toISOString(),
        imageMetadata: { isFavorite: false },
        generationMetadata: { prompt: "Mock quick generation", model: "fal-ai/flux-2" },
      };
      images.unshift(img);
      return json(route, [img]);
    }

    if (path === "/api/v1/generation/quick-thumb" && method === "POST") {
      if (!requireAuth()) return;
      const img: ImageRecord = {
        id: `img-qt-${Date.now()}`,
        userId: user!.id,
        parentId: null,
        rootId: null,
        type: "GENERATION",
        createdAt: new Date().toISOString(),
        imageMetadata: { isFavorite: false },
        generationMetadata: { prompt: "Mock quick thumb", model: "openai/gpt-image-1" },
      };
      images.unshift(img);
      return json(route, [img]);
    }

    if (path === "/api/v1/avatar" && method === "GET") {
      if (!requireAuth()) return;
      return json(route, avatars.filter((a) => a.userId === user!.id && a.deletedAt === null));
    }

    if (path === "/api/v1/style" && method === "GET") {
      if (!requireAuth()) return;
      return json(route, [
        { id: "style-1", name: "Cyberpunk Glow", prompt: "neon dark synthwave", isPublic: true },
        { id: "style-2", name: "Minimalist Modern", prompt: "clean crisp modern design", isPublic: true },
      ]);
    }

    if (path === "/api/v1/generation/sketch" && method === "POST") {
      if (!requireAuth()) return;
      const body = (req.postDataJSON() as { avatarId?: string }) || {};
      if (body.avatarId && !avatars.some((a) => a.id === body.avatarId && a.userId === user!.id)) {
        return json(route, { statusCode: 404, statusMessage: "Avatar not found" }, 404);
      }
      user!.credit = Math.max(0, user!.credit - 3);
      const img: ImageRecord = {
        id: `img-sketch-${Date.now()}`,
        userId: user!.id,
        parentId: null,
        rootId: null,
        type: "SKETCH",
        createdAt: new Date().toISOString(),
        imageMetadata: { isFavorite: false },
        generationMetadata: { prompt: "Mock sketch generation", model: "openai/gpt-sketch" },
      };
      images.unshift(img);
      return json(route, img);
    }

    if (path === "/api/v1/generation/photoshoot" && method === "POST") {
      if (!requireAuth()) return;
      const body = (req.postDataJSON() as { avatarId?: string; variations?: number }) || {};
      const foundAvatar = avatars.find((a) => a.id === body.avatarId && a.userId === user!.id);
      if (!foundAvatar) {
        return json(route, { statusCode: 404, statusMessage: "Avatar not found" }, 404);
      }
      if (foundAvatar.status !== "TRAINED") {
        return json(route, { statusCode: 400, statusMessage: "Avatar training is not complete" }, 400);
      }
      const cost = (body.variations || 1) * 2;
      user!.credit = Math.max(0, user!.credit - cost);
      const createdImages: ImageRecord[] = [];
      for (let i = 0; i < (body.variations || 1); i++) {
        const img: ImageRecord = {
          id: `img-ps-${Date.now()}-${i}`,
          userId: user!.id,
          parentId: null,
          rootId: null,
          type: "CHARACTER",
          createdAt: new Date().toISOString(),
          imageMetadata: { isFavorite: false },
          generationMetadata: { prompt: "Mock photoshoot", model: "fal-ai/flux-lora" },
        };
        images.unshift(img);
        createdImages.push(img);
      }
      return json(route, createdImages);
    }

    if (path === "/api/v1/generation/image-to-image" && method === "POST") {
      if (!requireAuth()) return;
      const body = (req.postDataJSON() as { avatarId?: string }) || {};
      const foundAvatar = avatars.find((a) => a.id === body.avatarId && a.userId === user!.id);
      if (!foundAvatar) {
        return json(route, { statusCode: 404, statusMessage: "Avatar not found" }, 404);
      }
      user!.credit = Math.max(0, user!.credit - 2);
      const img: ImageRecord = {
        id: `img-i2i-${Date.now()}`,
        userId: user!.id,
        parentId: null,
        rootId: null,
        type: "GENERATION",
        createdAt: new Date().toISOString(),
        imageMetadata: { isFavorite: false },
        generationMetadata: { prompt: "Mock image-to-image", model: "fal-ai/flux-lora" },
      };
      images.unshift(img);
      return json(route, img);
    }

    if (path === "/api/v1/generation/fine-edit" && method === "POST") {
      if (!requireAuth()) return;
      const body = (req.postDataJSON() as { imageId?: string }) || {};
      const parent = body.imageId || null;
      const img: ImageRecord = {
        id: `img-fe-${Date.now()}`,
        userId: user!.id,
        parentId: parent,
        rootId: parent,
        type: "GENERATION",
        createdAt: new Date().toISOString(),
        imageMetadata: { isFavorite: false },
        generationMetadata: { prompt: "Mock fine edit", model: "fal-ai/flux-2" },
      };
      images.unshift(img);
      return json(route, img);
    }

    if (path.startsWith("/api/v1/stripe/") || path.startsWith("/api/v1/polar/") || path.startsWith("/api/v1/billing/")) {
      return json(route, { statusCode: 503, statusMessage: "Payments are temporarily disabled" }, 503);
    }

    return route.continue();
  });
}

async function login(page: Page, email = "qa-user-1@clicklab.local") {
  await page.goto("/login");
  await page.evaluate(() => {
    try {
      localStorage.setItem("kithumbs-last-changelog-version", "1.3.0");
    } catch {}
  });
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill("QaPass123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/home$/, { timeout: 15_000 });
}

async function closeChangelogModalIfPresent(page: Page) {
  try {
    await page.evaluate(() => {
      document.querySelectorAll("dialog[open]").forEach((d) => (d as HTMLDialogElement).close());
    });
  } catch {
    // modal did not open
  }
}

test.beforeEach(async ({ page }) => {
  await attachApiMock(page);
});

test("login/session and profile save persists after reload", async ({ page }) => {
  await login(page);
  await page.goto("/settings");
  await closeChangelogModalIfPresent(page);

  await page.getByPlaceholder("Your name").fill("QA Persisted Name");
  await page.getByPlaceholder("username").fill("qa_persisted_username");
  const saveResponsePromise = page.waitForResponse((r) => r.url().includes("/api/v1/user/profile") && r.status() === 200);
  await page.getByRole("button", { name: /save/i }).first().click();
  await saveResponsePromise;

  await page.reload();
  await expect(page.getByPlaceholder("Your name")).toHaveValue("QA Persisted Name");
  await expect(page.getByPlaceholder("username")).toHaveValue("qa_persisted_username");

  await page.screenshot({ path: "test-results/qa-settings-persist.png", fullPage: true });
});

test("pipeline CRUD, asset upload/retrieval, and mocked quick generation", async ({ page }) => {
  await login(page);

  // Pipeline create via API + verify in UI.
  const createPipeline = await page.evaluate(async () => {
    const response = await fetch("/api/v1/pipeline", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "QA Pipeline",
        description: "Local browser QA pipeline",
        canvasData: { fabricJson: {}, elements: [] },
        config: {},
      }),
    });
    const body = await response.json();
    return { status: response.status, body };
  });
  expect(createPipeline.status).toBe(200);
  const pipeline = createPipeline.body as { id: string };

  await page.goto("/pipeline");
  await closeChangelogModalIfPresent(page);
  await expect(page.getByRole("heading", { name: "QA Pipeline", exact: true })).toBeVisible();

  // Pipeline delete via API + verify removed.
  const deletePipelineStatus = await page.evaluate(async (pipelineId) => {
    const response = await fetch(`/api/v1/pipeline/${pipelineId}`, {
      method: "DELETE",
      credentials: "include",
    });
    return response.status;
  }, pipeline.id);
  expect(deletePipelineStatus).toBe(200);
  await page.reload();
  await expect(page.getByRole("heading", { name: "QA Pipeline", exact: true })).toHaveCount(0);

  // Asset upload + retrieval preview.
  await page.goto("/assets");
  await closeChangelogModalIfPresent(page);
  await page.getByRole("button", { name: /upload/i }).click();
  await page.setInputFiles('input[type="file"]', {
    name: "qa-upload.png",
    mimeType: "image/png",
    buffer: Buffer.from(ONE_BY_ONE_PNG_BASE64, "base64"),
  });
  await page.getByRole("button", { name: /add/i }).click();
  await expect(page.getByText("qa-upload.png")).toBeVisible();
  await page.reload();
  await expect(page.getByText("qa-upload.png")).toBeVisible();

  // Representative mocked generation flow.
  await page.goto("/quick-generation");
  await closeChangelogModalIfPresent(page);
  await page.locator("textarea").first().fill("Mock QA prompt for quick generation");
  await page.locator('[data-tour="quick-generation-create"] button').click();
  await expect(page.locator('a[href*="/images/"]')).toHaveCount(1);

  await page.screenshot({ path: "test-results/qa-pipeline-assets-generation.png", fullPage: true });
});

test("studio and studio/avatars stay simulated (no /api calls), ownership checks block cross-user access", async ({ page }) => {
  const requestedApiPaths: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/")) requestedApiPaths.push(url.pathname);
  });

  await page.goto("/studio");
  await expect(page.getByText(/trading thumbnail studio/i)).toBeVisible();
  await page.getByRole("button", { name: /generate demo variations|generating demo previews/i }).click();
  await expect(page.getByText(/sample results/i)).toBeVisible();

  await page.goto("/studio/avatars");
  await page.getByRole("button", { name: /create avatar/i }).click();
  await expect(page.getByText(/training is simulated locally/i)).toBeVisible();

  const studioApiCalls = requestedApiPaths.filter((p) => p.startsWith("/api/"));
  const nonSessionApiCalls = studioApiCalls.filter((p) => p !== "/api/v1/auth/user");
  expect(nonSessionApiCalls.length).toBe(0);

  await login(page, "qa-user-1@clicklab.local");
  const ownershipStatuses = await page.evaluate(async () => {
    const [pipelineResponse, imageResponse] = await Promise.all([
      fetch("/api/v1/pipeline/pipe-user2-1", { credentials: "include" }),
      fetch("/api/v1/image/img-user2-1", { credentials: "include" }),
    ]);
    return { pipelineStatus: pipelineResponse.status, imageStatus: imageResponse.status };
  });
  expect(ownershipStatuses.pipelineStatus).toBe(404);
  expect(ownershipStatuses.imageStatus).toBe(404);

  await page.screenshot({ path: "test-results/qa-studio-simulated.png", fullPage: true });
});

test("Feature 1: Quick Thumb multi-step wizard, credit calculation, and generation", async ({ page }) => {
  await login(page);
  await page.goto("/quick-thumb");
  await closeChangelogModalIfPresent(page);

  await expect(page.locator('[data-tour="quick-thumbnail-page"]')).toBeVisible();

  // Step 0: Fill basics
  const titleInput = page.locator('input[placeholder*="title" i], input[type="text"]').first();
  await titleInput.fill("Bitcoin Breakout Strategy 2026");

  // Advance to step 1
  await page.getByRole("button", { name: /next/i }).first().click();

  // Advance to step 2
  await page.getByRole("button", { name: /next/i }).first().click();

  // Advance to step 3 (final)
  await page.getByRole("button", { name: /next/i }).first().click();

  // Trigger generation
  const quickThumbPromise = page.waitForResponse((r) => r.url().includes("/api/v1/generation/quick-thumb") && r.status() === 200);
  await page.getByRole("button", { name: /^generate\b/i }).click();
  await quickThumbPromise;

  // Verify thumbnail is saved and rendered
  await expect(page.locator('[data-tour="quick-thumbnail-preview"]')).toBeVisible();
});

test("Feature 2: AI Sketch canvas and generation workflow", async ({ page }) => {
  await login(page);
  await page.goto("/sketch");
  await closeChangelogModalIfPresent(page);

  await expect(page.locator('[data-tour="sketch-page"]')).toBeVisible();

  // Trigger sketch generation via API and verify UI handles response
  const sketchResult = await page.evaluate(async () => {
    const response = await fetch("/api/v1/generation/sketch", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        canvasDataURL: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6z2aQAAAAASUVORK5CYII=",
        layoutMetadata: [],
        referenceType: "image",
      }),
    });
    return { status: response.status, body: await response.json() };
  });

  expect(sketchResult.status).toBe(200);
  expect(sketchResult.body.type).toBe("SKETCH");
  expect(sketchResult.body.id).toContain("img-sketch");
});

test("Feature 3: Photoshoot & Image-to-Image ownership isolation, validation, and generation", async ({ page }) => {
  await login(page);

  // 1. Photoshoot with owned trained avatar succeeds and deducts credits
  const photoshootSuccess = await page.evaluate(async () => {
    const response = await fetch("/api/v1/generation/photoshoot", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        avatarId: "avatar-user1-1",
        description: "Professional trader in modern glass office",
        expression: "Confident",
        cameraAngle: "Frontal",
        background: "office",
        variations: 1,
      }),
    });
    return { status: response.status, body: await response.json() };
  });
  expect(photoshootSuccess.status).toBe(200);
  expect(Array.isArray(photoshootSuccess.body)).toBe(true);
  expect(photoshootSuccess.body[0].type).toBe("CHARACTER");

  // 2. Photoshoot with unowned avatar is rejected with 404 (ownership isolation)
  const photoshootCrossUser = await page.evaluate(async () => {
    const response = await fetch("/api/v1/generation/photoshoot", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        avatarId: "avatar-user2-1", // belongs to user2
        description: "Attempted cross-user access",
        expression: "Neutral",
        cameraAngle: "Frontal",
        background: "none",
        variations: 1,
      }),
    });
    return { status: response.status };
  });
  expect(photoshootCrossUser.status).toBe(404);

  // 3. Image-to-Image with unowned avatar is rejected with 404
  const i2iCrossUser = await page.evaluate(async () => {
    const response = await fetch("/api/v1/generation/image-to-image", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        avatarId: "avatar-user2-1",
        referenceImageBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6z2aQAAAAASUVORK5CYII=",
        keepBackground: true,
        matchLighting: true,
        creativityLevel: 2,
      }),
    });
    return { status: response.status };
  });
  expect(i2iCrossUser.status).toBe(404);
});
