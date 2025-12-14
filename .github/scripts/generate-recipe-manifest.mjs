import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

// Folder that contains your recipe HTML files:
const RECIPES_DIR = path.join(repoRoot, "recipes");

// Output files (static artifacts the assistant can read):
const OUT_TXT = path.join(RECIPES_DIR, "manifest.txt");
const OUT_JSON = path.join(RECIPES_DIR, "manifest.json");

// Files to ignore (not actual recipes):
const IGNORE_BASENAMES = new Set([
  "index.html",
  "index-static.html",
  "manifest.html",
  "manifest.txt",
  "manifest.json"
]);

// Ignore folders that are not recipes:
const IGNORE_DIR_NAMES = new Set([
  ".git",
  ".github",
  "img",
  "images",
  "assets",
  "css",
  "js"
]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];

  for (const ent of entries) {
    if (ent.isDirectory()) {
      if (IGNORE_DIR_NAMES.has(ent.name)) continue;
      results.push(...walk(path.join(dir, ent.name)));
      continue;
    }

    if (!ent.isFile()) continue;

    const full = path.join(dir, ent.name);
    const ext = path.extname(ent.name).toLowerCase();
    if (ext !== ".html") continue;

    const base = path.basename(ent.name);
    if (IGNORE_BASENAMES.has(base)) continue;

    results.push(full);
  }

  return results;
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

if (!fs.existsSync(RECIPES_DIR)) {
  console.error(`Missing folder: ${RECIPES_DIR}`);
  process.exit(1);
}

// Collect HTML recipe files under /recipes (including subfolders)
const filesFull = walk(RECIPES_DIR);

// Convert to /recipes-relative paths (supports subfolders)
const filesRel = filesFull
  .map(f => toPosix(path.relative(RECIPES_DIR, f)))
  .filter(Boolean)
  .sort((a, b) => a.localeCompare(b, "en"));

const txt = filesRel.join("\n") + (filesRel.length ? "\n" : "");
const json = JSON.stringify(
  {
    generatedAt: new Date().toISOString(),
    count: filesRel.length,
    files: filesRel
  },
  null,
  2
) + "\n";

fs.writeFileSync(OUT_TXT, txt, "utf8");
fs.writeFileSync(OUT_JSON, json, "utf8");

console.log(`Wrote ${filesRel.length} entries to:`);
console.log(`- ${path.relative(repoRoot, OUT_TXT)}`);
console.log(`- ${path.relative(repoRoot, OUT_JSON)}`);
