/**
 * One-off / repeatable: replace former maintainer repo slugs with current repo.
 * Run from repo root: node scripts/replace-laoqin-github-refs.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const exts = new Set([
  ".md",
  ".yml",
  ".yaml",
  ".txt",
  ".json",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".toml",
]);
const skipDirs = new Set([".git", "node_modules", "dist", "build", ".wrangler"]);

const replacements = [
  [/https:\/\/github\.com\/laoqin1689\/don-ai/g, "https://github.com/Willkidz/ad-cloak-system"],
  [/https:\/\/github\.com\/laoqin1689\/cloak-admin/g, "https://github.com/Willkidz/ad-cloak-system"],
  [/github\.com\/laoqin1689\/don-ai/g, "github.com/Willkidz/ad-cloak-system"],
  [/github\.com\/laoqin1689\/cloak-admin/g, "github.com/Willkidz/ad-cloak-system"],
  [/laoqin1689\/don-ai/g, "Willkidz/ad-cloak-system"],
  [/laoqin1689\/cloak-admin/g, "Willkidz/ad-cloak-system"],
];

let scanned = 0;
let changedFiles = 0;

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const name = ent.name;
    if (name === "." || name === "..") continue;

    const full = path.join(dir, name);
    if (ent.isDirectory()) {
      if (skipDirs.has(name)) continue;
      walk(full);
      continue;
    }

    const ext = path.extname(name).toLowerCase();
    if (!exts.has(ext)) continue;

    const st = fs.statSync(full);
    if (st.size > 5 * 1024 * 1024) continue;

    scanned++;
    const before = fs.readFileSync(full, "utf8");
    let after = before;
    for (const [re, rep] of replacements) {
      after = after.replace(re, rep);
    }
    if (after !== before) {
      fs.writeFileSync(full, after, "utf8");
      changedFiles++;
    }
  }
}

walk(root);
console.log(`scanned: ${scanned}, changed files: ${changedFiles}`);
