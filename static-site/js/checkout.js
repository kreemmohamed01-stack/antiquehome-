// Ported from app/checkout/page.tsx + app/components/CheckoutView.tsx.
// NOTE: the original React component posted to "/api/coupons/validate", but
// the actual serverless API is POST /api/coupons { code } (no /validate
// suffix, no ?admin=). Fixed here to match static-site/api/coupons.js exactly.
(function () {
  const FALLBACK_STANDARD = 100;
  const FALLBACK_EXPRESS = 150;

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
                  <button type="button" class="chk__itemRemove" aria-label="Remove ${l.name}" data-remove="${l.id}">
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
      : `<p style="opacity:.7;padding:12px 0">Your cart is empty. Add products from the shop before checking out.</p>`;

    const couponHtml = state.coupon
      ? `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:9px;background:rgba(111,163,107,.1);border:1px solid rgba(111,163,107,.35)">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style="flex:none;color:#4C6B3F">
            <circle cx="12" cy="12" r="9.4" fill="none" stroke="currentColor" stroke-width="1.8" />
            <polyline points="7.5,12.5 10.5,15.5 16.5,9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span style="flex:1;font-size:12.5px;color:#4C6B3F;font-weight:600">Coupon &ldquo;${state.coupon.code}&rdquo; applied — ${state.coupon.percent}% off</span>
          <button type="button" id="couponRemove" style="background:none;border:none;color:#4C6B3F;cursor:pointer;font-size:11px;text-decoration:underline">Remove</button>
        </div>`
      : `<div>
          <div style="display:flex;gap:8px">
            <input type="text" id="couponInputEl" placeholder="Discount code" value="${state.couponInput}" style="flex:1;padding:10px 12px;border-radius:8px;border:1px solid rgba(43,36,28,.16);font-size:12.5px" />
            <button type="button" id="couponApply" ${state.couponLoading ? "disabled" : ""} class="chk__submit" style="padding:0 20px;font-size:11px"><span>${state.couponLoading ? "…" : "Apply"}</span></button>
          </div>
          ${state.couponError ? `<p style="color:#a33;font-size:11.5px;margin-top:6px">${state.couponError}</p>` : ""}
        </div>`;

    document.getElementById("checkoutSlot").innerHTML = `
      <div class="chk__bg" aria-hidden="true">
        <img src="/خلفيه منتجات.png" alt="" loading="eager" />
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

      <div class="chk__wrap">
        <div class="chk__col chk__col--left">
          <section class="chk__card">
            <h2 class="chk__heading">1. Contact Information</h2>
            <p class="chk__sub">We&rsquo;ll use this information to keep you updated about your order.</p>
            <label class="chk__field">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5.4" width="18" height="13.2" rx="2"></rect><polyline points="3.6,6.4 12,13 20.4,6.4"></polyline></svg>
              <input type="email" id="fEmail" placeholder="Email Address" autocomplete="email" required value="${state.email}" />
            </label>
          </section>

          <section class="chk__card">
            <h2 class="chk__heading">2. Shipping Details</h2>
            <p class="chk__sub">Enter your delivery information.</p>
            <div class="chk__row2">
              <label class="chk__field">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.6"></circle><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"></path></svg>
                <input type="text" id="fName" placeholder="Full Name" autocomplete="name" required value="${state.fullName}" />
              </label>
              <label class="chk__field">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 4.4h3l1.4 4-2 1.6a12.4 12.4 0 0 0 5 5l1.6-2 4 1.4v3a2 2 0 0 1-2.2 2C10.7 19.1 4.9 13.3 4.6 6.6a2 2 0 0 1 2-2.2Z"></path></svg>
                <input type="tel" id="fPhone" placeholder="Phone Number" autocomplete="tel" inputmode="tel" required value="${state.phone}" />
              </label>
            </div>
            <label class="chk__field chk__field--select">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.4S5 15 5 9.8a7 7 0 0 1 14 0c0 5.2-7 11.6-7 11.6Z"></path><circle cx="12" cy="9.6" r="2.6"></circle></svg>
              <select id="fGov" required>
                <option value="" disabled ${state.governorate ? "" : "selected"}>Governorate</option>
                ${govOptions()
                  .map((g) => `<option ${state.governorate === g ? "selected" : ""}>${g}</option>`)
                  .join("")}
              </select>
              <svg class="chk__chev" viewBox="0 0 12 8" aria-hidden="true"><polyline points="1,1.5 6,6.5 11,1.5"></polyline></svg>
            </label>
            <label class="chk__field">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="7.4" width="16" height="12.6" rx="1.4"></rect><path d="M8.4 7.4V5.4a1.4 1.4 0 0 1 1.4-1.4h4.4a1.4 1.4 0 0 1 1.4 1.4v2"></path></svg>
              <input type="text" id="fCity" placeholder="City / Area" autocomplete="address-level2" required value="${state.city}" />
            </label>
            <label class="chk__field">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.4 12 4.6l8 6.8"></path><path d="M6 10v9.4h12V10"></path><path d="M10 19.4v-6h4v6"></path></svg>
              <input type="text" id="fAddress" placeholder="Detailed Address (Street, Building, Landmark)" autocomplete="street-address" required value="${state.address}" />
            </label>
          </section>

          <section class="chk__card">
            <h2 class="chk__heading">3. Delivery Options</h2>
            <p class="chk__sub">Choose how you want to receive your order.</p>
            <div class="chk__delivery">
              <label class="chk__radioCard${state.delivery === "standard" ? " is-active" : ""}">
                <input type="radio" name="delivery" value="standard" ${state.delivery === "standard" ? "checked" : ""} />
                <span class="chk__radioDot" aria-hidden="true"></span>
                <span class="chk__radioIco" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M2.6 8.4h14v12.8h-14z"></path><path d="M16.6 12.4h6.6l4.2 4.2v4.6h-10.8z"></path><circle cx="9.2" cy="24" r="2.6"></circle><circle cx="22.6" cy="24" r="2.6"></circle></svg></span>
                <strong>Standard Delivery</strong>
                <span class="chk__radioMeta">2 &ndash; 4 Business Days</span>
                <span class="chk__radioPrice">${state.governorate ? fmt(rate ? Number(rate.standard_price) : FALLBACK_STANDARD) : "From EGP 80"}</span>
              </label>
              <label class="chk__radioCard${state.delivery === "express" ? " is-active" : ""}">
                <input type="radio" name="delivery" value="express" ${state.delivery === "express" ? "checked" : ""} />
                <span class="chk__radioDot" aria-hidden="true"></span>
                <span class="chk__radioIco" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M4 16h20l-4-8h6l4 8v8H4Z"></path><circle cx="10" cy="26" r="2.4"></circle><circle cx="22" cy="26" r="2.4"></circle></svg></span>
                <strong>Express Delivery</strong>
                <span class="chk__radioMeta">1 &ndash; 2 Business Days</span>
                <span class="chk__radioPrice">${state.governorate ? fmt(rate ? Number(rate.express_price) : FALLBACK_EXPRESS) : "From EGP 130"}</span>
              </label>
              <label class="chk__radioCard${state.delivery === "pickup" ? " is-active" : ""}">
                <input type="radio" name="delivery" value="pickup" ${state.delivery === "pickup" ? "checked" : ""} />
                <span class="chk__radioDot" aria-hidden="true"></span>
                <span class="chk__radioIco" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M4 12.4 6.4 5h19.2l2.4 7.4"></path><path d="M4 12.4h24v13.2H4z"></path><path d="M12.4 25.6v-6.2h7.2v6.2"></path></svg></span>
                <strong>Store Pickup</strong>
                <span class="chk__radioMeta">Pick up from our store</span>
                <span class="chk__radioPrice">Free</span>
              </label>
            </div>
          </section>

          <section class="chk__card">
            <h2 class="chk__heading">4. Order Summary</h2>
            <p class="chk__sub">Review your items before placing the order.</p>
            ${itemsHtml}

            <div style="margin-top:18px">${couponHtml}</div>

            <div class="chk__totals">
              <div class="chk__totalsRow"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
              ${discount > 0 ? `<div class="chk__totalsRow" style="color:#4C6B3F"><span>Discount (${state.coupon.code})</span><span>-${fmt(discount)}</span></div>` : ""}
              <div class="chk__totalsRow"><span>Shipping${weightSurcharge > 0 ? ` <small style="opacity:.65">(incl. ${fmt(weightSurcharge)} for ${totalWeight.toFixed(1)}kg)</small>` : ""}</span><span>${shipping === 0 ? "Free" : fmt(shipping)}</span></div>
              <div class="chk__totalsFinal"><span>Total</span><strong>${fmt(total)}</strong></div>
            </div>
          </section>
        </div>

        <div class="chk__col chk__col--right">
          <figure class="chk__promoPanel">
            <img src="/sec 2/pic 11.jpeg" alt="" loading="lazy" />
            <figcaption>
              <h3>Pieces That<br />Tell a Story</h3>
              <span class="chk__promoBrand">ANTIQUE HOME</span>
            </figcaption>
          </figure>

          <section class="chk__card">
            <h2 class="chk__heading">5. Payment Method</h2>
            <p class="chk__sub">Choose your preferred payment method.</p>
            <div class="chk__pay">
              <label class="chk__payCard${state.payment === "instapay" ? " is-active" : ""}">
                <input type="radio" name="payment" value="instapay" ${state.payment === "instapay" ? "checked" : ""} />
                <span class="chk__payDot" aria-hidden="true"></span>
                <span class="chk__payLogo chk__payLogo--instapay">InstaPay</span>
                <span class="chk__payLabel">InstaPay</span>
              </label>
              <label class="chk__payCard${state.payment === "cod" ? " is-active" : ""}">
                <input type="radio" name="payment" value="cod" ${state.payment === "cod" ? "checked" : ""} />
                <span class="chk__payDot" aria-hidden="true"></span>
                <span class="chk__payIco" aria-hidden="true"><svg viewBox="0 0 32 32"><rect x="3" y="9" width="26" height="17" rx="2.4"></rect><circle cx="16" cy="17.5" r="4.2"></circle><path d="M20 25 25 29"></path></svg></span>
                <span class="chk__payLabel">Cash<br />on Delivery</span>
              </label>
              <label class="chk__payCard${state.payment === "card" ? " is-active" : ""}">
                <input type="radio" name="payment" value="card" ${state.payment === "card" ? "checked" : ""} />
                <span class="chk__payDot" aria-hidden="true"></span>
                <span class="chk__payIco" aria-hidden="true"><svg viewBox="0 0 32 32"><rect x="3" y="7.6" width="26" height="16.8" rx="2.4"></rect><line x1="3" y1="13" x2="29" y2="13"></line></svg></span>
                <span class="chk__payLabel">Debit Card</span>
              </label>
            </div>

            ${
              state.payment === "instapay"
                ? `<div class="chk__payPanel"><div class="chk__payNote"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.4"></circle><line x1="12" y1="8" x2="12" y2="13"></line><circle cx="12" cy="16.2" r="0.4"></circle></svg><div><strong>Pay with InstaPay</strong><p>You will be redirected to complete your payment using InstaPay.</p></div></div></div>`
                : ""
            }
            ${
              state.payment === "cod"
                ? `<div class="chk__payPanel"><div class="chk__payNote"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.4"></circle><line x1="12" y1="8" x2="12" y2="13"></line><circle cx="12" cy="16.2" r="0.4"></circle></svg><div><strong>Cash on Delivery</strong><p>Pay in cash when your order arrives at your doorstep.</p></div></div></div>`
                : ""
            }
            ${
              state.payment === "card"
                ? `<div class="chk__payPanel"><p class="chk__cardTitle">Pay with Debit Card</p><label class="chk__field"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12.4" rx="1.8"></rect><line x1="3" y1="10" x2="21" y2="10"></line></svg><input type="text" placeholder="Card Number" inputmode="numeric" autocomplete="cc-number" /></label></div>`
                : ""
            }
          </section>

          <section class="chk__card">
            <h2 class="chk__heading">6. Additional Notes <small>(Optional)</small></h2>
            <label class="chk__field chk__field--textarea">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.4h8.4l4 4v13.2H6Z"></path></svg>
              <textarea rows="3" id="fNotes" placeholder="Any special requests or notes for your order&hellip;">${state.notes}</textarea>
            </label>

            <label class="chk__agree">
              <input type="checkbox" id="fAgree" ${state.agree ? "checked" : ""} required />
              <span class="chk__agreeBox" aria-hidden="true"><svg viewBox="0 0 16 12"><polyline points="1.5,6 6,10.5 14.5,1.5"></polyline></svg></span>
              <span>I agree to the <a href="#">Terms &amp; Conditions</a> and <a href="#">Privacy Policy</a>.</span>
            </label>

            ${state.error ? `<p style="color:#a33;margin-top:8px">${state.error}</p>` : ""}

            <button type="button" class="chk__submit" id="placeOrderBtn" ${state.placing ? "disabled" : ""}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.8" y="10.4" width="14.4" height="10.4" rx="1.8"></rect><path d="M8.1 10.4V7.6a3.9 3.9 0 0 1 7.8 0v2.8"></path></svg>
              <span>${state.placing ? "Placing your order…" : "Place Order — " + fmt(total)}</span>
              <svg class="chk__submitArrow" viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
            </button>
          </section>
        </div>
      </div>

      <ul class="chk__trust">
        <li><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M2.6 8.4h14v12.8h-14z"></path><path d="M16.6 12.4h6.6l4.2 4.2v4.6h-10.8z"></path><circle cx="9.2" cy="24" r="2.6"></circle><circle cx="22.6" cy="24" r="2.6"></circle></svg><span>Free Delivery<br />Across Egypt</span></li>
        <li><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="6.4" y="14" width="19.2" height="14" rx="2.4"></rect><path d="M10.8 14V10a5.2 5.2 0 0 1 10.4 0v4"></path><circle cx="16" cy="21" r="1.6"></circle></svg><span>Secure Payment<br />100% Protected</span></li>
        <li><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3.4 27 7.6v8.2c0 6.6-4.5 11-11 13.2C9.5 26.8 5 22.4 5 15.8V7.6Z"></path><polyline points="11.4,16.2 14.8,19.6 21,12.6"></polyline></svg><span>Easy Returns<br />Within 14 Days</span></li>
      </ul>
    `;

    wireEvents();
  }

  function wireEvents() {
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
        if (line) Cart.setQty(id, line.qty + step);
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
      state.error = "Please fill in all required shipping fields.";
      render();
      return;
    }
    if (!state.agree) {
      state.error = "Please agree to the Terms & Conditions to continue.";
      render();
      return;
    }
    if (state.lines.length === 0) {
      state.error = "Your cart is empty.";
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
        payment: state.payment === "instapay" ? "InstaPay" : state.payment === "cod" ? "Cash on Delivery" : "Debit Card",
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
      state.error = "Something went wrong placing your order. Please try again.";
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
  }

  init();
})();
