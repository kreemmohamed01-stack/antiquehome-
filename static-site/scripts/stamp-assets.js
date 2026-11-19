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

// Minify every stylesheet and script first (whitespace, comments, local
// names), so the hashes below are taken of the files actually served.
// Plain transform, no bundling: each JS file stays a classic script and
// keeps its top-level globals (cldUrl, API, AH_I18N...) that other files use.
const esbuild = require("esbuild");
let minified = 0;
for (const dir of ["css", "js"]) {
  for (const name of fs.readdirSync(path.join(root, dir), { recursive: true })) {
    const loader = path.extname(name).slice(1);
    if (loader !== "css" && loader !== "js") continue;
    const file = path.join(root, dir, name);
    const { code } = esbuild.transformSync(fs.readFileSync(file, "utf8"), {
      loader, minify: true, charset: "utf8", legalComments: "none",
      target: loader === "js" ? "es2019" : undefined,
    });
    fs.writeFileSync(file, code);
    minified++;
  }
}
console.log(`stamp-assets: minified ${minified} css/js files`);

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

// Only the small storefront stylesheets (fonts, page-loader) are inlined.
// The big ones (base.css is ~20KB brotli) stay as files cached for a year:
// inlining them re-sent them inside every page view, which was most of the
// site's Vercel bandwidth. The admin keeps cached files too.
const INLINE_CSS_MAX = 6000; // bytes, after minifying
let inlined = 0;
function inlineCss(html) {
  return html.replace(/<link rel="stylesheet" href="(\/css\/[^"?#]+\.css)" \/>/g, (m, url) => {
    const file = path.join(root, url);
    if (!fs.existsSync(file) || fs.statSync(file).size > INLINE_CSS_MAX) return m;
    inlined++;
    return `<style>${fs.readFileSync(file, "utf8")}</style>`;
  });
}

// <script src="/js/x.js" data-inline> is replaced by the file's code, for
// tiny scripts that must run before the rest of the page parses (the
// "Loading" screen) without a blocking request.
function inlineJs(html) {
  return html.replace(/<script src="(\/js\/[^"?#]+\.js)" data-inline><\/script>/g, (m, url) => {
    const file = path.join(root, url);
    if (!fs.existsSync(file)) return m;
    inlined++;
    return `<script>${fs.readFileSync(file, "utf8")}</script>`;
  });
}

let stamped = 0;
for (const file of htmlFiles(root)) {
  let before = fs.readFileSync(file, "utf8");
  const isAdmin = path.relative(root, file).split(path.sep)[0] === "admin";
  const source = before;
  if (!isAdmin) before = inlineJs(inlineCss(before));
  const after = before.replace(/(href|src)="(\/(?:css|js)\/[^"?#]+)"/g, (m, attr, url) => {
    const h = hashOf(url);
    if (!h) return m;
    stamped++;
    return `${attr}="${url}?v=${h}"`;
  });
  if (after !== source) fs.writeFileSync(file, after);
}
console.log(`stamp-assets: inlined ${inlined} stylesheets/scripts, versioned ${stamped} css/js references`);
