// Compresses every PNG/JPEG under public/ in place, same filename, same
// format, just re-encoded at a sane quality/compression level. This cuts
// static-asset bandwidth without touching any component code (all <img
// src="..."> paths stay valid).
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "public");
const MAX_DIM = 1920; // no on-site image needs to be wider than this

let totalBefore = 0;
let totalAfter = 0;
let count = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (/\.(png|jpe?g)$/i.test(entry.name)) {
      processFile(full);
    }
  }
}

async function processFile(file) {
  const before = fs.statSync(file).size;
  const buf = fs.readFileSync(file);
  const ext = path.extname(file).toLowerCase();

  let img = sharp(buf, { failOn: "none" }).rotate();
  const meta = await img.metadata();
  if (meta.width && meta.width > MAX_DIM) {
    img = img.resize({ width: MAX_DIM });
  }

  let out;
  if (ext === ".png") {
    out = await img.png({ compressionLevel: 9, palette: true, quality: 82 }).toBuffer();
  } else {
    out = await img.jpeg({ quality: 78, mozjpeg: true }).toBuffer();
  }

  // Only overwrite if we actually shrank it.
  if (out.length < before) {
    fs.writeFileSync(file, out);
    totalBefore += before;
    totalAfter += out.length;
    count++;
    console.log(`${path.relative(ROOT, file)}: ${(before / 1024).toFixed(0)}KB -> ${(out.length / 1024).toFixed(0)}KB`);
  }
}

async function main() {
  const files = [];
  (function collect(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) collect(full);
      else if (/\.(png|jpe?g)$/i.test(entry.name)) files.push(full);
    }
  })(ROOT);

  for (const f of files) {
    await processFile(f);
  }

  console.log(`\nCompressed ${count} files: ${(totalBefore / 1024 / 1024).toFixed(2)}MB -> ${(totalAfter / 1024 / 1024).toFixed(2)}MB`);
}

main();
