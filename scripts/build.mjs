import { rmSync, mkdirSync, cpSync, existsSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";

const SRC = "src";
const DOCS = "docs";
const ROOT_STATIC_EXTENSIONS = new Set([".html", ".xml", ".txt"]);

function copyRootStaticFile(file) {
  const ext = file.slice(file.lastIndexOf(".")).toLowerCase();
  if (!ROOT_STATIC_EXTENSIONS.has(ext)) return;

  cpSync(`${SRC}/${file}`, `${DOCS}/${file}`, { force: true });

  // GitHub Pages supports clean routes when a folder has an index.html file.
  if (ext === ".html" && file !== "index.html") {
    const slug = file.slice(0, -5);
    mkdirSync(`${DOCS}/${slug}`, { recursive: true });
    cpSync(`${SRC}/${file}`, `${DOCS}/${slug}/index.html`, { force: true });
  }
}

function clean() {
  if (existsSync(DOCS)) rmSync(DOCS, { recursive: true, force: true });
  mkdirSync(`${DOCS}/css`, { recursive: true });
  mkdirSync(`${DOCS}/js`, { recursive: true });
  mkdirSync(`${DOCS}/assets`, { recursive: true });
}

function copyStatic() {
  // kopieer alle root-bestanden die direct gepubliceerd moeten worden
  for (const file of readdirSync(SRC)) {
    copyRootStaticFile(file);
  }

  cpSync(`${SRC}/js`, `${DOCS}/js`, { recursive: true, force: true });
  cpSync(`${SRC}/assets`, `${DOCS}/assets`, { recursive: true, force: true });
}

function buildCss() {
  execSync(
    "npx tailwindcss -i ./src/css/main.css -o ./docs/css/main.css --postcss --minify",
    { stdio: "inherit" }
  );
}

clean();
copyStatic();
buildCss();
