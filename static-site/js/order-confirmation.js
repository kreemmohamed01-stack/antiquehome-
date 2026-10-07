// Ported from app/order-confirmation/[id]/page.tsx. Reads GET /api/orders?id=
// which returns { order, items } per static-site/api/orders.js.
(function () {
  function t(key, fallbackEn) {
    return window.AH_I18N ? window.AH_I18N.t(key, fallbackEn) : fallbackEn;
  }

  // render() runs once up front and again on every ah:langchange (see
  // bottom of file) — only let the entrance animation play the first
  // time, same reasoning as checkout.js/product.js; on later re-renders
  // rvClass()/rvAttr() return nothing so the elements just appear.
  let firstRenderDone = false;
  function rvClass(direction) {
    return firstRenderDone ? "" : ` rv rv--${direction || "left"}`;
  }
  function rvAttr(delay) {
    if (firstRenderDone) return "";
    return delay ? ` data-rv style="--rd:${delay}s"` : ` data-rv`;
  }

  // order-confirmation.html doesn't load site-chrome.js, so AH_REVEAL
  // doesn't exist here — a small self-contained observer standing in
  // for it, same behavior as site-chrome.js's.
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let revealIo = null;
  function scanReveal(root) {
    const targets = Array.prototype.slice.call((root || document).querySelectorAll("[data-rv]:not([data-rv-seen])"));
    if (!targets.length) return;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach((el) => { el.classList.add("in"); el.setAttribute("data-rv-seen", ""); });
      return;
    }
    if (!revealIo) {
      revealIo = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("in");
            revealIo.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
      );
    }
    targets.forEach((el) => { el.setAttribute("data-rv-seen", ""); revealIo.observe(el); });
  }

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  function fmt(n) {
    const num = typeof n === "string" ? parseFloat(n) : n;
    return "EGP " + Math.round(num || 0).toLocaleString("en-US");
  }

  function renderNotFound() {
    document.getElementById("ocSlot").innerHTML = `
      <div style="min-height:60vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;padding:40px 20px;text-align:center">
        <h1 style="font-family:'Cormorant Garamond',serif;font-size:28px">${t("orderNotFound", "Order not found")}</h1>
        <p style="opacity:.7">${t("orderNotFoundText", "We couldn&rsquo;t find this order. Please check the link or contact us for help.")}</p>
        <a class="btn-solid" href="/shop.html"><span>${t("backToShop", "Back to Shop")}</span></a>
      </div>`;
  }

  // Builds a WhatsApp deep link pre-filled with the full order summary,
  // addressed to the shop's own number — one tap opens WhatsApp with the
  // message ready to send, no typing required. This is the free,
  // no-account alternative to an automatic WhatsApp Business API
  // integration (which needs a paid Twilio/Meta Cloud API account the
  // store doesn't have): the send step still needs a human tap, but nothing
  // needs typing out by hand.
  function buildWhatsAppMessage(order, items) {
    const cityGov = [order.city, order.governorate].filter(Boolean).join(", ");
    const lines = [
      `*New Order — ${order.order_number}*`,
      "",
      `Customer: ${order.customer_name || "—"}`,
      `Phone: ${order.phone || "—"}`,
      `Email: ${order.email || "—"}`,
      `Address: ${order.address || "—"}${cityGov ? ", " + cityGov : ""}`,
      "",
      "Items:",
      ...items.map((it) => `• ${it.name_snapshot} x${it.qty} — ${fmt(parseFloat(it.price_snapshot) * it.qty)}`),
      "",
      `Delivery: ${order.delivery_method || "—"}`,
      `Payment: ${order.payment_method || "—"}`,
      order.payment_reference ? `Transfer ref: ${order.payment_reference}` : null,
      order.payment_sender_name ? `Sender name: ${order.payment_sender_name}` : null,
      order.notes ? `Notes: ${order.notes}` : null,
      "",
      `Total: ${fmt(order.total)}`,
    ].filter((l) => l !== null);
    return `https://wa.me/201105288355?text=${encodeURIComponent(lines.join("\n"))}`;
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
      : `<tr><td colspan="4" style="text-align:center;color:var(--ink-400);padding:20px 0">${t("noItemsFound", "No items found for this order.")}</td></tr>`;

    document.getElementById("ocSlot").innerHTML = `
      <div class="chk__bg" aria-hidden="true">
        <img src="/خلفيه منتجات.webp" alt="" />
      </div>

      <header class="chk__topbar">
        <a class="chk__back" href="/shop.html">
          <svg viewBox="0 0 20 14" aria-hidden="true"><line x1="19" y1="7" x2="2" y2="7"></line><polyline points="7.4,1.6 1.6,7 7.4,12.4"></polyline></svg>
          ${t("continueShoppingArrow", "Continue Shopping")}
        </a>
        <a class="chk__brand" href="/" aria-label="Antique Home — Vase &amp; Decor">
          <span class="chk__brand-name">ANTIQUE HOME</span>
          <span class="chk__brand-sub">VASE &amp; DECOR</span>
        </a>
        <button class="icon-btn lang-btn no-print" type="button" id="langBtn" aria-label="Switch language" style="position:static">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.4"></circle><path d="M2.6 12h18.8"></path><path d="M12 2.6c2.6 2.6 4 5.9 4 9.4s-1.4 6.8-4 9.4c-2.6-2.6-4-5.9-4-9.4s1.4-6.8 4-9.4Z"></path></svg>
          <span class="lang-btn__label" id="langBtnLabel">العربية</span>
        </button>
        <span class="chk__secure">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.8" y="10.4" width="14.4" height="10.4" rx="1.8"></rect><path d="M8.1 10.4V7.6a3.9 3.9 0 0 1 7.8 0v2.8"></path></svg>
          ${t("secureCheckout", "Secure Checkout")}
        </span>
      </header>

      <main class="oc">
        <section class="oc__success no-print">
          <span class="oc__check${rvClass("zoom")}"${rvAttr()} aria-hidden="true">
            <svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"></circle><polyline points="14,27 22,35 39,17"></polyline></svg>
          </span>
          <p class="kicker kicker--center kicker--gold${rvClass()}"${rvAttr(0.1)}>${t("thankYou", "Thank You")}</p>
          <h1 class="oc__title${rvClass()}"${rvAttr(0.16)}>${t("orderConfirmed", "Your Order is Confirmed")}</h1>
          <p class="oc__text${rvClass()}"${rvAttr(0.22)}>${t("orderConfirmedText", "We&rsquo;ve received your order and we&rsquo;re getting it ready. We&rsquo;ll be in touch shortly to confirm it.")}</p>

          <div class="oc__actions${rvClass()}"${rvAttr(0.28)}>
            <a class="oc-btn oc-btn--whatsapp" href="${buildWhatsAppMessage(order, items)}" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413"/></svg>
              <span>${t("sendOrderWhatsapp", "Send Order to WhatsApp")}</span>
            </a>
            <button type="button" class="oc-btn oc-btn--dark" data-print>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 8.4V3.6h10v4.8"></path>
                <rect x="3.6" y="8.4" width="16.8" height="9.2" rx="1.6"></rect>
                <rect x="7" y="13.2" width="10" height="7.2"></rect>
              </svg>
              <span>${t("printReceipt", "Print Receipt")}</span>
            </button>
            <a class="oc-btn oc-btn--outline" href="/shop.html">
              <span>${t("continueShoppingArrow", "Continue Shopping")}</span>
              <svg viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
            </a>
          </div>
        </section>

        <section class="receipt${rvClass("up")}" id="receipt"${rvAttr(0.1)}>
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
                <p class="receipt__brandSub">${t("vaseDecor", "Vase &amp; Decor")}</p>
              </div>
            </div>
            <div class="receipt__meta">
              <p><span>${t("orderNo", "Order No.")}</span><strong>${order.order_number}</strong></p>
              <p><span>${t("dateLabel", "Date")}</span><strong>${orderDate}</strong></p>
            </div>
          </header>

          <span class="ornament" aria-hidden="true"><i></i><b></b><i></i></span>

          <div class="receipt__cols">
            <div class="receipt__block">
              <h3>${t("billedTo", "Billed To")}</h3>
              <p>${order.customer_name || "—"}</p>
              <p>${order.email || "—"}</p>
              <p>${order.phone || "—"}</p>
            </div>
            <div class="receipt__block">
              <h3>${t("shippingAddress", "Shipping Address")}</h3>
              <p>${order.address || "—"}</p>
              <p>${cityGov || "—"}</p>
            </div>
            <div class="receipt__block">
              <h3>${t("orderInfo", "Order Info")}</h3>
              <p><span>${t("deliveryColon", "Delivery:")}</span> <span>${order.delivery_method || "—"}</span></p>
              <p><span>${t("paymentColon", "Payment:")}</span> <span>${order.payment_method || "—"}</span></p>
              ${order.payment_reference ? `<p><span>${t("transferRefColon", "Transfer Ref:")}</span> <span>${order.payment_reference}</span></p>` : ""}
            </div>
          </div>

          <table class="receipt__table">
            <thead><tr><th>${t("itemCol", "Item")}</th><th>${t("qtyCol", "Qty")}</th><th>${t("priceCol", "Price")}</th><th>${t("totalCol", "Total")}</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>

          ${order.notes ? `<div class="receipt__notes"><h3>${t("additionalNotesLabel", "Additional Notes")}</h3><p>${order.notes}</p></div>` : ""}

          <div class="receipt__totals">
            <div class="receipt__totalsRow"><span>${t("subtotalLabel", "Subtotal")}</span><span>${fmt(order.subtotal)}</span></div>
            ${discount > 0 ? `<div class="receipt__totalsRow"><span>${t("discountLabel", "Discount")}</span><span>-${fmt(discount)}</span></div>` : ""}
            <div class="receipt__totalsRow"><span>${t("shippingLabel", "Shipping")}</span><span>${parseFloat(order.shipping) === 0 ? t("freeLabel", "Free") : fmt(order.shipping)}</span></div>
            <div class="receipt__totalsFinal"><span>${t("totalPaid", "Total Paid")}</span><strong>${fmt(order.total)}</strong></div>
          </div>

          <footer class="receipt__foot">
            <p>
              ${t("receiptFooter", "Thank you for shopping with Antique Home. For any questions about your order, reach us on WhatsApp at")}
              <a href="https://wa.me/201105288355" target="_blank" rel="noopener noreferrer">+20 110 528 8355</a>.
            </p>
          </footer>
        </section>
      </main>

      <ul class="chk__trust no-print">
        <li>
          <svg viewBox="0 0 32 32" aria-hidden="true"><rect x="6.4" y="14" width="19.2" height="14" rx="2.4"></rect><path d="M10.8 14V10a5.2 5.2 0 0 1 10.4 0v4"></path><circle cx="16" cy="21" r="1.6"></circle></svg>
          <span>${t("trustSecurePayment", "Secure Payment<br />100% Protected")}</span>
        </li>
        <li>
          <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3.4 27 7.6v8.2c0 6.6-4.5 11-11 13.2C9.5 26.8 5 22.4 5 15.8V7.6Z"></path><polyline points="11.4,16.2 14.8,19.6 21,12.6"></polyline></svg>
          <span>${t("trustEasyReturns", "Easy Returns<br />Within 14 Days")}</span>
        </li>
      </ul>
    `;

    document.querySelectorAll("[data-print]").forEach((btn) => btn.addEventListener("click", () => window.print()));
    if (window.AH_I18N) window.AH_I18N.wireLangButtons();
    // render() also re-runs on a language switch (see ah:langchange
    // below) — only let the entrance animation play once, same reasoning
    // as checkout.js/product.js.
    if (!firstRenderDone) scanReveal(document.getElementById("ocSlot"));
    firstRenderDone = true;
  }

  let lastOrder = null;
  let lastItems = null;

  async function init() {
    if (!id) {
      renderNotFound();
      return;
    }
    try {
      const data = await API.get("/api/orders?id=" + encodeURIComponent(id));
      lastOrder = data.order;
      lastItems = data.items;
      render(data.order, data.items);
    } catch {
      renderNotFound();
    }
  }

  document.addEventListener("ah:langchange", () => {
    if (lastOrder) render(lastOrder, lastItems);
  });

  init();
})();
