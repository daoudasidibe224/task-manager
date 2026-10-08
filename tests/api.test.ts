import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import request from "supertest";
import { z } from "zod";
import type { INestApplication } from "@nestjs/common";
const base =
  process.env.TEST_DATABASE_URL ??
  "postgresql://task_manager@127.0.0.1:55412/postgres";
const db = `task_test_${randomUUID().replaceAll("-", "")}`;
const url = new URL(base);
url.pathname = `/${db}`;
let app: INestApplication, admin: Client;
const user = z.object({
  id: z.string(),
  firstname: z.string(),
  email: z.email(),
});
const registered = z.object({
  success: z.literal(true),
  data: z.object({ user }),
});
const profile = z.object({
  success: z.literal(true),
  data: z.object({ user }),
});
const item = z.object({ data: z.object({ id: z.string() }) });
const cookies = (response: request.Response) => {
  const header: unknown = response.headers["set-cookie"];
  return z
    .array(z.string())
    .parse(header)
    .map((v) => v.split(";")[0]!);
};
const token = (values: string[], name: string) =>
  decodeURIComponent(
    values.find((c) => c.startsWith(`${name}=`))!.slice(name.length + 1),
  );
before(async () => {
  admin = new Client({ connectionString: base });
  await admin.connect();
  await admin.query(`CREATE DATABASE "${db}"`);
  const connection = new Client({ connectionString: url.toString() });
  await connection.connect();
  for (const migration of (await readdir("backend/prisma/migrations")).sort()) {
    if (migration === "migration_lock.toml") continue;
    await connection.query(
      await readFile(
        `backend/prisma/migrations/${migration}/migration.sql`,
        "utf8",
      ),
    );
  }
  await connection.end();
  process.env.DATABASE_URL = url.toString();
  process.env.JWT_SECRET = "api-test-access-secret-at-least-32-characters";
  process.env.REFRESH_TOKEN_SECRET =
    "api-test-refresh-secret-at-least-32-characters";
  process.env.FRONTEND_URL = "http://127.0.0.1:4312";
  process.env.THROTTLE_LIMIT = "1000";
  const { createApplication } = await import("../backend/dist/main.js");
  app = await createApplication();
  await app.init();
});
after(async () => {
  await app?.close();
  if (admin) {
    await admin.query(`DROP DATABASE IF EXISTS "${db}" WITH (FORCE)`);
    await admin.end();
  }
});
const account = (email: string) => ({
  firstname: "Alice",
  lastname: "Martin",
  email,
  password: "GoodPass123",
});
async function register(email: string) {
  const r = await request(app.getHttpServer())
    .post("/api/auth/register")
    .send(account(email))
    .expect(201);
  return registered.parse(r.body).data.user;
}
async function login(email: string) {
  return cookies(
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email, password: "GoodPass123" })
      .expect(200),
  );
}
let aliceId = "",
  aliceCookies: string[] = [],
  bobCookies: string[] = [],
  listId = "",
  taskId = "";
