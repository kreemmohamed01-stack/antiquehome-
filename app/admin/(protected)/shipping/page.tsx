import { sql, type ShippingRate } from "@/lib/db";
import ShippingTable from "@/app/components/admin/ShippingTable";

export const revalidate = 0;
export const metadata = { title: "Shipping — Antique Home Admin" };

async function getRates() {
  try {
    return (await sql`SELECT * FROM shipping_rates ORDER BY sort_order`) as ShippingRate[];
  } catch {
    return [];
  }
}

export default async function AdminShippingPage() {
  const rates = await getRates();

  return (
    <div className="admin__panel">
      <div className="admin__panel-head">
        <h2 className="admin__panel-title">Shipping Rates</h2>
      </div>
      <p style={{ fontSize: 12, color: "var(--a-text-dim)", marginBottom: 18 }}>
        Set the standard and express delivery price for each governorate. Customers see these
        live at checkout based on the governorate they select.
      </p>
      <ShippingTable rates={rates} />
    </div>
  );
}
