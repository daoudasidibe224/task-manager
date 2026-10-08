import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const compiler = require.resolve("typescript/bin/tsc");
const config = path.join(root, "backend/tsconfig.build.json");
const children: ChildProcess[] = [];
function launch(args: string[], cwd = root) {
  const child = spawn(process.execPath, args, {
    cwd,
    env: process.env,
    stdio: "inherit",
  });
  children.push(child);
  return child;
}
const built = launch([compiler, "-p", config]);
await new Promise<void>((resolve, reject) => {
  built.once("exit", (code) =>
    code === 0
      ? resolve()
      : reject(new Error(`Compilation API échouée (${code})`)),
  );
  built.once("error", reject);
});
launch([compiler, "-p", config, "--watch", "--preserveWatchOutput"]);
launch(
  ["--watch", path.join(root, "backend/dist/main.js")],
  path.join(root, "backend"),
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    for (const child of children)
      if (child.exitCode === null) child.kill(signal);
  });
