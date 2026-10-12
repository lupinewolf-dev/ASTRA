import { it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
it("uses the same project data directory from root and server workspace", () => {
  const root = fileURLToPath(new URL("../../../", import.meta.url));
  const module = fileURLToPath(new URL("../src/paths.ts", import.meta.url));
  const run = (cwd: string, custom?: string) => {
    const r = spawnSync(
      process.execPath,
      [
        "--import",
        resolve(root, "node_modules/tsx/dist/loader.mjs"),
        "--input-type=module",
        "-e",
        `import {databasePath} from ${JSON.stringify(module)};console.log(databasePath(${JSON.stringify(custom) ?? "undefined"}))`,
      ],
      { cwd, encoding: "utf8" },
    );
    expect(r.status, r.stderr).toBe(0);
    return r.stdout.trim();
  };
  expect(run(root)).toBe(resolve(root, "data/farm.sqlite"));
  expect(run(resolve(root, "apps/server"))).toBe(run(root));
  expect(run(root, "custom/farm.sqlite")).toBe(
    run(resolve(root, "apps/server"), "custom/farm.sqlite"),
  );
});
