// Runs on Vercel as the build step (`npm run vercel-build`). Appends a
// content hash to every /css/* and /js/* reference in the HTML pages, so
// vercel.json can let browsers cache those files for a year: a returning
// visitor then loads a page without re-asking the server for each
// stylesheet/script (saves edge requests + bandwidth), and any edit to a
// file changes its hash, so nobody is ever stuck on a stale copy.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.join(__dirname, "..");
const hashes = new Map();

function hashOf(urlPath) {
  if (!hashes.has(urlPath)) {
    const file = path.join(root, urlPath);
    hashes.set(urlPath, fs.existsSync(file)
      ? crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex").slice(0, 10)
      : null);
  }
  return hashes.get(urlPath);
}

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name === "node_modules" || e.name.startsWith(".")) return [];
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return htmlFiles(full);
    return e.name.endsWith(".html") ? [full] : [];
  });
}

let stamped = 0;
for (const file of htmlFiles(root)) {
  const before = fs.readFileSync(file, "utf8");
  const after = before.replace(/(href|src)="(\/(?:css|js)\/[^"?#]+)"/g, (m, attr, url) => {
    const h = hashOf(url);
    if (!h) return m;
    stamped++;
    return `${attr}="${url}?v=${h}"`;
  });
  if (after !== before) fs.writeFileSync(file, after);
}
console.log(`stamp-assets: versioned ${stamped} css/js references`);
