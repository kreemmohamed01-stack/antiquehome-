// Ported from app/checkout/page.tsx + app/components/CheckoutView.tsx.
// NOTE: the original React component posted to "/api/coupons/validate", but
// the actual serverless API is POST /api/coupons { code } (no /validate
// suffix, no ?admin=). Fixed here to match static-site/api/coupons.js exactly.
(function () {
  function t(key, fallbackEn) {
    return window.AH_I18N ? window.AH_I18N.t(key, fallbackEn) : fallbackEn;
  }
  // Scroll-reveal only plays on the page's first render — render() runs
  // again on nearly every field edit/radio click (checkout is fully
  // state-driven), and replaying each card's fade-in on every keystroke
  // would look like a glitch rather than an entrance, so the rv classes
  // are only added once.
  let firstRenderDone = false;
  function rvClass() {
    return firstRenderDone ? "" : " rv rv--left";
  }
  function rvAttr(delay) {
    if (firstRenderDone) return "";
    return delay ? ` data-rv style="--rd:${delay}s"` : ` data-rv`;
  }

  // checkout.html doesn't load site-chrome.js (it has no header/footer
  // chrome), so AH_REVEAL doesn't exist here — a small self-contained
  // observer standing in for it, same behavior as site-chrome.js's.
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
  const FALLBACK_STANDARD = 100;
  const FALLBACK_EXPRESS = 150;

  // Same showroom address/link as the footer's "Visit Us" block
  // (js/chrome-partials.js) — shown here when Store Pickup is selected.
  const STORE_ADDRESS = "El Nozha, Taha Hussein St. — 2 Mahmoud Haridy";
  const STORE_MAPS_URL = "https://maps.google.com/maps?q=2+Mahmoud+Haridy,+El+Nozha,+Cairo+Governorate&ftid=0x145817d7eee8f175:0x984cb1d837b32a46";

  // Instapay's own diagonal-arrow wordmark (purple "Insta" / orange "Pay"),
  // matching the real logo rather than a plain text label — used both in
  // the payment-method row and the details panel below it.
  const INSTAPAY_LOGO_SVG = `
    <svg viewBox="0 0 120 34" class="instapay-logo" aria-hidden="true">
      <g fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 24 L14 10" stroke="#6B21D8" stroke-width="4"/>
        <path d="M9 24 L21 10" stroke="#A21CAF" stroke-width="4"/>
        <path d="M16 24 L28 10" stroke="#EA580C" stroke-width="4"/>
      </g>
      <text x="34" y="15" font-family="Jost, Arial, sans-serif" font-weight="700" font-size="14" letter-spacing="0.2" fill="#3B0764">INSTA</text>
      <text x="34" y="30" font-family="Jost, Arial, sans-serif" font-weight="700" font-size="14" letter-spacing="0.2" fill="#EA580C">PAY</text>
    </svg>`;

  const state = {
    lines: [],
    delivery: "standard",
    payment: "instapay",
    agree: false,
    placing: false,
    error: "",
    email: "",
    fullName: "",
    phone: "",
    governorate: "",
    city: "",
    address: "",
    notes: "",
    paymentReference: "",
    paymentSenderName: "",
    rates: [],
    couponInput: "",
    coupon: null,
    couponError: "",
    couponLoading: false,
  };

  function fmt(n) {
    return "EGP " + Math.round(n).toLocaleString("en-US");
  }

  function computeTotals() {
    const subtotal = state.lines.reduce((s, l) => s + l.qty * l.price, 0);
    const rate = state.rates.find((r) => r.governorate === state.governorate);
    const baseShipping =
      state.delivery === "pickup"
        ? 0
        : state.delivery === "express"
        ? rate
          ? Number(rate.express_price)
          : FALLBACK_EXPRESS
        : rate
        ? Number(rate.standard_price)
        : FALLBACK_STANDARD;
    // Weight surcharge: total kg across the cart × the governorate's per-kg
    // rate, added on top of the base shipping price (skipped for pickup).
    const totalWeight = state.lines.reduce((s, l) => s + l.qty * (Number(l.weightKg) || 0), 0);
    const weightSurcharge = state.delivery === "pickup" ? 0 : totalWeight * (rate ? Number(rate.per_kg_rate) || 0 : 0);
    const shipping = baseShipping + weightSurcharge;
    const discount = state.coupon ? Math.round(subtotal * (state.coupon.percent / 100) * 100) / 100 : 0;
    const total = Math.max(0, subtotal - discount) + shipping;
    return { subtotal, shipping, discount, total, rate, totalWeight, weightSurcharge };
  }

  function govOptions() {
    if (state.rates.length > 0) return state.rates.map((r) => r.governorate);
    return ["Cairo", "Giza", "Alexandria", "Qalyubia", "Other"];
  }

  const GOV_AR = {
    Cairo: "القاهرة",
    Giza: "الجيزة",
    Alexandria: "الإسكندرية",
    Qalyubia: "القليوبية",
    Other: "أخرى",
  };
  function govLabel(g) {
    if (window.AH_I18N && window.AH_I18N.getLang() === "ar") return GOV_AR[g] || g;
    return g;
  }

  function render() {
    const { subtotal, shipping, discount, total, rate, totalWeight, weightSurcharge } = computeTotals();

    const itemsHtml = state.lines.length
      ? `<ul class="chk__items">
          ${state.lines
            .map(
              (l) => `
            <li class="chk__item" data-id="${l.id}">
              <figure class="chk__itemMedia"><img src="${l.image}" alt="${l.name}" loading="lazy" /></figure>
              <div class="chk__itemBody">
                <div class="chk__itemTop">
                  <div><h3>${l.name}</h3>${l.variant ? `<p style="margin:2px 0 0;font-size:11px;color:var(--ink-400)">${l.variant}</p>` : ""}</div>
                  <button type="button" class="chk__itemRemove" aria-label="${t("removeItem", "Remove {name}").replace("{name}", l.name)}" data-remove="${l.id}">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="5.4" y1="5.4" x2="18.6" y2="18.6"></line><line x1="18.6" y1="5.4" x2="5.4" y2="18.6"></line></svg>
                  </button>
                </div>
                <div class="chk__itemBottom">
                  <div class="qty chk__itemQty">
                    <button type="button" class="qty__btn" aria-label="Decrease quantity" data-step="-1" data-id="${l.id}"><svg viewBox="0 0 16 16" aria-hidden="true"><line x1="3" y1="8" x2="13" y2="8"></line></svg></button>
                    <span class="qty__num">${l.qty}</span>
                    <button type="button" class="qty__btn" aria-label="Increase quantity" data-step="1" data-id="${l.id}"><svg viewBox="0 0 16 16" aria-hidden="true"><line x1="8" y1="3" x2="8" y2="13"></line><line x1="3" y1="8" x2="13" y2="8"></line></svg></button>
                  </div>
                  <span class="chk__itemPrice">EGP <b>${(l.price * l.qty).toLocaleString("en-US")}</b></span>
                </div>
              </div>
            </li>`
            )
            .join("")}
        </ul>`
      : `<p style="opacity:.7;padding:12px 0">${t("emptyCartCheckout", "Your cart is empty. Add products from the shop before checking out.")}</p>`;

    const couponHtml = state.coupon
      ? `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:9px;background:rgba(111,163,107,.1);border:1px solid rgba(111,163,107,.35)">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style="flex:none;color:#4C6B3F">
            <circle cx="12" cy="12" r="9.4" fill="none" stroke="currentColor" stroke-width="1.8" />
            <polyline points="7.5,12.5 10.5,15.5 16.5,9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span style="flex:1;font-size:12.5px;color:#4C6B3F;font-weight:600">${t("couponApplied", "Coupon &ldquo;{code}&rdquo; applied — {percent}% off").replace("{code}", state.coupon.code).replace("{percent}", state.coupon.percent)}</span>
          <button type="button" id="couponRemove" style="background:none;border:none;color:#4C6B3F;cursor:pointer;font-size:11px;text-decoration:underline">${t("removeCoupon", "Remove")}</button>
        </div>`
      : `<div>
          <div style="display:flex;gap:8px">
            <input type="text" id="couponInputEl" placeholder="${t("discountCodePlaceholder", "Discount code")}" value="${state.couponInput}" style="flex:1;padding:10px 12px;border-radius:8px;border:1px solid rgba(43,36,28,.16);font-size:12.5px" />
            <button type="button" id="couponApply" ${state.couponLoading ? "disabled" : ""} class="chk__submit" style="padding:0 20px;font-size:11px"><span>${state.couponLoading ? "…" : t("applyBtn", "Apply")}</span></button>
          </div>
          ${state.couponError ? `<p style="color:#a33;font-size:11.5px;margin-top:6px">${state.couponError}</p>` : ""}
        </div>`;

    document.getElementById("checkoutSlot").innerHTML = `
      <div class="chk__bg" aria-hidden="true">
        <img src="/خلفيه منتجات.webp" alt="" loading="eager" />
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
        <button class="icon-btn lang-btn" type="button" id="langBtn" aria-label="Switch language" style="position:static">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.4"></circle><path d="M2.6 12h18.8"></path><path d="M12 2.6c2.6 2.6 4 5.9 4 9.4s-1.4 6.8-4 9.4c-2.6-2.6-4-5.9-4-9.4s1.4-6.8 4-9.4Z"></path></svg>
          <span class="lang-btn__label" id="langBtnLabel">العربية</span>
        </button>
        <span class="chk__secure">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.8" y="10.4" width="14.4" height="10.4" rx="1.8"></rect><path d="M8.1 10.4V7.6a3.9 3.9 0 0 1 7.8 0v2.8"></path></svg>
          ${t("secureCheckout", "Secure Checkout")}
        </span>
      </header>

      <div class="chk__wrap">
        <div class="chk__col chk__col--left">
          <section class="chk__card${rvClass()}"${rvAttr()}>
            <h2 class="chk__heading">${t("contactInfoHeading", "1. Contact Information")}</h2>
            <p class="chk__sub">${t("contactInfoSub", "We&rsquo;ll use this information to keep you updated about your order.")}</p>
            <label class="chk__field">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5.4" width="18" height="13.2" rx="2"></rect><polyline points="3.6,6.4 12,13 20.4,6.4"></polyline></svg>
              <input type="email" id="fEmail" placeholder="${t("emailPlaceholder2", "Email Address")}" autocomplete="email" required value="${state.email}" />
            </label>
          </section>

          <section class="chk__card${rvClass()}"${rvAttr(0.08)}>
            <h2 class="chk__heading">${t("shippingDetailsHeading", "2. Shipping Details")}</h2>
            <p class="chk__sub">${t("shippingDetailsSub", "Enter your delivery information.")}</p>
            <div class="chk__row2">
              <label class="chk__field">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.6"></circle><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"></path></svg>
                <input type="text" id="fName" placeholder="${t("fullNamePlaceholder", "Full Name")}" autocomplete="name" required value="${state.fullName}" />
              </label>
              <label class="chk__field">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 4.4h3l1.4 4-2 1.6a12.4 12.4 0 0 0 5 5l1.6-2 4 1.4v3a2 2 0 0 1-2.2 2C10.7 19.1 4.9 13.3 4.6 6.6a2 2 0 0 1 2-2.2Z"></path></svg>
                <input type="tel" id="fPhone" placeholder="${t("phonePlaceholder", "Phone Number")}" autocomplete="tel" inputmode="tel" required value="${state.phone}" />
              </label>
            </div>
            <label class="chk__field chk__field--select">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.4S5 15 5 9.8a7 7 0 0 1 14 0c0 5.2-7 11.6-7 11.6Z"></path><circle cx="12" cy="9.6" r="2.6"></circle></svg>
              <select id="fGov" required>
                <option value="" disabled ${state.governorate ? "" : "selected"}>${t("governoratePlaceholder", "Governorate")}</option>
                ${govOptions()
                  .map((g) => `<option value="${g}" ${state.governorate === g ? "selected" : ""}>${govLabel(g)}</option>`)
                  .join("")}
              </select>
              <svg class="chk__chev" viewBox="0 0 12 8" aria-hidden="true"><polyline points="1,1.5 6,6.5 11,1.5"></polyline></svg>
            </label>
            <label class="chk__field">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="7.4" width="16" height="12.6" rx="1.4"></rect><path d="M8.4 7.4V5.4a1.4 1.4 0 0 1 1.4-1.4h4.4a1.4 1.4 0 0 1 1.4 1.4v2"></path></svg>
              <input type="text" id="fCity" placeholder="${t("cityPlaceholder", "City / Area")}" autocomplete="address-level2" required value="${state.city}" />
            </label>
            <label class="chk__field">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.4 12 4.6l8 6.8"></path><path d="M6 10v9.4h12V10"></path><path d="M10 19.4v-6h4v6"></path></svg>
              <input type="text" id="fAddress" placeholder="${t("addressPlaceholder", "Detailed Address (Street, Building, Landmark)")}" autocomplete="street-address" required value="${state.address}" />
            </label>
          </section>

          <section class="chk__card${rvClass()}"${rvAttr(0.16)}>
            <h2 class="chk__heading">${t("deliveryOptionsHeading", "3. Delivery Options")}</h2>
            <p class="chk__sub">${t("deliveryOptionsSub", "Choose how you want to receive your order.")}</p>
            <div class="chk__delivery">
              <label class="chk__radioCard${state.delivery === "standard" ? " is-active" : ""}">
                <input type="radio" name="delivery" value="standard" ${state.delivery === "standard" ? "checked" : ""} />
                <span class="chk__radioDot" aria-hidden="true"></span>
                <span class="chk__radioIco" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M2.6 8.4h14v12.8h-14z"></path><path d="M16.6 12.4h6.6l4.2 4.2v4.6h-10.8z"></path><circle cx="9.2" cy="24" r="2.6"></circle><circle cx="22.6" cy="24" r="2.6"></circle></svg></span>
                <strong>${t("standardDeliveryTitle", "Standard Delivery")}</strong>
                <span class="chk__radioMeta">${t("standardDeliveryMeta", "2 &ndash; 4 Business Days")}</span>
                <span class="chk__radioPrice">${state.governorate ? fmt(rate ? Number(rate.standard_price) : FALLBACK_STANDARD) : t("fromEgp", "From EGP 80")}</span>
              </label>
              <label class="chk__radioCard${state.delivery === "express" ? " is-active" : ""}">
                <input type="radio" name="delivery" value="express" ${state.delivery === "express" ? "checked" : ""} />
                <span class="chk__radioDot" aria-hidden="true"></span>
                <span class="chk__radioIco" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M4 16h20l-4-8h6l4 8v8H4Z"></path><circle cx="10" cy="26" r="2.4"></circle><circle cx="22" cy="26" r="2.4"></circle></svg></span>
                <strong>${t("expressDeliveryTitle", "Express Delivery")}</strong>
                <span class="chk__radioMeta">${t("expressDeliveryMeta", "1 &ndash; 2 Business Days")}</span>
                <span class="chk__radioPrice">${state.governorate ? fmt(rate ? Number(rate.express_price) : FALLBACK_EXPRESS) : t("fromEgpExpress", "From EGP 130")}</span>
              </label>
              <label class="chk__radioCard${state.delivery === "pickup" ? " is-active" : ""}">
                <input type="radio" name="delivery" value="pickup" ${state.delivery === "pickup" ? "checked" : ""} />
                <span class="chk__radioDot" aria-hidden="true"></span>
                <span class="chk__radioIco" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M4 12.4 6.4 5h19.2l2.4 7.4"></path><path d="M4 12.4h24v13.2H4z"></path><path d="M12.4 25.6v-6.2h7.2v6.2"></path></svg></span>
                <strong>${t("storePickupTitle", "Store Pickup")}</strong>
                <span class="chk__radioMeta">${t("storePickupMeta", "Pick up from our store")}</span>
                <span class="chk__radioPrice">${t("freeLabel", "Free")}</span>
              </label>
            </div>

            ${
              state.delivery === "pickup"
                ? `<div class="chk__payPanel">
                    <div class="chk__payNote">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.4c-5.6 0-10 4.4-10 10 0 7.4 10 15.2 10 15.2s10-7.8 10-15.2c0-5.6-4.4-10-10-10Z"></path><circle cx="12" cy="13.4" r="3.6"></circle></svg>
                      <div>
                        <strong>${t("pickupShowroom", "Pick up from our showroom")}</strong>
                        <p>${STORE_ADDRESS}</p>
                        <a href="${STORE_MAPS_URL}" target="_blank" rel="noopener noreferrer" class="chk__pickupMapLink">
                          <span>${t("getDirections", "Get Directions")}</span>
                          <svg viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
                        </a>
                      </div>
                    </div>
                  </div>`
                : ""
            }
          </section>

          <section class="chk__card${rvClass()}"${rvAttr(0.24)}>
            <h2 class="chk__heading">${t("orderSummaryHeading", "4. Order Summary")}</h2>
            <p class="chk__sub">${t("orderSummarySub", "Review your items before placing the order.")}</p>
            ${itemsHtml}

            <div style="margin-top:18px">${couponHtml}</div>

            <div class="chk__totals">
              <div class="chk__totalsRow"><span>${t("subtotalLabel", "Subtotal")}</span><span>${fmt(subtotal)}</span></div>
              ${discount > 0 ? `<div class="chk__totalsRow" style="color:#4C6B3F"><span>${t("discountLabel", "Discount")} (${state.coupon.code})</span><span>-${fmt(discount)}</span></div>` : ""}
              <div class="chk__totalsRow"><span>${t("shippingLabel", "Shipping")}${weightSurcharge > 0 ? ` <small style="opacity:.65">(${fmt(weightSurcharge)} / ${totalWeight.toFixed(1)}kg)</small>` : ""}</span><span>${shipping === 0 ? t("freeLabel", "Free") : fmt(shipping)}</span></div>
              <div class="chk__totalsFinal"><span>${t("totalLabel", "Total")}</span><strong>${fmt(total)}</strong></div>
            </div>
          </section>
        </div>

        <div class="chk__col chk__col--right">
          <figure class="chk__promoPanel">
            <img src="/sec 2/pic 11.webp" alt="" loading="lazy" />
            <figcaption>
              <h3>${t("promoPanelTitle", "Pieces That<br />Tell a Story")}</h3>
              <span class="chk__promoBrand">ANTIQUE HOME</span>
            </figcaption>
          </figure>

          <section class="chk__card${rvClass()}"${rvAttr(0.08)}>
            <h2 class="chk__heading">${t("paymentMethodHeading", "5. Payment Method")}</h2>
            <p class="chk__sub">${t("paymentMethodSub", "Choose your preferred payment method.")}</p>
            <div class="chk__payList">
              <label class="chk__payRow${state.payment === "cod" ? " is-active" : ""}">
                <input type="radio" name="payment" value="cod" ${state.payment === "cod" ? "checked" : ""} />
                <span class="chk__payRow-ico chk__payRow-ico--cod" aria-hidden="true"><svg viewBox="0 0 32 32"><rect x="3" y="9" width="26" height="17" rx="2.4"></rect><circle cx="16" cy="17.5" r="4.2"></circle><path d="M20 25 25 29"></path></svg></span>
                <span class="chk__payRow-body">
                  <strong>${t("codTitle", "Cash on Delivery")}</strong>
                  <small>${t("codMeta", "Pay when you receive your order")}</small>
                </span>
                <span class="chk__payRow-tag">COD</span>
                <span class="chk__payRow-dot" aria-hidden="true"></span>
              </label>
              <label class="chk__payRow${state.payment === "instapay" ? " is-active" : ""}">
                <input type="radio" name="payment" value="instapay" ${state.payment === "instapay" ? "checked" : ""} />
                <span class="chk__payRow-ico chk__payRow-ico--instapay" aria-hidden="true">${INSTAPAY_LOGO_SVG}</span>
                <span class="chk__payRow-body">
                  <strong>${t("instapayTitle", "Instapay")}</strong>
                  <small>${t("instapayMeta", "Transfer the amount using Instapay")}</small>
                </span>
                <span class="chk__payRow-dot" aria-hidden="true"></span>
              </label>
            </div>
          </section>

          ${
            state.payment === "instapay"
              ? `<section class="chk__card">
                  <h2 class="chk__heading">${t("instapayDetailsHeading", "Instapay Payment Details")}</h2>
                  <p class="chk__sub">${t("instapayDetailsSub", "Send the exact amount to the following account")}</p>

                  <div class="chk__instapayBox">
                    <div class="chk__instapayLogo" aria-hidden="true">${INSTAPAY_LOGO_SVG}</div>
                    <div class="chk__instapayInfo">
                      <div class="chk__instapayInfo-row">
                        <span>${t("instapayNumberLabel", "Instapay number :")}</span>
                        <div class="chk__instapayInfo-val">
                          <strong>01125470009</strong>
                          <button type="button" class="chk__copyBtn" data-copy="01125470009" aria-label="${t("copyInstapayNumber", "Copy InstaPay number")}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="1.5"></rect><path d="M5 16H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"></path></svg></button>
                        </div>
                      </div>
                      <div class="chk__instapayInfo-row">
                        <span>${t("instapayNameLabel", "Name :")}</span>
                        <div class="chk__instapayInfo-val">
                          <strong>karim said salah</strong>
                          <button type="button" class="chk__copyBtn" data-copy="karim said salah" aria-label="${t("copyAccountName", "Copy account name")}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="1.5"></rect><path d="M5 16H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"></path></svg></button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="chk__payNote">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.4"></circle><line x1="12" y1="8" x2="12" y2="13"></line><circle cx="12" cy="16.2" r="0.4"></circle></svg>
                    <div>
                      <strong>${t("instapayNoteTitle", "Please transfer the amount on this account")}</strong>
                      <p>${t("instapayNoteText", "Make sure to send the exact amount for your order.")}</p>
                    </div>
                  </div>

                  <label class="chk__fieldLabeled">
                    <span class="chk__fieldLabel">${t("instapayRefLabel", "Enter the phone number you sent from")}</span>
                    <span class="chk__fieldInput">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.2 4.4H6a2.2 2.2 0 0 0-2.2 2.2c0 7.4 5.8 13.2 13.2 13.2a2.2 2.2 0 0 0 2.2-2.2v-2l-4-1.5-1.8 1.8a12.4 12.4 0 0 1-5.1-5.1L10 8.8Z"></path></svg>
                      <input type="tel" id="fPaymentRef" placeholder="01XXXXXXXX" value="${state.paymentReference || ""}" />
                    </span>
                    <small class="chk__fieldHint">${t("instapayRefHint", "Write the InstaPay number you used to send the payment from.")}</small>
                  </label>

                  <label class="chk__fieldLabeled">
                    <span class="chk__fieldLabel">${t("instapaySenderLabel", "Sender's name")}</span>
                    <span class="chk__fieldInput">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.6"></circle><path d="M4.4 20a7.6 7.6 0 0 1 15.2 0"></path></svg>
                      <input type="text" id="fPaymentSender" placeholder="${t("fullNamePlaceholder", "Full name")}" value="${state.paymentSenderName || ""}" />
                    </span>
                    <small class="chk__fieldHint">${t("instapaySenderHint", "Enter the name of the account you sent from.")}</small>
                  </label>
                </section>`
              : ""
          }

          <section class="chk__card${rvClass()}"${rvAttr(0.16)}>
            <h2 class="chk__heading">${t("additionalNotesHeading", "6. Additional Notes")} <small>${t("optionalLabel", "(Optional)")}</small></h2>
            <label class="chk__field chk__field--textarea">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.4h8.4l4 4v13.2H6Z"></path></svg>
              <textarea rows="3" id="fNotes" placeholder="${t("notesPlaceholder", "Any special requests or notes for your order&hellip;")}">${state.notes}</textarea>
            </label>

            <label class="chk__agree">
              <input type="checkbox" id="fAgree" ${state.agree ? "checked" : ""} required />
              <span class="chk__agreeBox" aria-hidden="true"><svg viewBox="0 0 16 12"><polyline points="1.5,6 6,10.5 14.5,1.5"></polyline></svg></span>
              <span>${t("agreeTerms", 'I agree to the <a href="#">Terms &amp; Conditions</a> and <a href="#">Privacy Policy</a>.')}</span>
            </label>

            ${state.error ? `<p style="color:#a33;margin-top:8px">${state.error}</p>` : ""}

            <button type="button" class="chk__submit" id="placeOrderBtn" ${state.placing ? "disabled" : ""}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.8" y="10.4" width="14.4" height="10.4" rx="1.8"></rect><path d="M8.1 10.4V7.6a3.9 3.9 0 0 1 7.8 0v2.8"></path></svg>
              <span>${state.placing ? t("placingOrder", "Placing your order…") : t("placeOrderPrice", "Place Order — ") + fmt(total)}</span>
              <svg class="chk__submitArrow" viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
            </button>
          </section>
        </div>
      </div>

      <ul class="chk__trust">
        <li><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M2.6 8.4h14v12.8h-14z"></path><path d="M16.6 12.4h6.6l4.2 4.2v4.6h-10.8z"></path><circle cx="9.2" cy="24" r="2.6"></circle><circle cx="22.6" cy="24" r="2.6"></circle></svg><span>${t("trustFreeDelivery", "Free Delivery<br />Across Egypt")}</span></li>
        <li><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="6.4" y="14" width="19.2" height="14" rx="2.4"></rect><path d="M10.8 14V10a5.2 5.2 0 0 1 10.4 0v4"></path><circle cx="16" cy="21" r="1.6"></circle></svg><span>${t("trustSecurePayment", "Secure Payment<br />100% Protected")}</span></li>
        <li><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3.4 27 7.6v8.2c0 6.6-4.5 11-11 13.2C9.5 26.8 5 22.4 5 15.8V7.6Z"></path><polyline points="11.4,16.2 14.8,19.6 21,12.6"></polyline></svg><span>${t("trustEasyReturns", "Easy Returns<br />Within 14 Days")}</span></li>
      </ul>
    `;

    wireEvents();
    if (!firstRenderDone) scanReveal(document.getElementById("checkoutSlot"));
  }

  function wireEvents() {
    if (window.AH_I18N) window.AH_I18N.wireLangButtons();
    const byId = (id) => document.getElementById(id);
    byId("fEmail").addEventListener("input", (e) => (state.email = e.target.value));
    byId("fName").addEventListener("input", (e) => (state.fullName = e.target.value));
    byId("fPhone").addEventListener("input", (e) => (state.phone = e.target.value));
    byId("fGov").addEventListener("change", (e) => {
      state.governorate = e.target.value;
      render();
    });
    byId("fCity").addEventListener("input", (e) => (state.city = e.target.value));
    byId("fAddress").addEventListener("input", (e) => (state.address = e.target.value));
    byId("fNotes").addEventListener("input", (e) => (state.notes = e.target.value));
    byId("fAgree").addEventListener("change", (e) => (state.agree = e.target.checked));
    const paymentRefEl = byId("fPaymentRef");
    paymentRefEl && paymentRefEl.addEventListener("input", (e) => (state.paymentReference = e.target.value));
    const paymentSenderEl = byId("fPaymentSender");
    paymentSenderEl && paymentSenderEl.addEventListener("input", (e) => (state.paymentSenderName = e.target.value));

    document.querySelectorAll("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const text = btn.getAttribute("data-copy") || "";
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // clipboard API unavailable — select the text as a fallback so
          // the customer can still copy it manually.
        }
        const original = btn.innerHTML;
        btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="4,13 9,18 20,6"></polyline></svg>`;
        setTimeout(() => { btn.innerHTML = original; }, 1400);
      });
    });

    document.querySelectorAll('input[name="delivery"]').forEach((r) =>
      r.addEventListener("change", (e) => {
        state.delivery = e.target.value;
        render();
      })
    );
    document.querySelectorAll('input[name="payment"]').forEach((r) =>
      r.addEventListener("change", (e) => {
        state.payment = e.target.value;
        render();
      })
    );

    document.querySelectorAll("[data-remove]").forEach((btn) =>
      btn.addEventListener("click", () => {
        Cart.remove(btn.dataset.remove);
      })
    );
    document.querySelectorAll("[data-step]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const step = Number(btn.dataset.step);
        const line = state.lines.find((l) => l.id === id);
        if (!line) return;
        // Pressing "-" at qty 1 removes the line instead of doing nothing.
        if (step < 0 && line.qty <= 1) Cart.remove(id);
        else Cart.setQty(id, line.qty + step);
      })
    );

    const couponInputEl = byId("couponInputEl");
    couponInputEl &&
      couponInputEl.addEventListener("input", (e) => {
        state.couponInput = e.target.value;
      });
    couponInputEl &&
      couponInputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          applyCoupon();
        }
      });
    const couponApplyBtn = byId("couponApply");
    couponApplyBtn && couponApplyBtn.addEventListener("click", applyCoupon);
    const couponRemoveBtn = byId("couponRemove");
    couponRemoveBtn &&
      couponRemoveBtn.addEventListener("click", () => {
        state.coupon = null;
        state.couponError = "";
        try { sessionStorage.removeItem("ah_coupon"); } catch {}
        render();
      });

    const placeBtn = byId("placeOrderBtn");
    placeBtn && placeBtn.addEventListener("click", placeOrder);
  }

  async function applyCoupon() {
    state.couponError = "";
    const code = state.couponInput.trim();
    if (!code) return;
    state.couponLoading = true;
    render();
    try {
      const data = await API.post("/api/coupons", { code });
      state.coupon = { code: data.code, percent: data.percent };
      state.couponInput = "";
      try { sessionStorage.setItem("ah_coupon", JSON.stringify(state.coupon)); } catch {}
    } catch (err) {
      state.coupon = null;
      state.couponError = (err && err.message) || "Invalid coupon code.";
    } finally {
      state.couponLoading = false;
      render();
    }
  }

  async function placeOrder() {
    state.error = "";
    if (!state.email || !state.fullName || !state.phone || !state.governorate || !state.city || !state.address) {
      state.error = t("errFillFields", "Please fill in all required shipping fields.");
      render();
      return;
    }
    if (!state.agree) {
      state.error = t("errAgree", "Please agree to the Terms & Conditions to continue.");
      render();
      return;
    }
    if (state.payment === "instapay" && !state.paymentReference.trim()) {
      state.error = t("errInstapayPhone", "Please enter the phone number you sent the InstaPay transfer from.");
      render();
      return;
    }
    if (state.payment === "instapay" && !state.paymentSenderName.trim()) {
      state.error = t("errInstapaySender", "Please enter the sender's name.");
      render();
      return;
    }
    if (state.lines.length === 0) {
      state.error = t("errEmptyCart", "Your cart is empty.");
      render();
      return;
    }

    state.placing = true;
    render();

    try {
      const { subtotal, shipping, discount, total } = computeTotals();
      const deliveryLabel =
        state.delivery === "pickup" ? "Store Pickup" : state.delivery === "express" ? "Express Delivery (1–2 Business Days)" : "Standard Delivery (2–4 Business Days)";

      const data = await API.post("/api/orders", {
        email: state.email,
        fullName: state.fullName,
        phone: state.phone,
        governorate: state.governorate,
        city: state.city,
        address: state.address,
        delivery: deliveryLabel,
        payment: state.payment === "instapay" ? "InstaPay" : "Cash on Delivery",
        paymentReference: state.payment === "instapay" ? state.paymentReference.trim() : null,
        paymentSenderName: state.payment === "instapay" ? state.paymentSenderName.trim() : null,
        notes: state.notes,
        items: state.lines.map((l) => ({ name: l.name, price: l.price, image: l.image, qty: l.qty })),
        subtotal,
        shipping,
        discount,
        couponCode: state.coupon ? state.coupon.code : null,
        total,
      });
      Cart.clear();
      window.location.href = "/order-confirmation.html?id=" + encodeURIComponent(data.id);
    } catch {
      state.error = t("errPlaceOrder", "Something went wrong placing your order. Please try again.");
      state.placing = false;
      render();
    }
  }

  function syncCart() {
    state.lines = Cart.read();
    render();
  }

  async function init() {
    syncCart();
    document.addEventListener("cart:changed", syncCart);
    if (state.lines.length) trackEvent("checkout_started");

    // pick up a coupon already applied in the cart drawer (site-chrome.js
    // stores it under this same key) so the customer isn't asked twice.
    try {
      const saved = JSON.parse(sessionStorage.getItem("ah_coupon") || "null");
      if (saved && saved.code && saved.percent) state.coupon = saved;
    } catch {}

    try {
      const d = await API.get("/api/shipping");
      state.rates = d.rates || [];
    } catch {
      state.rates = [];
    }
    render();
    // Shipping rates (which can change delivery-price text but not the
    // card layout itself) are the last thing init() loads — now that
    // this first real render has happened, later re-renders (every
    // field edit, radio click, language switch) should just update in
    // place with no replayed entrance animation.
    firstRenderDone = true;
  }

  document.addEventListener("ah:langchange", render);

  init();
})();
