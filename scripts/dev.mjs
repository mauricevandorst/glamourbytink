import chokidar from "chokidar";
import { mkdirSync, cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";

const SRC = "src";
const DOCS = "docs";
const ROOT_STATIC_EXTENSIONS = new Set([".html", ".xml", ".txt"]);

function ensureDirs() {
  mkdirSync(path.join(DOCS, "css"), { recursive: true });
  mkdirSync(path.join(DOCS, "js"), { recursive: true });
  mkdirSync(path.join(DOCS, "assets"), { recursive: true });
}

function copyFile(from, to) {
  ensureDirs();
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(from, to, { force: true });
}

function rewritePublishedHtml(html, depth = 0) {
  const prefix = depth === 0 ? "./" : "../";

  return html
    .replace(/(href|src|srcset)=(["'])\/(css|js|assets)\//g, `$1=$2${prefix}$3/`)
    .replace(/href=(["'])\/(?!\/)(?!css\/|js\/|assets\/)([^"']*)\1/g, (_match, quote, target) => {
      const normalizedTarget = target ? `${prefix}${target}` : prefix;
      return `href=${quote}${normalizedTarget}${quote}`;
    });
}

function copyPublishedHtml(from, to, depth = 0) {
  ensureDirs();
  mkdirSync(path.dirname(to), { recursive: true });
  const source = readFileSync(from, "utf8");
  writeFileSync(to, rewritePublishedHtml(source, depth), "utf8");
}

function copyDir(from, to) {
  ensureDirs();
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true, force: true });
}

function removePath(p) {
  if (existsSync(p)) rmSync(p, { recursive: true, force: true });
}

function isRootStaticFile(file) {
  const ext = path.extname(file).toLowerCase();
  return ROOT_STATIC_EXTENSIONS.has(ext);
}

function syncRootStaticFile(file) {
  if (!isRootStaticFile(file)) return;

  const srcFile = path.join(SRC, file);
  const ext = path.extname(file).toLowerCase();

  if (ext === ".html") {
    copyPublishedHtml(srcFile, path.join(DOCS, file), 0);
  } else {
    copyFile(srcFile, path.join(DOCS, file));
  }

  // GitHub Pages supports clean routes when a folder has an index.html file.
  if (ext === ".html" && file !== "index.html") {
    const slug = file.slice(0, -5);
    copyPublishedHtml(srcFile, path.join(DOCS, slug, "index.html"), 1);
  }
}

function removeRootStaticFile(file) {
  if (!isRootStaticFile(file)) return;

  const ext = path.extname(file).toLowerCase();
  removePath(path.join(DOCS, file));

  if (ext === ".html" && file !== "index.html") {
    const slug = file.slice(0, -5);
    removePath(path.join(DOCS, slug));
  }
}

function initialSync() {
  ensureDirs();

  for (const file of readdirSync(SRC)) {
    syncRootStaticFile(file);
  }

  copyDir(path.join(SRC, "js"), path.join(DOCS, "js"));
  copyDir(path.join(SRC, "assets"), path.join(DOCS, "assets"));
}

function toDocsPath(srcPath) {
  // src/xyz -> docs/xyz
  return path.join(DOCS, path.relative(SRC, srcPath));
}

ensureDirs();
initialSync();

// Tailwind watcher (dev: geen minify)
const tw = spawn(
  process.platform === "win32" ? "npm.cmd" : "npm",
  [
    "exec",
    "--",
    "tailwindcss",
    "-i",
    "./src/css/main.css",
    "-o",
    "./docs/css/main.css",
    "--postcss",
    "--watch",
  ],
  {
    stdio: "inherit",
    shell: process.platform === "win32", // belangrijk voor Windows + spaties in paden
  }
);

const watcher = chokidar.watch(
  [
    SRC,
    `${SRC}/js/**`,
    `${SRC}/assets/**`,
  ],
  { ignoreInitial: true }
);

function isRootHtml(p) {
  // alleen src/*.{html,xml,txt} (geen subfolders)
  return p.startsWith(`${SRC}${path.sep}`) &&
    ROOT_STATIC_EXTENSIONS.has(path.extname(p).toLowerCase()) &&
    path.dirname(p) === SRC;
}

function syncChangedPath(p) {
  if (isRootHtml(p)) {
    syncRootStaticFile(path.basename(p));
    return;
  }

  if (p.includes(`${path.sep}js${path.sep}`) ||
    p.includes(`${path.sep}assets${path.sep}`)) {
    copyFile(p, toDocsPath(p));
  }
}

watcher
  .on("add", (p) => {
    syncChangedPath(p);
  })
  .on("change", (p) => {
    syncChangedPath(p);
  })
  .on("unlink", (p) => {
    if (isRootHtml(p)) {
      removeRootStaticFile(path.basename(p));
      return;
    }

    removePath(toDocsPath(p));
  })
  .on("addDir", (p) => {
    const dest = toDocsPath(p);
    mkdirSync(dest, { recursive: true });
  })
  .on("unlinkDir", (p) => {
    const dest = toDocsPath(p);
    removePath(dest);
  });

// Netjes afsluiten
function shutdown(code = 0) {
  try {
    watcher.close();
  } catch { }
  try {
    tw.kill("SIGINT");
  } catch { }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
