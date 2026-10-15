import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { networkInterfaces } from "node:os";
import { spawn } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "web");
const port = Number(process.env.ASTRA_DEMO_PORT || 5173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};
const server = createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    res.end();
    return;
  }
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    if (pathname === "/") {
      res.writeHead(302, { Location: "/visual.html?demo=1" });
      res.end();
      return;
    }
    const file = resolve(root, `.${pathname}`);
    if (
      !file.startsWith(root + sep) ||
      pathname.includes("\0") ||
      pathname.includes("\\")
    ) {
      res.writeHead(403);
      res.end();
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
    });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(404);
    res.end("No encontrado");
  }
});
server.on("error", (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `El puerto ${port} ya esta ocupado. Cerra la otra ventana de ASTRA y volve a abrir JUGAR.cmd.`
      : error.message,
  );
  process.exitCode = 1;
});
server.listen(port, "0.0.0.0", () => {
  const url = `http://localhost:${port}/`;
  console.log(`\nASTRA - Demo jugable\n\nPC: ${url}\n`);
  for (const entries of Object.values(networkInterfaces()))
    for (const address of entries || [])
      if (address.family === "IPv4" && !address.internal)
        console.log(
          `Celular (misma red Wi-Fi): http://${address.address}:${port}/`,
        );
  console.log(
    "\nDeja esta ventana abierta mientras jugas. Ctrl+C para cerrar.\n",
  );
  if (process.platform === "win32" && process.argv.includes("--open")) {
    const child = spawn("cmd.exe", ["/c", "start", "", url], {
      stdio: "ignore",
    });
    child.on("error", () => console.log(`Abri ${url} en tu navegador.`));
  }
});
