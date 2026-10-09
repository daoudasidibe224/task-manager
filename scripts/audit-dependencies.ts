import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { patchDependencies } from "./patch-dependencies.ts";

const schema = z.object({
  vulnerabilities: z.record(
    z.string(),
    z.object({
      name: z.string(),
      severity: z.string(),
      via: z.array(
        z.union([
          z.string(),
          z.object({ source: z.number(), url: z.string() }),
        ]),
      ),
    }),
  ),
});
const allowed = new Map([
  [
    "braces",
    {
      source: 1240992,
      url: "https://github.com/advisories/GHSA-vfj7-8cjw-p6xm",
    },
  ],
  [
    "node-forge",
    {
      source: 1240912,
      url: "https://github.com/advisories/GHSA-86w9-cpqp-85rv",
    },
  ],
]);
export function verifyAudit(input: unknown): number {
  const report = schema.parse(input);
  const unmitigated = Object.keys(report.vulnerabilities).filter((start) => {
    const visited = new Set<string>();
    let roots = 0;
    function mitigated(name: string): boolean {
      if (visited.has(name)) return true;
      visited.add(name);
      const advisory = report.vulnerabilities[name];
      if (
        !advisory ||
        advisory.name !== name ||
        advisory.severity !== "high" ||
        !advisory.via.length
      )
        return false;
      return advisory.via.every((via) => {
        if (typeof via === "string") return mitigated(via);
        const expected = allowed.get(name);
        if (expected?.source !== via.source || expected.url !== via.url)
          return false;
        roots++;
        return true;
      });
    }
    return !mitigated(start) || roots === 0;
  });
  if (unmitigated.length)
    throw new Error(
      `Avis npm sans mitigation validée : ${unmitigated.join(", ")}`,
    );
  return Object.keys(report.vulnerabilities).length;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  // L'audit brut reste affiché. L'exception exige les octets mitigés et uniquement ces deux avis.
  await patchDependencies(undefined, true);
  const result = spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["audit", "--json"],
    { encoding: "utf8" },
  );
  if (
    result.error ||
    result.signal ||
    (result.status !== 0 && result.status !== 1)
  )
    throw new Error("Audit npm indisponible.", { cause: result.error });
  console.log(result.stdout);
  const count = verifyAudit(JSON.parse(result.stdout));
  console.log(
    `${count} alertes npm résiduelles ; uniquement les deux avis mitigés, empreintes vérifiées. Tout nouvel avis bloque la CI.`,
  );
}
