import { getSiteSale } from "@/lib/db";

export default async function SaleBanner() {
  const sale = await getSiteSale();
  if (!sale.active || sale.percent <= 0) return null;

  const label = sale.label?.trim() || `Sale ${sale.percent}% Off Everything`;

  return (
    <a href="/shop" className="sale-banner">
      <span className="sale-banner__pct">{sale.percent}% OFF</span>
      <span className="sale-banner__text">{label}</span>
      <span className="sale-banner__arrow" aria-hidden="true">
        <svg viewBox="0 0 26 12"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
      </span>
    </a>
  );
}
