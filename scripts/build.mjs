import { rmSync, mkdirSync, cpSync, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const SRC = "src";
const DOCS = "docs";
const ROOT_STATIC_EXTENSIONS = new Set([".html", ".xml", ".txt"]);

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
  const source = readFileSync(from, "utf8");
  writeFileSync(to, rewritePublishedHtml(source, depth), "utf8");
}

function copyRootStaticFile(file) {
  const ext = file.slice(file.lastIndexOf(".")).toLowerCase();
  if (!ROOT_STATIC_EXTENSIONS.has(ext)) return;

  if (ext === ".html") {
    copyPublishedHtml(`${SRC}/${file}`, `${DOCS}/${file}`, 0);
  } else {
    cpSync(`${SRC}/${file}`, `${DOCS}/${file}`, { force: true });
  }

  // GitHub Pages supports clean routes when a folder has an index.html file.
  if (ext === ".html" && file !== "index.html") {
    const slug = file.slice(0, -5);
    mkdirSync(`${DOCS}/${slug}`, { recursive: true });
    copyPublishedHtml(`${SRC}/${file}`, `${DOCS}/${slug}/index.html`, 1);
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
