import { sql, type Product } from "@/lib/db";
import ReviewsTable from "@/app/components/admin/ReviewsTable";

export const revalidate = 0;
export const metadata = { title: "Reviews — Antique Home Admin" };

async function getProducts() {
  try {
    return (await sql`SELECT * FROM products ORDER BY name`) as Product[];
  } catch {
    return [];
  }
}

export default async function AdminReviewsPage() {
  const products = await getProducts();

  return (
    <div className="admin__panel">
      <div className="admin__panel-head">
        <h2 className="admin__panel-title">Reviews &amp; Ratings</h2>
      </div>
      <p style={{ fontSize: 12, color: "var(--a-text-dim)", marginBottom: 18 }}>
        Set the star rating and review count shown on each product page.
      </p>
      <ReviewsTable products={products} />
    </div>
  );
}
