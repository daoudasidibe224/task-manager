import { readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
for (const directory of ["backend", "frontend"]) {
  let source = await readFile(`${directory}/.env.example`, "utf8");
  if (directory === "backend")
    source = source
      .replace(
        "JWT_SECRET=\n",
        `JWT_SECRET=${randomBytes(32).toString("hex")}\n`,
      )
      .replace(
        "REFRESH_TOKEN_SECRET=\n",
        `REFRESH_TOKEN_SECRET=${randomBytes(32).toString("hex")}\n`,
      );
  try {
    await writeFile(`${directory}/.env`, source, { flag: "wx", mode: 0o600 });
    console.log(`${directory}/.env créé.`);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "EEXIST")
      console.log(`${directory}/.env conservé.`);
    else throw error;
  }
}
