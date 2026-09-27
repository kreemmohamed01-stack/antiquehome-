import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs";
import path from "node:path";

const sql = neon(process.env.DATABASE_URL as string);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const LIGHTING_DIR = path.resolve(process.cwd(), "lighting");

/** Upload one local file to Cloudinary, return the secure URL. */
async function upload(file: string): Promise<string> {
  const full = path.join(LIGHTING_DIR, file);
  const res = await cloudinary.uploader.upload(full, {
    folder: "antique-home/products/lighting",
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  });
  return res.secure_url;
}

type Variant = { label: string; price: number; stock: number };

type Seed = {
  prefix: string;          // image filename prefix in /lighting
  name: string;
  description: string;
  price: number;           // base / default price
  variants?: Variant[];
  colorNames?: string[];   // colour labels; hex guessed below
  stock: number;
  sku: string;
  isNewArrival?: boolean;
};

/** Colour name -> swatch hex used on the PDP. */
const HEX: Record<string, string> = {
  White: "#F4F1EA",
  Gold: "#C9A227",
  Blue: "#27408B",
  "Blue & White": "#3B5EA8",
  Ivory: "#F2E8D5",
  Multicolour: "#C98B5E",
};

const SEEDS: Seed[] = [
  {
    prefix: "h",
    name: "Porcelain Lampshade with Chapou — Floral",
    description:
      "A hand-finished porcelain lamp base in openwork white, paired with a floral chapou shade. Warm, decorative light for a console, bedside or entry table.",
    price: 4250,
    stock: 6,
    sku: "AH-LT-H01",
    colorNames: ["White"],
    isNewArrival: true,
  },
  {
    prefix: "j",
    name: "Porcelain Lampshade with Chapou — Ribbed",
    description:
      "A ribbed ceramic base in soft ivory under a floral chapou shade. Compact enough for a bedside table, refined enough for a living room.",
    price: 2500,
    stock: 8,
    sku: "AH-LT-J01",
    colorNames: ["Ivory"],
    variants: [
      { label: "50 cm", price: 2500, stock: 8 },
      { label: "55 cm", price: 3000, stock: 5 },
      { label: "60 cm", price: 3000, stock: 4 },
    ],
  },
  {
    prefix: "m",
    name: "Blue & White Porcelain Table Lamp",
    description:
      "Classic bleu blanc porcelain hand-painted with florals, topped with a natural linen shade and finished on a polished brass base.",
    price: 3000,
    stock: 7,
    sku: "AH-LT-M01",
    colorNames: ["Blue & White"],
    isNewArrival: true,
  },
  {
    prefix: "x",
    name: "Porcelain Lampshade with Chapou — Made in Japan",
    description:
      "A Japanese porcelain base with a hand-painted garden scene, crowned with a textured linen shade on a brass foot.",
    price: 3000,
    stock: 3,
    sku: "AH-LT-X01",
    colorNames: ["Multicolour"],
  },
  {
    prefix: "z",
    name: "Lampadaire Stainless Steel — Double Sphere",
    description:
      "A slender stainless steel floor lamp with twin blue-and-white porcelain spheres and a deep navy drum shade. Height 1,60 m.",
    price: 5000,
    stock: 4,
    sku: "AH-LT-Z01",
    colorNames: ["Blue", "White", "Gold"],
    isNewArrival: true,
  },
  {
    prefix: "n",
    name: "Porcelain Sphere Table Lamp",
    description:
      "Two hand-painted porcelain spheres stacked on a marble foot, under a gold-rimmed drum shade.",
    price: 4500,
    stock: 5,
    sku: "AH-LT-N01",
    colorNames: ["Blue & White"],
  },
  {
    prefix: "l",
    name: "Openwork Ginger Jar Floor Lamp",
    description:
      "An openwork ceramic ginger jar on a tall brass stem, available in white or gold with your choice of shade.",
    price: 6000,
    stock: 4,
    sku: "AH-LT-L01",
    colorNames: ["White", "Gold"],
  },
  {
    prefix: "اب",
    name: "Lampadaire Stainless Steel — Shelf Stand",
    description:
      "A floor lamp and side table in one: three marble shelves on a brass frame, with a porcelain sphere detail under the shade. Height 1,60 m.",
    price: 6000,
    stock: 2,
    sku: "AH-LT-AB01",
    colorNames: ["Gold", "White"],
  },
  {
    prefix: "ل",
    name: "Lampadaire Stainless Steel — Porcelain Stem",
    description:
      "A pair-ready brass floor lamp with a hand-painted blue and white porcelain stem and a pleated gold-rimmed shade. Height 1,60 m.",
    price: 4500,
    stock: 6,
    sku: "AH-LT-LA01",
    colorNames: ["Blue & White"],
  },
];

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** All files for a prefix, hero (…11) first. */
function filesFor(prefix: string): string[] {
  const all = fs.readdirSync(LIGHTING_DIR);
  const mine = all.filter((f) => {
    const base = f.replace(/\.[^.]+$/, "");
    return base === `${prefix} 11` || new RegExp(`^${prefix} \\d+$`).test(base);
  });
  const hero = mine.filter((f) => /\s11\./.test(f));
  const rest = mine.filter((f) => !/\s11\./.test(f)).sort();
  return [...hero, ...rest];
}

async function main() {
  const lighting = (await sql`SELECT id FROM categories WHERE slug = 'lighting'`) as { id: number }[];
  if (!lighting.length) throw new Error("lighting category not found");
  const categoryId = lighting[0].id;

  // wipe the old placeholder catalogue so we start clean on real stock
  console.log("Removing any previous products…");
  await sql`DELETE FROM order_items WHERE product_id IS NOT NULL`;
  await sql`DELETE FROM product_categories`;
  await sql`DELETE FROM products`;

  for (const seed of SEEDS) {
    const files = filesFor(seed.prefix);
    if (!files.length) {
      console.warn(`! no images for prefix "${seed.prefix}" — skipping`);
      continue;
    }
    console.log(`Uploading ${files.length} image(s) for ${seed.name}…`);
    const urls: string[] = [];
    for (const f of files) urls.push(await upload(f));

    const colorOptions = (seed.colorNames || []).map((n, i) => ({
      name: n,
      hex: HEX[n] || "#C9A227",
      // first colour owns the full gallery, extra colours reuse it until
      // the client uploads colour-specific shots from the dashboard
      imageUrls: i === 0 ? urls : [],
    }));

    const variants = seed.variants || [];
    const stock = variants.length
      ? variants.reduce((s, v) => s + v.stock, 0)
      : seed.stock;

    const rows = (await sql`
      INSERT INTO products (
        name, slug, description, price, category_id, material,
        colors, color_options, variants, image_urls,
        stock_qty, low_stock_threshold, is_new_arrival, status, sku, pricing_mode
      ) VALUES (
        ${seed.name}, ${slugify(seed.name)}, ${seed.description}, ${seed.price}, ${categoryId}, 'Porcelain',
        ${JSON.stringify(seed.colorNames || [])}, ${JSON.stringify(colorOptions)},
        ${JSON.stringify(variants)}, ${JSON.stringify(urls)},
        ${stock}, 5, ${seed.isNewArrival ?? false}, 'active', ${seed.sku}, 'unit'
      ) RETURNING id
    `) as { id: number }[];

    await sql`
      INSERT INTO product_categories (product_id, category_id)
      VALUES (${rows[0].id}, ${categoryId}) ON CONFLICT DO NOTHING
    `;
    console.log(`  ✓ ${seed.name}`);
  }

  console.log("Lighting catalogue seeded.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
