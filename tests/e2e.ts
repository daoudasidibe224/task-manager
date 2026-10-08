import { chromium, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { spawn, type ChildProcess } from "node:child_process";
import { readdir, readFile, mkdir } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import assert from "node:assert/strict";
const adminUrl =
  process.env.TEST_DATABASE_URL ??
  "postgresql://task_manager@127.0.0.1:55412/postgres";
const database = `task_e2e_${randomUUID().replaceAll("-", "")}`;
const target = new URL(adminUrl);
target.pathname = `/${database}`;
const admin = new Client({ connectionString: adminUrl });
let frontend: ChildProcess | undefined;
await admin.connect();
await admin.query(`CREATE DATABASE "${database}"`);
const db = new Client({ connectionString: target.toString() });
await db.connect();
for (const migration of (await readdir("backend/prisma/migrations")).sort()) {
  if (migration === "migration_lock.toml") continue;
  await db.query(
    await readFile(
      `backend/prisma/migrations/${migration}/migration.sql`,
      "utf8",
    ),
  );
}
await db.end();
process.env.DATABASE_URL = target.toString();
process.env.JWT_SECRET = "e2e-access-secret-at-least-32-characters";
process.env.REFRESH_TOKEN_SECRET = "e2e-refresh-secret-at-least-32-characters";
process.env.FRONTEND_URL = "http://127.0.0.1:4512";
process.env.THROTTLE_LIMIT = "2000";
const { createApplication } = await import("../backend/dist/main.js");
const app = await createApplication();
await app.listen(5012, "127.0.0.1");
const browser = await chromium.launch();
const errors: string[] = [];
const context = await browser.newContext({
  timezoneId: "Pacific/Auckland",
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
const screenshots =
  process.env.E2E_SCREENSHOTS ?? "../../../outputs/screenshots";
await mkdir(screenshots, { recursive: true });
const checkOverflow = async (p: Page) => {
  const overflow = await p.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  assert.equal(overflow, false, "Débordement horizontal");
};
async function screenshot(name: string) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    animations: "disabled",
    path: `${screenshots}/task-${name}.png`,
    fullPage: true,
  });
}
try {
  frontend = spawn(
    process.execPath,
    [
      "node_modules/nuxt/bin/nuxt.mjs",
      "dev",
      "frontend",
      "--host",
      "127.0.0.1",
      "--port",
      "4512",
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NUXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:5012/api",
        NUXT_IGNORE_LOCK: "1",
        NUXT_BUILD_DIR: ".nuxt-e2e",
      },
      stdio: "ignore",
    },
  );
  let ready = false;
  for (let i = 0; i < 90; i++) {
    try {
      if ((await fetch("http://127.0.0.1:4512/login")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await delay(500);
  }
  assert.ok(ready, "Frontend disponible");
  await page.goto("http://127.0.0.1:4512/login");
  await expect(
    page.getByRole("heading", { name: "Se connecter" }),
  ).toBeVisible();
  await delay(700);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page
    .getByRole("link", { name: "Créer un compte", exact: true })
    .click();
  await page.getByLabel("Prénom (facultatif)", { exact: true }).fill("Camille");
  await page.getByLabel("Adresse e-mail").fill("camille@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("GoodPass123");
  await page
    .getByRole("button", { name: "Créer mon compte", exact: true })
    .click();
  await expect(page).toHaveURL(/dashboard/);
  await page
    .getByRole("button", { name: "Se déconnecter", exact: true })
    .click();
  await expect(page).toHaveURL(/login/);
  await page.getByLabel("Adresse e-mail").fill("camille@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("WrongPass123");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("incorrect");
  await expect(page.getByRole("alert")).toBeFocused();
  await page.getByRole("button", { name: "Afficher le mot de passe" }).click();
  await expect(
    page.getByLabel("Mot de passe", { exact: true }),
  ).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Masquer le mot de passe" }).click();
  await page.getByLabel("Mot de passe", { exact: true }).fill("GoodPass123");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(
    page.getByRole("heading", { name: "Vue d’ensemble", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Créer une liste", exact: true })
    .click();
  await page
    .getByLabel("Nom de la liste", { exact: true })
    .fill("Projet personnel");
  await page
    .getByRole("button", { name: "Enregistrer la liste", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Projet personnel", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Nouvelle tâche", exact: true })
    .click();
  await page.getByLabel("Titre", { exact: true }).fill("Préparer le dossier");
  await page
    .getByLabel("Notes", { exact: true })
    .fill("Relire les documents et vérifier les pièces.");
  await page.getByLabel("Échéance", { exact: true }).fill("2026-10-08");
  await page.getByLabel("Priorité", { exact: true }).selectOption("HIGH");
  await page
    .getByLabel("Nouvelle étape", { exact: true })
    .fill("Rassembler les pièces");
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await page
    .getByLabel("Nouvelle étape", { exact: true })
    .fill("Relire le dossier");
  await page.getByLabel("Nouvelle étape", { exact: true }).press("Enter");
  await page
    .getByRole("button", { name: "Enregistrer la tâche", exact: true })
    .dblclick();
  await expect(
    page.getByRole("button", { name: /Préparer le dossier/ }).first(),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Préparer le dossier", { exact: true }),
  ).toBeVisible();
  await page.locator(".task-checklist summary").click();
  await page
    .getByRole("checkbox", {
      name: "Étape : Rassembler les pièces",
      exact: true,
    })
    .check();
  await expect(
    page.getByRole("checkbox", {
      name: "Étape : Rassembler les pièces",
      exact: true,
    }),
  ).toBeChecked();
  await page.reload();
  await page.locator(".task-checklist summary").click();
  await expect(
    page.getByRole("checkbox", {
      name: "Étape : Rassembler les pièces",
      exact: true,
    }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "Copier Préparer le dossier", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Copier la tâche" }),
  ).toBeVisible();
  await expect(page.getByLabel("Titre", { exact: true })).toHaveValue(
    "Préparer le dossier (copie)",
  );
  await expect(
    page.getByRole("checkbox", { name: "Terminer l’étape 1", exact: true }),
  ).not.toBeChecked();
  await page
    .getByRole("button", { name: "Enregistrer la tâche", exact: true })
    .click();
  await expect(
    page.getByText("Préparer le dossier (copie)", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Supprimer Préparer le dossier (copie)",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Confirmer la suppression", exact: true })
    .click();
  await expect(
    page.getByText("Préparer le dossier (copie)", { exact: true }),
  ).toHaveCount(0);
  const weeks = await page.evaluate(() => {
    const current = new Date();
    const weekday = (current.getDay() + 6) % 7;
    current.setHours(12, 0, 0, 0);
    current.setDate(current.getDate() - weekday);
    const target = new Date(2026, 9, 5, 12);
    return Math.round((target.getTime() - current.getTime()) / 604800000);
  });
  for (let offset = 0; offset < Math.abs(weeks); offset++)
    await page
      .getByRole("button", {
        name: weeks < 0 ? "Semaine précédente" : "Semaine suivante",
        exact: true,
      })
      .click();
  await page
    .getByRole("button", { name: "Échéances du 2026-10-08", exact: true })
    .click();
  await expect(
    page.getByText("Préparer le dossier", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Échéances du 2026-10-09", exact: true })
    .click();
  await expect(
    page.getByText("Préparer le dossier", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Nouvelle tâche", exact: true })
    .click();
  await expect(page.getByLabel("Échéance", { exact: true })).toHaveValue(
    "2026-10-09",
  );
  await page.getByRole("button", { name: "Annuler", exact: true }).click();
  await page
    .getByRole("button", { name: "Afficher tout l’agenda", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Projet personnel", exact: false })
    .first()
    .click();
  await page.getByText("Préparer le dossier", { exact: true }).click();
  await expect(page.getByLabel("Échéance", { exact: true })).toHaveValue(
    "2026-10-08",
  );
  await page
    .getByLabel("Titre", { exact: true })
    .fill("Préparer le dossier complet");
  await page
    .getByRole("button", { name: "Enregistrer la tâche", exact: true })
    .click();
  await page
    .getByRole("checkbox", {
      name: "Terminer Préparer le dossier complet",
      exact: true,
    })
    .check();
  await expect(
    page.getByRole("checkbox", {
      name: "Rouvrir Préparer le dossier complet",
      exact: true,
    }),
  ).toBeChecked();
  await page
    .getByRole("checkbox", {
      name: "Rouvrir Préparer le dossier complet",
      exact: true,
    })
    .uncheck();
  await page.getByRole("button", { name: "Renommer", exact: true }).click();
  await page
    .getByLabel("Nom de la liste", { exact: true })
    .fill("Projet de candidature");
  await page
    .getByRole("button", { name: "Enregistrer la liste", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Projet de candidature", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Afficher en tableau", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: /À faire/ })).toBeVisible();
  await page
    .getByRole("button", { name: "Afficher en liste", exact: true })
    .click();
  await page.getByLabel("Rechercher une tâche").fill("introuvable");
  await expect(
    page.getByRole("heading", { name: "Aucune tâche trouvée", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Rechercher une tâche").clear();
  await page
    .getByRole("button", { name: "Nouvelle tâche", exact: true })
    .click();
  await page.getByLabel("Titre", { exact: true }).fill("Brouillon conservé");
  let retryBody = "";
  await page.route("**/api/tasks", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    retryBody = route.request().postData() ?? "";
    await route.fetch();
    await route.abort();
  });
  await page
    .getByRole("button", { name: "Enregistrer la tâche", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "injoignable",
  );
  await expect(page.getByLabel("Titre", { exact: true })).toHaveValue(
    "Brouillon conservé",
  );
  await page.unroute("**/api/tasks");
  const retryRequest = page.waitForRequest(
    (request) =>
      request.url().endsWith("/api/tasks") && request.method() === "POST",
  );
  await page.getByLabel("Titre", { exact: true }).evaluate((element) => {
    const form = element.closest("form");
    if (!(form instanceof HTMLFormElement))
      throw new Error("Formulaire introuvable");
    form.requestSubmit();
    form.requestSubmit();
  });
  assert.equal((await retryRequest).postData(), retryBody);
  await expect(
    page.getByText("Brouillon conservé", { exact: true }),
  ).toHaveCount(1);
  await page.reload();
  await expect(
    page.getByText("Brouillon conservé", { exact: true }),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Supprimer Brouillon conservé", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmer la suppression", exact: true })
    .click();
  await expect(
    page.getByText("Brouillon conservé", { exact: true }),
  ).toHaveCount(0);
  const second = await context.newPage();
  second.on("pageerror", (e) => errors.push(e.message));
  await second.goto("http://127.0.0.1:4512/dashboard");
  await expect(
    second.getByText("Préparer le dossier complet", { exact: true }),
  ).toBeVisible();
  await page.getByText("Préparer le dossier complet", { exact: true }).click();
  await page.getByLabel("Notes", { exact: true }).fill("Brouillon onglet A");
  await second
    .getByText("Préparer le dossier complet", { exact: true })
    .click();
  await second
    .getByLabel("Notes", { exact: true })
    .fill("Modification onglet B");
  await second
    .getByRole("button", { name: "Enregistrer la tâche", exact: true })
    .click();
  await expect(
    second.getByText("Modification onglet B", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Enregistrer la tâche", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "autre onglet",
  );
  await expect(page.getByLabel("Notes", { exact: true })).toHaveValue(
    "Brouillon onglet A",
  );
  await page.getByRole("button", { name: "Annuler", exact: true }).click();
  await page.reload();
  await expect(
    page.getByText("Modification onglet B", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Vue d’ensemble/ }).click();
  const stored = await context.cookies();
  const access = stored.find((c) => c.name === "accessToken");
  assert.ok(access);
  await context.addCookies([{ ...access, expires: 1 }]);
  await Promise.all([page.reload(), second.reload()]);
  await expect(
    page.getByRole("heading", { name: "Vue d’ensemble", exact: true }),
  ).toBeVisible();
  await expect(
    second.getByRole("heading", { name: "Vue d’ensemble", exact: true }),
  ).toBeVisible();
  await second.close();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exporter mes tâches", exact: true })
    .click();
  const download = await downloadPromise;
  assert.match(download.suggestedFilename(), /mes-taches-.*\.json/);
  for (const width of [1440, 800, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await checkOverflow(page);
    await screenshot(`workspace-${width}`);
    if (width <= 600) {
      await page
        .getByRole("button", { name: "Ouvrir la navigation", exact: true })
        .click();
      await checkOverflow(page);
      await screenshot(`navigation-${width}`);
      await page
        .getByRole("button", { name: "Fermer la navigation", exact: true })
        .click();
    }
    await page
      .getByRole("button", { name: "Nouvelle tâche", exact: true })
      .click();
    await checkOverflow(page);
    await screenshot(`editor-${width}`);
    for (let i = 0; i < 15; i++) await page.keyboard.press("Tab");
    assert.equal(
      await page
        .getByRole("dialog")
        .evaluate((el) => el.contains(document.activeElement)),
      true,
      "Focus retenu dans le dialogue",
    );
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    if (width <= 600)
      await page
        .getByRole("button", { name: "Ouvrir la navigation", exact: true })
        .click();
    await page
      .getByRole("button", { name: "Gérer mon compte", exact: true })
      .click();
    await checkOverflow(page);
    await screenshot(`profile-${width}`);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    if (width <= 600)
      await page
        .getByRole("button", { name: "Fermer la navigation", exact: true })
        .click();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 1000 });
  await page
    .getByRole("button", { name: "Ouvrir la navigation", exact: true })
    .click();
  assert.equal(
    await page
      .locator(".sidebar")
      .evaluate((el) => getComputedStyle(el).transitionDuration),
    "0s",
  );
  await page
    .getByRole("button", { name: "Fermer la navigation", exact: true })
    .click();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole("button", { name: "Gérer mon compte", exact: true })
    .click();
  await page.getByLabel("Prénom", { exact: true }).fill("Camille Marie");
  await page
    .getByRole("button", { name: "Enregistrer le profil", exact: true })
    .click();
  await expect(
    page.getByText("Bonjour Camille Marie", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Supprimer Préparer le dossier complet",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Confirmer la suppression", exact: true })
    .click();
  await expect(
    page.getByText("Préparer le dossier complet", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Se déconnecter", exact: true })
    .click();
  await expect(page).toHaveURL(/login/);
  await page.getByLabel("Adresse e-mail").fill("camille@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("GoodPass123");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(
    page.getByRole("button", { name: /Projet de candidature/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Gérer mon compte", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Supprimer mon compte", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmer la suppression", exact: true })
    .click();
  await expect(page).toHaveURL(/login/);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await checkOverflow(page);
    await screenshot(`login-${width}`);
    await page
      .getByRole("link", { name: "Créer un compte", exact: true })
      .click();
    await checkOverflow(page);
    await screenshot(`register-${width}`);
    await page.getByRole("link", { name: "Se connecter", exact: true }).click();
  }
  await page.goto("http://127.0.0.1:4512/page-absente");
  await expect(
    page.getByRole("heading", { name: "Cette page n’existe pas." }),
  ).toBeVisible();
  await checkOverflow(page);
  await page
    .getByRole("button", { name: "Revenir à mon espace", exact: true })
    .click();
  await expect(page).toHaveURL(/login/);
  assert.deepEqual(errors, [], "Erreurs JavaScript navigateur");
  console.log(
    "E2E réussi : inscription minimale/session, vrais comptes/API/PostgreSQL, checklist rechargée et cochée, copie éditable, semaine/date préremplie, création avec réponse perdue/reprise unique, CRUD/CAS/refresh deux onglets, date Auckland,1440/800/390/320,navigation/dialogues/clavier/export.",
  );
} finally {
  await browser.close();
  frontend?.kill("SIGTERM");
  await app.close();
  await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
  await admin.end();
}