test("inscription validée, réponse sans mot de passe ni données privées", async () => {
  const data = await register("alice@example.test");
  aliceId = data.id;
  assert.equal(data.firstname, "Alice");
  const response = await request(app.getHttpServer())
    .post("/api/auth/register")
    .send({ ...account("bad@example.test"), userId: "injected" })
    .expect(400);
  assert.equal(response.body.success, false);
  await request(app.getHttpServer())
    .post("/api/auth/register")
    .send({ ...account("long@example.test"), password: "A1" + "é".repeat(36) })
    .expect(400);
  await request(app.getHttpServer())
    .post("/api/auth/register")
    .send(account("alice@example.test"))
    .expect(409);
});
test("concurrence inscription : un compte créé, un conflit 409", async () => {
  const rs = await Promise.all(
    [1, 2].map(() =>
      request(app.getHttpServer())
        .post("/api/auth/register")
        .send(account("race@example.test")),
    ),
  );
  assert.deepEqual(rs.map((r) => r.status).sort(), [201, 409]);
});
test("connexion cookie HttpOnly et frontière sans session", async () => {
  await request(app.getHttpServer()).get("/api/task-lists").expect(401);
  await request(app.getHttpServer()).post("/api/auth/refresh").expect(401);
  await request(app.getHttpServer())
    .post("/api/auth/login")
    .send({ email: "alice@example.test", password: "WrongPass123" })
    .expect(401);
  const r = await request(app.getHttpServer())
    .post("/api/auth/login")
    .send({ email: "alice@example.test", password: "GoodPass123" })
    .expect(200);
  profile.parse(r.body);
  assert.equal(JSON.stringify(r.body).includes("GoodPass"), false);
  assert.equal(JSON.stringify(r.body).includes("tokens"), false);
  assert.ok(
    z
      .array(z.string())
      .parse(r.headers["set-cookie"])
      .every((c) => c.includes("HttpOnly") && c.includes("SameSite=Lax")),
  );
  aliceCookies = cookies(r);
  await register("bob@example.test");
  bobCookies = await login("bob@example.test");
});
test("listes privées, validation nom et conflits concurrents", async () => {
  const r = await request(app.getHttpServer())
    .post("/api/task-lists")
    .set("Cookie", aliceCookies)
    .send({ name: "Travail" })
    .expect(201);
  listId = item.parse(r.body).data.id;
  const rs = await Promise.all(
    [1, 2].map(() =>
      request(app.getHttpServer())
        .post("/api/task-lists")
        .set("Cookie", aliceCookies)
        .send({ name: "Course" }),
    ),
  );
  assert.deepEqual(rs.map((r) => r.status).sort(), [201, 409]);
  await request(app.getHttpServer())
    .post("/api/task-lists")
    .set("Cookie", aliceCookies)
    .send({ name: "   " })
    .expect(400);
  await request(app.getHttpServer())
    .get(`/api/task-lists/${listId}`)
    .set("Cookie", bobCookies)
    .expect(403);
  await request(app.getHttpServer())
    .patch(`/api/task-lists/${listId}`)
    .set("Cookie", bobCookies)
    .send({ name: "Volée" })
    .expect(403);
  await request(app.getHttpServer())
    .delete(`/api/task-lists/${listId}`)
    .set("Cookie", bobCookies)
    .expect(403);
  const b = await request(app.getHttpServer())
    .get("/api/task-lists")
    .set("Cookie", bobCookies)
    .expect(200);
  assert.deepEqual(b.body.data, []);
});
test("création et relecture réelle : priorité, notes, date et complétion", async () => {
  const r = await request(app.getHttpServer())
    .post("/api/tasks")
    .set("Cookie", aliceCookies)
    .send({
      listId,
      shortDescription: " Préparer la réunion ",
      longDescription: "Lire les notes",
      dueDate: "2026-10-08T12:00:00.000Z",
      priority: "HIGH",
    })
    .expect(201);
  taskId = item.parse(r.body).data.id;
  assert.equal(r.body.data.shortDescription, "Préparer la réunion");
  assert.equal(r.body.data.completed, false);
  const read = await request(app.getHttpServer())
    .get(`/api/tasks/${taskId}`)
    .set("Cookie", aliceCookies)
    .expect(200);
  assert.equal(read.body.data.priority, "HIGH");
  assert.equal(read.body.data.dueDate, "2026-10-08T12:00:00.000Z");
  await request(app.getHttpServer())
    .patch(`/api/tasks/${taskId}`)
    .set("Cookie", aliceCookies)
    .send({ completed: true, dueDate: null, longDescription: null })
    .expect(200);
  const lists = await request(app.getHttpServer())
    .get("/api/task-lists")
    .set("Cookie", aliceCookies)
    .expect(200);
  const parsed = z
    .object({
      data: z.array(
        z.object({
          id: z.string(),
          tasks: z.array(
            z.object({
              id: z.string(),
              completed: z.boolean(),
              dueDate: z.null(),
            }),
          ),
        }),
      ),
    })
    .parse(lists.body);
  assert.equal(
    parsed.data.find((l) => l.id === listId)?.tasks[0]?.completed,
    true,
  );
});
test("frontières tâche : booléen textuel, date invalide, priorité, taille, filtre", async () => {
  for (const patch of [
    { completed: "false" },
    { completed: null },
    { priority: null },
    { shortDescription: null },
    { listId: null },
    { dueDate: 123 },
    { dueDate: "not-date" },
    { priority: "URGENT" },
    { shortDescription: "a".repeat(201) },
    { longDescription: "a".repeat(2001) },
    { admin: true },
  ])
    await request(app.getHttpServer())
      .patch(`/api/tasks/${taskId}`)
      .set("Cookie", aliceCookies)
      .send(patch)
      .expect(400);
  await request(app.getHttpServer())
    .get("/api/tasks?completed=bad")
    .set("Cookie", aliceCookies)
    .expect(400);
  await request(app.getHttpServer())
    .get("/api/tasks?completed=true")
    .set("Cookie", aliceCookies)
    .expect(200);
});
test("autorisations création/déplacement/modification/suppression tâche et compte", async () => {
  await request(app.getHttpServer())
    .post("/api/tasks")
    .set("Cookie", bobCookies)
    .send({ listId, shortDescription: "Intrusion" })
    .expect(403);
  for (const method of ["get", "patch", "delete"] as const) {
    let r = request(app.getHttpServer())
      [method](`/api/tasks/${taskId}`)
      .set("Cookie", bobCookies);
    if (method === "patch") r = r.send({ completed: false });
    await r.expect(403);
  }
  await request(app.getHttpServer())
    .patch(`/api/user/${aliceId}`)
    .set("Cookie", bobCookies)
    .send({ firstname: "Volé" })
    .expect(403);
  await request(app.getHttpServer())
    .delete(`/api/user/${aliceId}`)
    .set("Cookie", bobCookies)
    .expect(403);
  const foreign = await request(app.getHttpServer())
    .post("/api/task-lists")
    .set("Cookie", bobCookies)
    .send({ name: "Bob" })
    .expect(201);
  await request(app.getHttpServer())
    .patch(`/api/tasks/${taskId}`)
    .set("Cookie", aliceCookies)
    .send({ listId: item.parse(foreign.body).data.id })
    .expect(403);
});
test("profil et liste refusent null plutôt que provoquer une erreur stockage", async () => {
  await request(app.getHttpServer())
    .patch(`/api/user/${aliceId}`)
    .set("Cookie", aliceCookies)
    .send({ firstname: null })
    .expect(400);
  await request(app.getHttpServer())
    .patch(`/api/task-lists/${listId}`)
    .set("Cookie", aliceCookies)
    .send({ name: null })
    .expect(400);
});
test("modifications concurrentes : conflit explicite sans écrasement", async () => {
  const response = await request(app.getHttpServer())
    .get(`/api/tasks/${taskId}`)
    .set("Cookie", aliceCookies)
    .expect(200);
  const updatedAt = z
    .object({ data: z.object({ updatedAt: z.string() }) })
    .parse(response.body).data.updatedAt;
  const results = await Promise.all(
    ["Premier", "Deuxième"].map((shortDescription) =>
      request(app.getHttpServer())
        .patch(`/api/tasks/${taskId}`)
        .set("Cookie", aliceCookies)
        .send({ shortDescription, expectedUpdatedAt: updatedAt }),
    ),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  const winning = results.find((r) => r.status === 200)!;
  const persisted = await request(app.getHttpServer())
    .get(`/api/tasks/${taskId}`)
    .set("Cookie", aliceCookies)
    .expect(200);
  assert.equal(
    persisted.body.data.shortDescription,
    winning.body.data.shortDescription,
  );
});
test("indisponibilité stockage : erreur neutre, récupération et données conservées", async () => {
  const connection = new Client({ connectionString: url.toString() });
  await connection.connect();
  try {
    await connection.query(
      'ALTER TABLE "task_lists" RENAME TO "task_lists_unavailable"',
    );
    const response = await request(app.getHttpServer())
      .get("/api/task-lists")
      .set("Cookie", aliceCookies)
      .expect(500);
    assert.equal(
      response.body.message,
      "Le serveur ne peut pas traiter cette demande.",
    );
    assert.equal("data" in response.body, false);
  } finally {
    await connection.query(
      'ALTER TABLE "task_lists_unavailable" RENAME TO "task_lists"',
    );
    await connection.end();
  }
  await request(app.getHttpServer())
    .get(`/api/tasks/${taskId}`)
    .set("Cookie", aliceCookies)
    .expect(200);
});
test("rotation SHA256, jti unique, rejeu refusé et concurrence atomique", async () => {
  const old = aliceCookies;
  const rotated = await request(app.getHttpServer())
    .post("/api/auth/refresh")
    .set("Cookie", old)
    .expect(200);
  const current = cookies(rotated);
  assert.notEqual(token(old, "refreshToken"), token(current, "refreshToken"));
  await request(app.getHttpServer())
    .post("/api/auth/refresh")
    .set("Cookie", old)
    .expect(401);
  const results = await Promise.all(
    [1, 2].map(() =>
      request(app.getHttpServer())
        .post("/api/auth/refresh")
        .set("Cookie", current),
    ),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 401]);
  aliceCookies = cookies(results.find((r) => r.status === 200)!);
});
test("déconnexion révoque accès copié et refresh, conserve autre appareil", async () => {
  const second = await login("alice@example.test");
  const access = token(aliceCookies, "accessToken");
  await request(app.getHttpServer())
    .post("/api/auth/logout")
    .set("Cookie", aliceCookies)
    .expect(200);
  await request(app.getHttpServer())
    .get("/api/auth/profile")
    .set("Authorization", `Bearer ${access}`)
    .expect(401);
  await request(app.getHttpServer())
    .post("/api/auth/refresh")
    .set("Cookie", aliceCookies)
    .expect(401);
  await request(app.getHttpServer())
    .get("/api/auth/profile")
    .set("Cookie", second)
    .expect(200);
  aliceCookies = second;
});
test("origine étrangère refusée et ressource inconnue 404", async () => {
  await request(app.getHttpServer())
    .post("/api/task-lists")
    .set("Origin", "https://untrusted.example")
    .set("Cookie", aliceCookies)
    .send({ name: "Cross site" })
    .expect(403);
  await request(app.getHttpServer())
    .get("/api/tasks/missing")
    .set("Cookie", aliceCookies)
    .expect(404);
});
test("profil explicite, suppression liste et compte en cascade persistée", async () => {
  const r = await request(app.getHttpServer())
    .patch(`/api/user/${aliceId}`)
    .set("Cookie", aliceCookies)
    .send({ firstname: "Alicia" })
    .expect(200);
  assert.equal(r.body.data.firstname, "Alicia");
  assert.equal("password" in r.body.data, false);
  await request(app.getHttpServer())
    .delete(`/api/task-lists/${listId}`)
    .set("Cookie", aliceCookies)
    .expect(200);
  await request(app.getHttpServer())
    .get(`/api/tasks/${taskId}`)
    .set("Cookie", aliceCookies)
    .expect(404);
  await request(app.getHttpServer())
    .delete(`/api/user/${aliceId}`)
    .set("Cookie", aliceCookies)
    .expect(200);
  await request(app.getHttpServer())
    .get("/api/auth/profile")
    .set("Cookie", aliceCookies)
    .expect(401);
  const dbClient = new Client({ connectionString: url.toString() });
  await dbClient.connect();
  assert.equal(
    (
      await dbClient.query(
        'SELECT count(*)::int AS count FROM "Session" WHERE "userId"=$1',
        [aliceId],
      )
    ).rows[0].count,
    0,
  );
  assert.equal(
    (
      await dbClient.query(
        'SELECT count(*)::int AS count FROM "task_lists" WHERE "userId"=$1',
        [aliceId],
      )
    ).rows[0].count,
    0,
  );
  await dbClient.end();
});

