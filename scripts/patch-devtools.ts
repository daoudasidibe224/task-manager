import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const version = z.object({ version: z.string() });
const digest = (source: string) =>
  createHash("sha256").update(source).digest("hex");
const before = "import Git from 'simple-git';";
const after = "import { simpleGit as Git } from 'simple-git';";
const expectedHash =
  "1118596e379498f0fc0d5e4d110f19bdd1066010c859cefa000c160825eff5fa";

// Adaptation de l'import supprimé en v4. Le reste de DevTools reste intact.
export async function patchDevtools(directory = root) {
  const dependencies: ReadonlyArray<readonly [string, string]> = [
    ["@nuxt/devtools", "3.4.2"],
    ["simple-git", "4.0.2"],
    ["@simple-git/argv-parser", "2.0.1"],
  ];
  for (const [name, expected] of dependencies) {
    const metadata: unknown = JSON.parse(
      await readFile(
        path.join(directory, "node_modules", name, "package.json"),
        "utf8",
      ),
    );
    if (version.parse(metadata).version !== expected)
      throw new Error(
        `Compatibilité DevTools : version inattendue pour ${name}. Revoir le correctif.`,
      );
  }
  const filename = path.join(
    directory,
    "node_modules/@nuxt/devtools/dist/chunks/module-main.mjs",
  );
  const source = await readFile(filename, "utf8");
  if (
    source.includes(after) &&
    digest(source.replace(after, before)) === expectedHash
  )
    return;
  if (digest(source) !== expectedHash || source.split(before).length !== 2)
    throw new Error(
      "Compatibilité DevTools : empreinte inattendue. Installation interrompue sans modification.",
    );
  await writeFile(filename, source.replace(before, after));
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await patchDevtools();
  console.log("DevTools 3.4.2 : import nommé simpleGit 4.0.2 vérifié.");
}
