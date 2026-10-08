import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { simpleGit } from "simple-git";
import { patchDevtools } from "../scripts/patch-devtools.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const filename = "node_modules/@nuxt/devtools/dist/chunks/module-main.mjs";

test("DevTools charge réellement avec simpleGit v4 et ses lectures Git restent compatibles", async () => {
  await patchDevtools();
  const loaded: unknown = await import(
    pathToFileURL(path.join(root, filename)).href
  );
  assert(
    loaded &&
      typeof loaded === "object" &&
      "m" in loaded &&
      loaded.m &&
      typeof loaded.m === "object" &&
      "enableModule" in loaded.m &&
      typeof loaded.m.enableModule === "function",
  );
  const git = simpleGit(root);
  const branch: unknown = await git.branch();
  assert(
    branch &&
      typeof branch === "object" &&
      "current" in branch &&
      typeof branch.current === "string",
  );
  assert.match(await git.revparse(["--short", "HEAD"]), /^[a-f0-9]+$/);
  assert.equal(typeof (await git.status()).isClean(), "boolean");
});

test("le correctif est idempotent, refuse une autre version ou des octets inattendus", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "task-devtools-patch-"));
  try {
    for (const name of [
      "@nuxt/devtools",
      "simple-git",
      "@simple-git/argv-parser",
    ]) {
      const target = path.join(directory, "node_modules", name);
      await mkdir(target, { recursive: true });
      await writeFile(
        path.join(target, "package.json"),
        await readFile(path.join(root, "node_modules", name, "package.json")),
      );
    }
    const target = path.join(directory, filename);
    await mkdir(path.dirname(target), { recursive: true });
    const patched = await readFile(path.join(root, filename), "utf8");
    const original = patched.replace(
      "import { simpleGit as Git } from 'simple-git';",
      "import Git from 'simple-git';",
    );
    await writeFile(target, original);
    await patchDevtools(directory);
    assert.equal(await readFile(target, "utf8"), patched);
    await patchDevtools(directory);
    assert.equal(await readFile(target, "utf8"), patched);
    await writeFile(target, `${original}\n// unexpected alteration`);
    await assert.rejects(patchDevtools(directory), /empreinte inattendue/);
    assert.equal(
      await readFile(target, "utf8"),
      `${original}\n// unexpected alteration`,
    );
    await writeFile(
      path.join(directory, "node_modules/@nuxt/devtools/package.json"),
      JSON.stringify({ version: "3.5.0" }),
    );
    await assert.rejects(patchDevtools(directory), /version inattendue/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