async function productFixture() {
  const email = `product-${randomUUID()}@example.test`;
  const response = await request(app.getHttpServer())
    .post("/api/auth/register")
    .send({ email, password: "GoodPass123" })
    .expect(201);
  const session = cookies(response);
  const person = registered.parse(response.body).data.user;
  const list = await request(app.getHttpServer())
    .post("/api/task-lists")
    .set("Cookie", session)
    .send({ name: "Étapes du projet" })
    .expect(201);
  return { session, person, listId: item.parse(list.body).data.id };
}
const checklistResponse = z.object({
  data: z.object({
    id: z.string(),
    updatedAt: z.string(),
    checklist: z.array(
      z.object({ id: z.uuid(), text: z.string(), completed: z.boolean() }),
    ),
  }),
});
test("inscription minimale connecte immédiatement et le prénom peut être complété plus tard", async () => {
  const fixture = await productFixture();
  assert.match(fixture.person.firstname, /^product-/);
  await request(app.getHttpServer())
    .get("/api/auth/profile")
    .set("Cookie", fixture.session)
    .expect(200);
  await request(app.getHttpServer())
    .patch(`/api/user/${fixture.person.id}`)
    .set("Cookie", fixture.session)
    .send({ firstname: "Camille", lastname: "" })
    .expect(200);
  await request(app.getHttpServer())
    .post("/api/auth/register")
    .send({
      email: `invalid-${randomUUID()}@example.test`,
      password: "GoodPass123",
      firstname: null,
    })
    .expect(400);
});
test("checklist persistée, frontière stricte et deux éditions concurrentes préservent la version gagnante", async () => {
  const fixture = await productFixture(),
    step = { id: randomUUID(), text: "Relire le document", completed: false };
  const response = await request(app.getHttpServer())
    .post("/api/tasks")
    .set("Cookie", fixture.session)
    .send({
      listId: fixture.listId,
      shortDescription: "Un dossier complet",
      checklist: [step],
    })
    .expect(201);
  const task = checklistResponse.parse(response.body).data;
  const outcomes = await Promise.all(
    [true, false].map((completed) =>
      request(app.getHttpServer())
        .patch(`/api/tasks/${task.id}`)
        .set("Cookie", fixture.session)
        .send({
          expectedUpdatedAt: task.updatedAt,
          checklist: [{ ...step, completed }],
        }),
    ),
  );
  assert.deepEqual(outcomes.map((result) => result.status).sort(), [200, 409]);
  const reloaded = checklistResponse.parse(
    (
      await request(app.getHttpServer())
        .get(`/api/tasks/${task.id}`)
        .set("Cookie", fixture.session)
        .expect(200)
    ).body,
  ).data;
  assert.deepEqual(
    reloaded.checklist,
    checklistResponse.parse(
      outcomes.find((result) => result.status === 200)!.body,
    ).data.checklist,
  );
  for (const checklist of [
    null,
    [step, step],
    [{ ...step, text: "" }],
    [{ ...step, completed: "false" }],
    Array.from({ length: 21 }, () => ({ ...step, id: randomUUID() })),
  ])
    await request(app.getHttpServer())
      .patch(`/api/tasks/${task.id}`)
      .set("Cookie", fixture.session)
      .send({ checklist })
      .expect(400);
  await request(app.getHttpServer())
    .patch(`/api/tasks/${task.id}`)
    .set("Cookie", bobCookies)
    .send({ checklist: [] })
    .expect(403);
});
test("création UUID simultanée et reprise après édition restent uniques; suppression ne permet pas résurrection", async () => {
  const fixture = await productFixture();
  const body = {
    listId: fixture.listId,
    shortDescription: "Copie de mon projet",
    requestId: randomUUID(),
    checklist: [{ id: randomUUID(), text: "Première étape", completed: false }],
  };
  const results = await Promise.all([
    request(app.getHttpServer())
      .post("/api/tasks")
      .set("Cookie", fixture.session)
      .send(body),
    request(app.getHttpServer())
      .post("/api/tasks")
      .set("Cookie", fixture.session)
      .send(body),
  ]);
  assert.ok(results.every((result) => result.status === 201));
  const task = checklistResponse.parse(results[0].body).data;
  assert.equal(item.parse(results[1].body).data.id, task.id);
  await request(app.getHttpServer())
    .patch(`/api/tasks/${task.id}`)
    .set("Cookie", fixture.session)
    .send({ shortDescription: "Titre ajusté" })
    .expect(200);
  const retry = await request(app.getHttpServer())
    .post("/api/tasks")
    .set("Cookie", fixture.session)
    .send(body)
    .expect(201);
  assert.equal(item.parse(retry.body).data.id, task.id);
  await request(app.getHttpServer())
    .post("/api/tasks")
    .set("Cookie", fixture.session)
    .send({ ...body, shortDescription: "Autre intention" })
    .expect(409);
  await request(app.getHttpServer())
    .delete(`/api/tasks/${task.id}`)
    .set("Cookie", fixture.session)
    .expect(200);
  await request(app.getHttpServer())
    .post("/api/tasks")
    .set("Cookie", fixture.session)
    .send(body)
    .expect(409);
  const connection = new Client({ connectionString: url.toString() });
  await connection.connect();
  const keys = await connection.query(
    'SELECT "taskId" FROM "TaskCreation" WHERE "id"=$1',
    [body.requestId],
  );
  assert.equal(keys.rows.length, 1);
  assert.equal(keys.rows[0].taskId, null);
  await request(app.getHttpServer())
    .delete(`/api/user/${fixture.person.id}`)
    .set("Cookie", fixture.session)
    .expect(200);
  const remaining = await connection.query(
    'SELECT COUNT(*) FROM "TaskCreation" WHERE "userId"=$1',
    [fixture.person.id],
  );
  assert.equal(remaining.rows[0].count, "0");
  await connection.end();
});

test("une indisponibilité après réservation de clé annule la création et autorise la reprise", async () => {
  const fixture = await productFixture(),
    requestId = randomUUID();
  const connection = new Client({ connectionString: url.toString() });
  await connection.connect();
  await connection.query(
    'ALTER TABLE "tasks" RENAME TO "tasks_temporarily_unavailable"',
  );
  try {
    await request(app.getHttpServer())
      .post("/api/tasks")
      .set("Cookie", fixture.session)
      .send({
        listId: fixture.listId,
        shortDescription: "Création après reprise",
        requestId,
      })
      .expect(500);
  } finally {
    await connection.query(
      'ALTER TABLE "tasks_temporarily_unavailable" RENAME TO "tasks"',
    );
  }
  const reserved = await connection.query(
    'SELECT COUNT(*) FROM "TaskCreation" WHERE "id"=$1',
    [requestId],
  );
  assert.equal(reserved.rows[0].count, "0");
  await request(app.getHttpServer())
    .post("/api/tasks")
    .set("Cookie", fixture.session)
    .send({
      listId: fixture.listId,
      shortDescription: "Création après reprise",
      requestId,
    })
    .expect(201);
  await connection.end();
});
