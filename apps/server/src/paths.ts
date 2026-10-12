import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
export function serverRoot() {
  let path = dirname(fileURLToPath(import.meta.url));
  while (dirname(path) !== path) {
    const manifest = resolve(path, "package.json");
    if (
      existsSync(manifest) &&
      JSON.parse(readFileSync(manifest, "utf8")).name === "@astra/server"
    )
      return path;
    path = dirname(path);
  }
  throw Error("No se encontró la carpeta del servidor");
}

export function databasePath(configured?: string) {
  return resolve(serverRoot(), "../../", configured ?? "data/farm.sqlite");
}
