// Ported from app/order-confirmation/[id]/page.tsx. Reads GET /api/orders?id=
// which returns { order, items } per static-site/api/orders.js.
(function () {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  function fmt(n) {
    const num = typeof n === "string" ? parseFloat(n) : n;
    return "EGP " + Math.round(num || 0).toLocaleString("en-US");
  }

  function renderNotFound() {
    document.getElementById("ocSlot").innerHTML = `
      <div style="min-height:60vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;padding:40px 20px;text-align:center">
        <h1 style="font-family:'Cormorant Garamond',serif;font-size:28px">Order not found</h1>
        <p style="opacity:.7">We couldn&rsquo;t find this order. Please check the link or contact us for help.</p>
        <a class="btn-solid" href="/shop.html"><span>Back to Shop</span></a>
      </div>`;
  }

  function render(order, items) {
    const discount = parseFloat(order.discount) || 0;
    const cityGov = [order.city, order.governorate].filter(Boolean).join(", ");
    const orderDate = new Date(order.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    const rowsHtml = items.length
      ? items
          .map(
            (item) => `
        <tr>
          <td>
            <div class="receipt__itemName">
              ${item.image_snapshot ? `<img class="receipt__itemImg" src="${cldUrl(item.image_snapshot, 120)}" alt="" />` : ""}
              <span>${item.name_snapshot}</span>
            </div>
          </td>
          <td>${item.qty}</td>
          <td>${fmt(item.price_snapshot)}</td>
          <td>${fmt(parseFloat(item.price_snapshot) * item.qty)}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="4" style="text-align:center;color:var(--ink-400);padding:20px 0">No items found for this order.</td></tr>`;

    document.getElementById("ocSlot").innerHTML = `
      <div class="chk__bg" aria-hidden="true">
        <img src="/خلفيه منتجات.png" alt="" />
      </div>

      <header class="chk__topbar">
        <a class="chk__back" href="/shop.html">
          <svg viewBox="0 0 20 14" aria-hidden="true"><line x1="19" y1="7" x2="2" y2="7"></line><polyline points="7.4,1.6 1.6,7 7.4,12.4"></polyline></svg>
          Continue Shopping
        </a>
        <a class="chk__brand" href="/" aria-label="Antique Home — Vase &amp; Decor">
          <span class="chk__brand-name">ANTIQUE HOME</span>
          <span class="chk__brand-sub">VASE &amp; DECOR</span>
        </a>
        <span class="chk__secure">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.8" y="10.4" width="14.4" height="10.4" rx="1.8"></rect><path d="M8.1 10.4V7.6a3.9 3.9 0 0 1 7.8 0v2.8"></path></svg>
          Secure Checkout
        </span>
      </header>

      <main class="oc">
        <section class="oc__success no-print">
          <span class="oc__check" aria-hidden="true">
            <svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"></circle><polyline points="14,27 22,35 39,17"></polyline></svg>
          </span>
          <p class="kicker kicker--center kicker--gold">Thank You</p>
          <h1 class="oc__title">Your Order is Confirmed</h1>
          <p class="oc__text">
            We&rsquo;ve received your order and we&rsquo;re getting it ready. A confirmation has
            been sent to your email.
          </p>

          <div class="oc__actions">
            <button type="button" class="oc-btn oc-btn--dark" data-print>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 8.4V3.6h10v4.8"></path>
                <rect x="3.6" y="8.4" width="16.8" height="9.2" rx="1.6"></rect>
                <rect x="7" y="13.2" width="10" height="7.2"></rect>
              </svg>
              <span>Print Receipt</span>
            </button>
            <a class="oc-btn oc-btn--outline" href="/shop.html">
              <span>Continue Shopping</span>
              <svg viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
            </a>
          </div>
        </section>

        <section class="receipt" id="receipt">
          <header class="receipt__head">
            <div class="receipt__brand">
              <span class="receipt__logoMark" aria-hidden="true">
                <svg viewBox="0 0 100 100">
                  <path d="M50 6 76 24 94 50 76 76 50 94 24 76 6 50 24 24Z"></path>
                  <path d="M50 13 71 28 87 50 71 72 50 87 29 72 13 50 29 28Z"></path>
                </svg>
              </span>
              <div>
                <p class="receipt__brandName">ANTIQUE HOME</p>
                <p class="receipt__brandSub">Vase &amp; Decor</p>
              </div>
            </div>
            <div class="receipt__meta">
              <p><span>Order No.</span><strong>${order.order_number}</strong></p>
              <p><span>Date</span><strong>${orderDate}</strong></p>
            </div>
          </header>

          <span class="ornament" aria-hidden="true"><i></i><b></b><i></i></span>

          <div class="receipt__cols">
            <div class="receipt__block">
              <h3>Billed To</h3>
              <p>${order.customer_name || "—"}</p>
              <p>${order.email || "—"}</p>
              <p>${order.phone || "—"}</p>
            </div>
            <div class="receipt__block">
              <h3>Shipping Address</h3>
              <p>${order.address || "—"}</p>
              <p>${cityGov || "—"}</p>
            </div>
            <div class="receipt__block">
              <h3>Order Info</h3>
              <p><span>Delivery:</span> <span>${order.delivery_method || "—"}</span></p>
              <p><span>Payment:</span> <span>${order.payment_method || "—"}</span></p>
            </div>
          </div>

          <table class="receipt__table">
            <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>

          ${order.notes ? `<div class="receipt__notes"><h3>Additional Notes</h3><p>${order.notes}</p></div>` : ""}

          <div class="receipt__totals">
            <div class="receipt__totalsRow"><span>Subtotal</span><span>${fmt(order.subtotal)}</span></div>
            ${discount > 0 ? `<div class="receipt__totalsRow"><span>Discount</span><span>-${fmt(discount)}</span></div>` : ""}
            <div class="receipt__totalsRow"><span>Shipping</span><span>${parseFloat(order.shipping) === 0 ? "Free" : fmt(order.shipping)}</span></div>
            <div class="receipt__totalsFinal"><span>Total Paid</span><strong>${fmt(order.total)}</strong></div>
          </div>

          <footer class="receipt__foot">
            <p>
              Thank you for shopping with Antique Home. For any questions about your order, reach
              us on WhatsApp at
              <a href="https://wa.me/201125470009" target="_blank" rel="noopener noreferrer">+20 112 547 0009</a>.
            </p>
          </footer>
        </section>
      </main>

      <ul class="chk__trust no-print">
        <li>
          <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M2.6 8.4h14v12.8h-14z"></path><path d="M16.6 12.4h6.6l4.2 4.2v4.6h-10.8z"></path><circle cx="9.2" cy="24" r="2.6"></circle><circle cx="22.6" cy="24" r="2.6"></circle></svg>
          <span>Free Delivery<br />Across Egypt</span>
        </li>
        <li>
          <svg viewBox="0 0 32 32" aria-hidden="true"><rect x="6.4" y="14" width="19.2" height="14" rx="2.4"></rect><path d="M10.8 14V10a5.2 5.2 0 0 1 10.4 0v4"></path><circle cx="16" cy="21" r="1.6"></circle></svg>
          <span>Secure Payment<br />100% Protected</span>
        </li>
        <li>
          <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3.4 27 7.6v8.2c0 6.6-4.5 11-11 13.2C9.5 26.8 5 22.4 5 15.8V7.6Z"></path><polyline points="11.4,16.2 14.8,19.6 21,12.6"></polyline></svg>
          <span>Easy Returns<br />Within 14 Days</span>
        </li>
      </ul>
    `;

    document.querySelectorAll("[data-print]").forEach((btn) => btn.addEventListener("click", () => window.print()));
  }

  async function init() {
    if (!id) {
      renderNotFound();
      return;
    }
    try {
      const data = await API.get("/api/orders?id=" + encodeURIComponent(id));
      render(data.order, data.items);
    } catch {
      renderNotFound();
    }
  }

  init();
})();
