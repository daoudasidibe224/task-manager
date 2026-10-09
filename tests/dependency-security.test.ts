import assert from "node:assert/strict";
import { test } from "node:test";
import {
  constants,
  generateKeyPairSync,
  privateEncrypt,
  createHash,
  sign,
} from "node:crypto";
import { cp, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { verifyAudit } from "../scripts/audit-dependencies.ts";
import { patchDependencies } from "../scripts/patch-dependencies.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const plan = z
  .object({
    files: z.array(
      z.object({
        file: z.string(),
        changes: z.array(z.object({ before: z.string(), after: z.string() })),
      }),
    ),
  })
  .parse(
    JSON.parse(
      await readFile(
        path.join(root, "scripts/dependency-mitigations.json"),
        "utf8",
      ),
    ),
  );
type Braces = {
  parse(input: string): unknown;
  compile(input: unknown): string;
  expand(input: unknown): string[];
  stringify(input: unknown): string;
};
type Forge = {
  pki: {
    publicKeyFromPem(pem: string): {
      verify(digest: string, signature: string): boolean;
    };
  };
};

async function originalInstallation() {
  const directory = await mkdtemp(
    path.join(tmpdir(), "task-dependency-regression-"),
  );
  for (const name of ["braces", "node-forge"])
    await cp(
      path.join(root, "node_modules", name),
      path.join(directory, "node_modules", name),
      { recursive: true },
    );
  // braces conserve ses dépendances publiées. Seuls les fichiers mitigés sont rétablis.
  for (const name of ["fill-range", "to-regex-range", "is-number"])
    await cp(
      path.join(root, "node_modules", name),
      path.join(directory, "node_modules", name),
      { recursive: true },
    );
  for (const file of plan.files) {
    const target = path.join(directory, "node_modules", file.file);
    let source = await readFile(target, "utf8");
    for (const { before, after } of file.changes)
      source = source.replace(after, before);
    await writeFile(target, source);
  }
  return directory;
}

test("braces : reproduction de débordement, limites pour textes et AST, motifs Nuxt conservés", async () => {
  await patchDependencies();
  const directory = await originalInstallation();
  try {
    const original = require(
      path.join(directory, "node_modules/braces"),
    ) as Braces;
    const braces = require("braces") as Braces;
    const deep = "{".repeat(4500) + "a,b" + "}".repeat(4500);
    const exhausted = spawnSync(
      process.execPath,
      [
        "--stack-size=512",
        "-e",
        `require(${JSON.stringify(path.join(directory, "node_modules/braces"))}).compile(${JSON.stringify(deep)})`,
      ],
      { encoding: "utf8" },
    );
    assert.equal(exhausted.status, 1);
    assert.match(
      exhausted.stderr,
      /RangeError: Maximum call stack size exceeded/,
    );
    for (const operation of [
      braces.parse,
      braces.compile,
      braces.expand,
      braces.stringify,
    ])
      assert.throws(() => operation(deep), {
        name: "SyntaxError",
        message: /maximum nesting depth/,
      });
    for (const deep of [
      "(".repeat(4500) + "a" + ")".repeat(4500),
      "{(".repeat(2400) + "a" + ")}".repeat(2400),
    ])
      assert.throws(() => braces.parse(deep), /maximum nesting depth/);
    const ast = original.parse(deep);
    for (const operation of [braces.compile, braces.expand, braces.stringify])
      assert.throws(() => operation(ast), {
        name: "SyntaxError",
        message: /maximum nesting depth/,
      });
    for (const pattern of [
      "app/**/*.{vue,ts}",
      "{app,{components,composables}}/**/*.{vue,ts}",
      "{1..5}",
      "{01..09..2}",
      "\\{literal\\}",
      '"{quoted}"',
      "[{}]",
      "{unclosed",
      "(literal)",
      "${literal}",
    ])
      for (const method of ["compile", "expand", "stringify"] as const)
        assert.deepEqual(braces[method](pattern), original[method](pattern));
    assert.doesNotThrow(() =>
      braces.compile("{".repeat(127) + "a,b" + "}".repeat(127)),
    );
    assert.throws(
      () => braces.compile("{".repeat(129) + "a,b" + "}".repeat(129)),
      /maximum nesting depth/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("node-forge : refuse les enfants DigestAlgorithm surnuméraires et conserve les signatures RSA valides", async () => {
  const directory = await originalInstallation();
  try {
    const original = require(
      path.join(directory, "node_modules/node-forge"),
    ) as Forge;
    const forge = require("node-forge") as Forge;
    const keys = generateKeyPairSync("rsa", {
      modulusLength: 1024,
      publicExponent: 3,
    });
    const pem = keys.publicKey
      .export({ format: "pem", type: "spki" })
      .toString();
    const oldKey = original.pki.publicKeyFromPem(pem);
    const key = forge.pki.publicKeyFromPem(pem);
    const message = Buffer.from("mes listes de tâches : regression RSA");
    const digest = createHash("sha256").update(message).digest();
    // Signer un EM invalide avec la clé du test prouve que le défaut est dans la validation ASN.1.
    const der = (type: number, value: Buffer) =>
      Buffer.concat([Buffer.from([type, value.length]), value]);
    const oid = Buffer.from("0609608648016503040201", "hex");
    for (const withNull of [true, false]) {
      const algorithm = Buffer.concat([
        oid,
        ...(withNull ? [Buffer.from("0500", "hex")] : []),
      ]);
      for (const extra of [
        Buffer.from("04026767", "hex"),
        Buffer.from("3000", "hex"),
        ...(withNull ? [Buffer.from("0500", "hex")] : []),
      ]) {
        const info = der(
          0x30,
          Buffer.concat([
            der(0x30, Buffer.concat([algorithm, extra])),
            der(4, digest),
          ]),
        );
        const em = Buffer.concat([
          Buffer.from([0, 1]),
          Buffer.alloc(128 - info.length - 3, 0xff),
          Buffer.from([0]),
          info,
        ]);
        const signature = privateEncrypt(
          { key: keys.privateKey, padding: constants.RSA_NO_PADDING },
          em,
        ).toString("binary");
        assert.equal(oldKey.verify(digest.toString("binary"), signature), true);
        assert.throws(
          () => key.verify(digest.toString("binary"), signature),
          /valid RSASSA-PKCS1-v1_5/,
        );
      }
      const info = der(
        0x30,
        Buffer.concat([der(0x30, algorithm), der(4, digest)]),
      );
      const em = Buffer.concat([
        Buffer.from([0, 1]),
        Buffer.alloc(128 - info.length - 3, 0xff),
        Buffer.from([0]),
        info,
      ]);
      assert.equal(
        key.verify(
          digest.toString("binary"),
          privateEncrypt(
            { key: keys.privateKey, padding: constants.RSA_NO_PADDING },
            em,
          ).toString("binary"),
        ),
        true,
      );
    }
    for (const garbage of [Buffer.from("g"), Buffer.alloc(40, 0x88)]) {
      const info = der(
        0x30,
        Buffer.concat([
          der(0x30, Buffer.concat([oid, der(5, garbage)])),
          der(4, digest),
        ]),
      );
      const em = Buffer.concat([
        Buffer.from([0, 1]),
        Buffer.alloc(128 - info.length - 3, 0xff),
        Buffer.from([0]),
        info,
      ]);
      const signature = privateEncrypt(
        { key: keys.privateKey, padding: constants.RSA_NO_PADDING },
        em,
      ).toString("binary");
      assert.equal(oldKey.verify(digest.toString("binary"), signature), true);
      assert.throws(
        () => key.verify(digest.toString("binary"), signature),
        /valid RSASSA-PKCS1-v1_5/,
      );
    }
    for (const algorithm of ["sha1", "sha256", "sha512"])
      assert.equal(
        key.verify(
          createHash(algorithm).update(message).digest("binary"),
          sign(algorithm, message, keys.privateKey).toString("binary"),
        ),
        true,
      );
    assert.equal(
      key.verify(
        digest.toString("binary"),
        sign("sha256", Buffer.from("autre message"), keys.privateKey).toString(
          "binary",
        ),
      ),
      false,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("mitigations : idempotence, vérification seule, refus atomique des octets et versions inattendus", async () => {
  const directory = await originalInstallation();
  try {
    await assert.rejects(
      patchDependencies(directory, true),
      /empreinte inattendue/,
    );
    const last = path.join(directory, "node_modules", plan.files.at(-1)!.file);
    const first = path.join(directory, "node_modules", plan.files[0]!.file);
    const before = await readFile(first, "utf8");
    const lastOriginal = await readFile(last, "utf8");
    await writeFile(last, lastOriginal + "\n// altered");
    await assert.rejects(patchDependencies(directory), /empreinte inattendue/);
    assert.equal(await readFile(first, "utf8"), before);
    await writeFile(last, lastOriginal);
    await patchDependencies(directory);
    const patched = await readFile(first, "utf8");
    await patchDependencies(directory);
    await patchDependencies(directory, true);
    assert.equal(await readFile(first, "utf8"), patched);
    await writeFile(
      path.join(directory, "node_modules/braces/package.json"),
      JSON.stringify({ version: "3.0.4" }),
    );
    await assert.rejects(patchDependencies(directory), /version inattendue/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("audit : seules les deux sources mitigées passent, cycles Nuxt compris ; aucun autre avis accepté", () => {
  const braces = {
    name: "braces",
    severity: "high",
    via: [
      {
        source: 1240992,
        url: "https://github.com/advisories/GHSA-vfj7-8cjw-p6xm",
      },
    ],
  };
  const nuxt = { name: "nuxt", severity: "high", via: ["nitro"] };
  const nitro = { name: "nitro", severity: "high", via: ["nuxt", "braces"] };
  assert.equal(verifyAudit({ vulnerabilities: { braces, nuxt, nitro } }), 3);
  assert.equal(verifyAudit({ vulnerabilities: {} }), 0);
  for (const severity of ["low", "moderate", "high", "critical"])
    assert.throws(
      () =>
        verifyAudit({
          vulnerabilities: {
            braces,
            unexpected: {
              name: "unexpected",
              severity,
              via: [{ source: 42, url: "https://github.com/advisories/new" }],
            },
          },
        }),
      /sans mitigation validée/,
    );
  assert.throws(
    () =>
      verifyAudit({
        vulnerabilities: {
          braces: {
            ...braces,
            via: [...braces.via, { source: 42, url: "other" }],
          },
        },
      }),
    /sans mitigation validée/,
  );
  assert.throws(
    () =>
      verifyAudit({
        vulnerabilities: { nuxt, nitro: { ...nitro, via: ["nuxt"] } },
      }),
    /sans mitigation validée/,
  );
  assert.throws(
    () => verifyAudit({ vulnerabilities: { nuxt } }),
    /sans mitigation validée/,
  );
});
