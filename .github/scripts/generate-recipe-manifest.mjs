import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

// Write outputs to REPO ROOT so the URLs are predictable
const OUT_TXT = path.join(repoRoot, "manifest.txt");
const OUT_JSON = path.join(repoRoot, "manifest.json");

// Not recipes
const IGNORE_BASENAMES = new Set([
  "index.html",
  "index-static.html",
  "manifest.html",
  "manifest.txt",
  "manifest.json",
  "Meals-Master-Template.html"
]);

// Not recipes folders
const IGNORE_DIR_NAMES = new Set([
  ".git",
  ".github",
  "img",
  "images",
  "assets",
  "css",
  "js",
  "node_modules"
]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];

  for (const ent of entries) {
    const full = path.join(dir, ent.name);

    if (ent.isDirectory()) {
      if (IGNORE_DIR_NAMES.has(ent.name)) continue;
      results.push(...walk(full));
      continue;
    }

    if (!ent.isFile()) continue;

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

// Collect recipe HTML files anywhere in repo (excluding ignored folders)
const filesFull = walk(repoRoot);

// Convert to repo-relative paths (supports subfolders if you add them later)
const filesRel = filesFull
  .map(f => toPosix(path.relative(repoRoot, f)))
  .filter(Boolean)
  .sort((a, b) => a.localeCompare(b, "en"));

const txt = filesRel.join("\n") + (filesRel.length ? "\n" : "");
const json = JSON.stringify(
  { generatedAt: new Date().toISOString(), count: filesRel.length, files: filesRel },
  null,
  2
) + "\n";

fs.writeFileSync(OUT_TXT, txt, "utf8");
fs.writeFileSync(OUT_JSON, json, "utf8");

console.log(`Wrote ${filesRel.length} entries to:`);
console.log(`- ${path.relative(repoRoot, OUT_TXT)}`);
console.log(`- ${path.relative(repoRoot, OUT_JSON)}`);
