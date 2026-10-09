import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const specification = z.object({
  packages: z.record(z.string(), z.string()),
  files: z.array(
    z.object({
      file: z.string(),
      original: z.string(),
      patched: z.string(),
      changes: z.array(z.object({ before: z.string(), after: z.string() })),
    }),
  ),
});
const plan = specification.parse(
  JSON.parse(
    await readFile(
      path.join(root, "scripts/dependency-mitigations.json"),
      "utf8",
    ),
  ),
);
const digest = (source: string) =>
  createHash("sha256").update(source).digest("hex");

// Les versions et octets attendus restent ceux du registre npm, sans faux numéro corrigé.
export async function patchDependencies(directory = root, verifyOnly = false) {
  for (const [name, expected] of Object.entries(plan.packages)) {
    const metadata: unknown = JSON.parse(
      await readFile(
        path.join(directory, "node_modules", name, "package.json"),
        "utf8",
      ),
    );
    if (z.object({ version: z.string() }).parse(metadata).version !== expected)
      throw new Error(
        `Mitigation : version inattendue pour ${name}. Revoir le correctif.`,
      );
  }
  const writes: Array<{ filename: string; source: string }> = [];
  // Valider tous les fichiers avant toute écriture pour refuser une installation altérée.
  for (const file of plan.files) {
    const filename = path.join(directory, "node_modules", file.file);
    let source = await readFile(filename, "utf8");
    if (digest(source) === file.patched) continue;
    if (verifyOnly || digest(source) !== file.original)
      throw new Error(`Mitigation : empreinte inattendue pour ${file.file}.`);
    for (const { before, after } of file.changes) {
      if (source.split(before).length !== 2)
        throw new Error(`Mitigation : cible inattendue pour ${file.file}.`);
      source = source.replace(before, after);
    }
    if (digest(source) !== file.patched)
      throw new Error(`Mitigation : résultat inattendu pour ${file.file}.`);
    writes.push({ filename, source });
  }
  for (const { filename, source } of writes) await writeFile(filename, source);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await patchDependencies();
  console.log(
    "braces 3.0.3 et node-forge 1.4.0 : mitigations et empreintes vérifiées.",
  );
}
