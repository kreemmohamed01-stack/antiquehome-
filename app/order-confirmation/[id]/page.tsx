import { notFound } from "next/navigation";
import { sql, type Order, type OrderItem } from "@/lib/db";
import PrintButton from "../../components/PrintButton";

export const metadata = {
  title: "Order Confirmed — Antique Home",
  description: "Thank you for your order — your receipt and order details.",
};

function fmt(n: number | string) {
  const num = typeof n === "string" ? parseFloat(n) : n;
  return "EGP " + Math.round(num).toLocaleString("en-US");
}

async function getOrder(id: string) {
  const idNum = Number(id);
  const orders = (await sql`
    SELECT * FROM orders WHERE id = ${Number.isFinite(idNum) ? idNum : -1} OR order_number = ${id}
  `) as Order[];
  if (!orders.length) return null;
  const order = orders[0];
  const items = (await sql`SELECT * FROM order_items WHERE order_id = ${order.id}`) as OrderItem[];
  return { order, items };
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getOrder(id);
  if (!data) notFound();
  const { order, items } = data;

  const discount = parseFloat(order.discount) || 0;
  const cityGov = [order.city, order.governorate].filter(Boolean).join(", ");
  const orderDate = new Date(order.created_at).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="checkout-body">
      <div className="chk__bg" aria-hidden="true">
        <img src="/خلفيه منتجات.png" alt="" />
      </div>

      <header className="chk__topbar">
        <a className="chk__back" href="/shop">
          <svg viewBox="0 0 20 14" aria-hidden="true">
            <line x1="19" y1="7" x2="2" y2="7"></line>
            <polyline points="7.4,1.6 1.6,7 7.4,12.4"></polyline>
          </svg>
          Continue Shopping
        </a>

        <a className="chk__brand" href="/" aria-label="Antique Home — Vase & Decor">
          <span className="chk__brand-name">ANTIQUE HOME</span>
          <span className="chk__brand-sub">VASE &amp; DECOR</span>
        </a>

        <span className="chk__secure">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="4.8" y="10.4" width="14.4" height="10.4" rx="1.8"></rect>
            <path d="M8.1 10.4V7.6a3.9 3.9 0 0 1 7.8 0v2.8"></path>
          </svg>
          Secure Checkout
        </span>
      </header>

      <main className="oc">
        <section className="oc__success no-print">
          <span className="oc__check" aria-hidden="true">
            <svg viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="24"></circle>
              <polyline points="14,27 22,35 39,17"></polyline>
            </svg>
          </span>
          <p className="kicker kicker--center kicker--gold">Thank You</p>
          <h1 className="oc__title">Your Order is Confirmed</h1>
          <p className="oc__text">
            We&rsquo;ve received your order and we&rsquo;re getting it ready. A confirmation has
            been sent to your email.
          </p>

          <div className="oc__actions">
            <PrintButton />
            <a className="oc-btn oc-btn--outline" href="/shop">
              <span>Continue Shopping</span>
              <svg viewBox="0 0 26 12" aria-hidden="true">
                <line x1="0" y1="6" x2="22" y2="6"></line>
                <polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline>
              </svg>
            </a>
          </div>
        </section>

        <section className="receipt" id="receipt">
          <header className="receipt__head">
            <div className="receipt__brand">
              <span className="receipt__logoMark" aria-hidden="true">
                <svg viewBox="0 0 100 100">
                  <path d="M50 6 76 24 94 50 76 76 50 94 24 76 6 50 24 24Z"></path>
                  <path d="M50 13 71 28 87 50 71 72 50 87 29 72 13 50 29 28Z"></path>
                </svg>
              </span>
              <div>
                <p className="receipt__brandName">ANTIQUE HOME</p>
                <p className="receipt__brandSub">Vase &amp; Decor</p>
              </div>
            </div>
            <div className="receipt__meta">
              <p>
                <span>Order No.</span>
                <strong>{order.order_number}</strong>
              </p>
              <p>
                <span>Date</span>
                <strong>{orderDate}</strong>
              </p>
            </div>
          </header>

          <span className="ornament" aria-hidden="true">
            <i></i>
            <b></b>
            <i></i>
          </span>

          <div className="receipt__cols">
            <div className="receipt__block">
              <h3>Billed To</h3>
              <p>{order.customer_name || "—"}</p>
              <p>{order.email || "—"}</p>
              <p>{order.phone || "—"}</p>
            </div>
            <div className="receipt__block">
              <h3>Shipping Address</h3>
              <p>{order.address || "—"}</p>
              <p>{cityGov || "—"}</p>
            </div>
            <div className="receipt__block">
              <h3>Order Info</h3>
              <p>
                <span>Delivery:</span> <span>{order.delivery_method || "—"}</span>
              </p>
              <p>
                <span>Payment:</span> <span>{order.payment_method || "—"}</span>
              </p>
            </div>
          </div>

          <table className="receipt__table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length ? (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="receipt__itemName">
                        {item.image_snapshot ? (
                          <img className="receipt__itemImg" src={item.image_snapshot} alt="" />
                        ) : null}
                        <span>
                          {item.name_snapshot}
                        </span>
                      </div>
                    </td>
                    <td>{item.qty}</td>
                    <td>{fmt(item.price_snapshot)}</td>
                    <td>{fmt(parseFloat(item.price_snapshot) * item.qty)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "var(--ink-400)", padding: "20px 0" }}>
                    No items found for this order.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {order.notes ? (
            <div className="receipt__notes">
              <h3>Additional Notes</h3>
              <p>{order.notes}</p>
            </div>
          ) : null}

          <div className="receipt__totals">
            <div className="receipt__totalsRow">
              <span>Subtotal</span>
              <span>{fmt(order.subtotal)}</span>
            </div>
            {discount > 0 ? (
              <div className="receipt__totalsRow">
                <span>Discount</span>
                <span>-{fmt(discount)}</span>
              </div>
            ) : null}
            <div className="receipt__totalsRow">
              <span>Shipping</span>
              <span>{parseFloat(order.shipping) === 0 ? "Free" : fmt(order.shipping)}</span>
            </div>
            <div className="receipt__totalsFinal">
              <span>Total Paid</span>
              <strong>{fmt(order.total)}</strong>
            </div>
          </div>

          <footer className="receipt__foot">
            <p>
              Thank you for shopping with Antique Home. For any questions about your order, reach
              us on WhatsApp at{" "}
              <a href="https://wa.me/201125470009" target="_blank" rel="noopener noreferrer">
                +20 112 547 0009
              </a>
              .
            </p>
          </footer>
        </section>
      </main>

      <ul className="chk__trust no-print">
        <li>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M2.6 8.4h14v12.8h-14z"></path>
            <path d="M16.6 12.4h6.6l4.2 4.2v4.6h-10.8z"></path>
            <circle cx="9.2" cy="24" r="2.6"></circle>
            <circle cx="22.6" cy="24" r="2.6"></circle>
          </svg>
          <span>
            Free Delivery
            <br />
            Across Egypt
          </span>
        </li>
        <li>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <rect x="6.4" y="14" width="19.2" height="14" rx="2.4"></rect>
            <path d="M10.8 14V10a5.2 5.2 0 0 1 10.4 0v4"></path>
            <circle cx="16" cy="21" r="1.6"></circle>
          </svg>
          <span>
            Secure Payment
            <br />
            100% Protected
          </span>
        </li>
        <li>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M16 3.4 27 7.6v8.2c0 6.6-4.5 11-11 13.2C9.5 26.8 5 22.4 5 15.8V7.6Z"></path>
            <polyline points="11.4,16.2 14.8,19.6 21,12.6"></polyline>
          </svg>
          <span>
            Easy Returns
            <br />
            Within 14 Days
          </span>
        </li>
      </ul>
    </div>
  );
}
