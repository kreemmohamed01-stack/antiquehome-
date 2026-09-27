import { sql, getSiteSale, type Coupon } from "@/lib/db";
import DiscountsManager from "@/app/components/admin/DiscountsManager";

export const revalidate = 0;
export const metadata = { title: "Discounts — Antique Home Admin" };

async function getCoupons() {
  try {
    return (await sql`SELECT * FROM coupons ORDER BY created_at DESC`) as Coupon[];
  } catch {
    return [];
  }
}

export default async function AdminDiscountsPage() {
  const [sale, coupons] = await Promise.all([getSiteSale(), getCoupons()]);
  return <DiscountsManager initialSale={sale} initialCoupons={coupons} />;
}
