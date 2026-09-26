"use client";

import { useEffect, useState } from "react";
import { readCart, removeFromCart, setQty, cartTotals, clearCart, CART_EVENT, type CartLine } from "@/lib/cart";

const SHIPPING_STANDARD = 100;
const SHIPPING_PICKUP = 0;

export default function CheckoutView() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [delivery, setDelivery] = useState<"standard" | "pickup">("standard");
  const [payment, setPayment] = useState<"instapay" | "cod" | "card">("instapay");
  const [agree, setAgree] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const sync = () => setLines(readCart());
    sync();
    window.addEventListener(CART_EVENT, sync);
    return () => window.removeEventListener(CART_EVENT, sync);
  }, []);

  const { subtotal } = cartTotals(lines);
  const shipping = delivery === "pickup" ? SHIPPING_PICKUP : SHIPPING_STANDARD;
  const total = subtotal + shipping;

  function fmt(n: number) {
    return "EGP " + Math.round(n).toLocaleString("en-US");
  }

  async function placeOrder() {
    setError("");
    if (!email || !fullName || !phone || !governorate || !city || !address) {
      setError("Please fill in all required shipping fields.");
      return;
    }
    if (!agree) {
      setError("Please agree to the Terms & Conditions to continue.");
      return;
    }
    if (lines.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fullName,
          phone,
          governorate,
          city,
          address,
          delivery: delivery === "pickup" ? "Store Pickup" : "Standard Delivery (2–4 Business Days)",
          payment: payment === "instapay" ? "InstaPay" : payment === "cod" ? "Cash on Delivery" : "Debit Card",
          notes,
          items: lines.map((l) => ({ name: l.name, price: l.price, image: l.image, qty: l.qty })),
          subtotal,
          shipping,
          discount: 0,
          total,
        }),
      });
      if (!res.ok) throw new Error("Order failed");
      const data = await res.json();
      clearCart();
      window.location.href = `/order-confirmation/${data.id}`;
    } catch {
      setError("Something went wrong placing your order. Please try again.");
      setPlacing(false);
    }
  }

  return (
    <>
      <div className="chk__bg" aria-hidden="true">
        <img src="/خلفيه منتجات.png" alt="" loading="eager" />
      </div>

      <header className="chk__topbar">
        <a className="chk__back" href="/shop">
          <svg viewBox="0 0 20 14" aria-hidden="true"><line x1="19" y1="7" x2="2" y2="7"></line><polyline points="7.4,1.6 1.6,7 7.4,12.4"></polyline></svg>
          Continue Shopping
        </a>
        <a className="chk__brand" href="/" aria-label="Antique Home — Vase &amp; Decor">
          <span className="chk__brand-name">ANTIQUE HOME</span>
          <span className="chk__brand-sub">VASE &amp; DECOR</span>
        </a>
        <span className="chk__secure">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.8" y="10.4" width="14.4" height="10.4" rx="1.8"></rect><path d="M8.1 10.4V7.6a3.9 3.9 0 0 1 7.8 0v2.8"></path></svg>
          Secure Checkout
        </span>
      </header>

      <div className="chk__wrap">
        <div className="chk__col chk__col--left">
          <section className="chk__card">
            <h2 className="chk__heading">1. Contact Information</h2>
            <p className="chk__sub">We&rsquo;ll use this information to keep you updated about your order.</p>
            <label className="chk__field">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5.4" width="18" height="13.2" rx="2"></rect><polyline points="3.6,6.4 12,13 20.4,6.4"></polyline></svg>
              <input type="email" placeholder="Email Address" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          </section>

          <section className="chk__card">
            <h2 className="chk__heading">2. Shipping Details</h2>
            <p className="chk__sub">Enter your delivery information.</p>
            <div className="chk__row2">
              <label className="chk__field">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.6"></circle><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"></path></svg>
                <input type="text" placeholder="Full Name" autoComplete="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </label>
              <label className="chk__field">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 4.4h3l1.4 4-2 1.6a12.4 12.4 0 0 0 5 5l1.6-2 4 1.4v3a2 2 0 0 1-2.2 2C10.7 19.1 4.9 13.3 4.6 6.6a2 2 0 0 1 2-2.2Z"></path></svg>
                <input type="tel" placeholder="Phone Number" autoComplete="tel" inputMode="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
            </div>
            <label className="chk__field chk__field--select">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.4S5 15 5 9.8a7 7 0 0 1 14 0c0 5.2-7 11.6-7 11.6Z"></path><circle cx="12" cy="9.6" r="2.6"></circle></svg>
              <select required value={governorate} onChange={(e) => setGovernorate(e.target.value)}>
                <option value="" disabled>Governorate</option>
                <option>Cairo</option>
                <option>Giza</option>
                <option>Alexandria</option>
                <option>Qalyubia</option>
                <option>Other</option>
              </select>
              <svg className="chk__chev" viewBox="0 0 12 8" aria-hidden="true"><polyline points="1,1.5 6,6.5 11,1.5"></polyline></svg>
            </label>
            <label className="chk__field">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="7.4" width="16" height="12.6" rx="1.4"></rect><path d="M8.4 7.4V5.4a1.4 1.4 0 0 1 1.4-1.4h4.4a1.4 1.4 0 0 1 1.4 1.4v2"></path></svg>
              <input type="text" placeholder="City / Area" autoComplete="address-level2" required value={city} onChange={(e) => setCity(e.target.value)} />
            </label>
            <label className="chk__field">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.4 12 4.6l8 6.8"></path><path d="M6 10v9.4h12V10"></path><path d="M10 19.4v-6h4v6"></path></svg>
              <input type="text" placeholder="Detailed Address (Street, Building, Landmark)" autoComplete="street-address" required value={address} onChange={(e) => setAddress(e.target.value)} />
            </label>
          </section>

          <section className="chk__card">
            <h2 className="chk__heading">3. Delivery Options</h2>
            <p className="chk__sub">Choose how you want to receive your order.</p>
            <div className="chk__delivery">
              <label className={`chk__radioCard${delivery === "standard" ? " is-active" : ""}`}>
                <input type="radio" name="delivery" checked={delivery === "standard"} onChange={() => setDelivery("standard")} />
                <span className="chk__radioDot" aria-hidden="true"></span>
                <span className="chk__radioIco" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M2.6 8.4h14v12.8h-14z"></path><path d="M16.6 12.4h6.6l4.2 4.2v4.6h-10.8z"></path><circle cx="9.2" cy="24" r="2.6"></circle><circle cx="22.6" cy="24" r="2.6"></circle></svg></span>
                <strong>Standard Delivery</strong>
                <span className="chk__radioMeta">2 &ndash; 4 Business Days</span>
                <span className="chk__radioPrice">EGP 100</span>
              </label>
              <label className={`chk__radioCard${delivery === "pickup" ? " is-active" : ""}`}>
                <input type="radio" name="delivery" checked={delivery === "pickup"} onChange={() => setDelivery("pickup")} />
                <span className="chk__radioDot" aria-hidden="true"></span>
                <span className="chk__radioIco" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M4 12.4 6.4 5h19.2l2.4 7.4"></path><path d="M4 12.4h24v13.2H4z"></path><path d="M12.4 25.6v-6.2h7.2v6.2"></path></svg></span>
                <strong>Store Pickup</strong>
                <span className="chk__radioMeta">Pick up from our store</span>
                <span className="chk__radioPrice">Free</span>
              </label>
            </div>
          </section>

          <section className="chk__card">
            <h2 className="chk__heading">4. Order Summary</h2>
            <p className="chk__sub">Review your items before placing the order.</p>

            {lines.length === 0 ? (
              <p style={{ opacity: 0.7, padding: "12px 0" }}>Your cart is empty. Add products from the shop before checking out.</p>
            ) : (
              <ul className="chk__items">
                {lines.map((l) => (
                  <li className="chk__item" key={l.id}>
                    <figure className="chk__itemMedia"><img src={l.image} alt={l.name} loading="lazy" /></figure>
                    <div className="chk__itemBody">
                      <div className="chk__itemTop">
                        <div><h3>{l.name}</h3></div>
                        <button type="button" className="chk__itemRemove" aria-label={`Remove ${l.name}`} onClick={() => removeFromCart(l.id)}>
                          <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="5.4" y1="5.4" x2="18.6" y2="18.6"></line><line x1="18.6" y1="5.4" x2="5.4" y2="18.6"></line></svg>
                        </button>
                      </div>
                      <div className="chk__itemBottom">
                        <div className="qty chk__itemQty">
                          <button type="button" className="qty__btn" aria-label="Decrease quantity" onClick={() => setQty(l.id, l.qty - 1)}>
                            <svg viewBox="0 0 16 16" aria-hidden="true"><line x1="3" y1="8" x2="13" y2="8"></line></svg>
                          </button>
                          <span className="qty__num">{l.qty}</span>
                          <button type="button" className="qty__btn" aria-label="Increase quantity" onClick={() => setQty(l.id, l.qty + 1)}>
                            <svg viewBox="0 0 16 16" aria-hidden="true"><line x1="8" y1="3" x2="8" y2="13"></line><line x1="3" y1="8" x2="13" y2="8"></line></svg>
                          </button>
                        </div>
                        <span className="chk__itemPrice">EGP <b>{(l.price * l.qty).toLocaleString("en-US")}</b></span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="chk__totals">
              <div className="chk__totalsRow"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              <div className="chk__totalsRow"><span>Shipping</span><span>{shipping === 0 ? "Free" : fmt(shipping)}</span></div>
              <div className="chk__totalsFinal"><span>Total</span><strong>{fmt(total)}</strong></div>
            </div>
          </section>
        </div>

        <div className="chk__col chk__col--right">
          <figure className="chk__promoPanel">
            <img src="/sec 2/pic 11.jpeg" alt="" loading="lazy" />
            <figcaption>
              <h3>Pieces That<br />Tell a Story</h3>
              <span className="chk__promoBrand">ANTIQUE HOME</span>
            </figcaption>
          </figure>

          <section className="chk__card">
            <h2 className="chk__heading">5. Payment Method</h2>
            <p className="chk__sub">Choose your preferred payment method.</p>
            <div className="chk__pay">
              <label className={`chk__payCard${payment === "instapay" ? " is-active" : ""}`}>
                <input type="radio" name="payment" checked={payment === "instapay"} onChange={() => setPayment("instapay")} />
                <span className="chk__payDot" aria-hidden="true"></span>
                <span className="chk__payLogo chk__payLogo--instapay">InstaPay</span>
                <span className="chk__payLabel">InstaPay</span>
              </label>
              <label className={`chk__payCard${payment === "cod" ? " is-active" : ""}`}>
                <input type="radio" name="payment" checked={payment === "cod"} onChange={() => setPayment("cod")} />
                <span className="chk__payDot" aria-hidden="true"></span>
                <span className="chk__payIco" aria-hidden="true"><svg viewBox="0 0 32 32"><rect x="3" y="9" width="26" height="17" rx="2.4"></rect><circle cx="16" cy="17.5" r="4.2"></circle><path d="M20 25 25 29"></path></svg></span>
                <span className="chk__payLabel">Cash<br />on Delivery</span>
              </label>
              <label className={`chk__payCard${payment === "card" ? " is-active" : ""}`}>
                <input type="radio" name="payment" checked={payment === "card"} onChange={() => setPayment("card")} />
                <span className="chk__payDot" aria-hidden="true"></span>
                <span className="chk__payIco" aria-hidden="true"><svg viewBox="0 0 32 32"><rect x="3" y="7.6" width="26" height="16.8" rx="2.4"></rect><line x1="3" y1="13" x2="29" y2="13"></line></svg></span>
                <span className="chk__payLabel">Debit Card</span>
              </label>
            </div>

            {payment === "instapay" && (
              <div className="chk__payPanel">
                <div className="chk__payNote">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.4"></circle><line x1="12" y1="8" x2="12" y2="13"></line><circle cx="12" cy="16.2" r="0.4"></circle></svg>
                  <div><strong>Pay with InstaPay</strong><p>You will be redirected to complete your payment using InstaPay.</p></div>
                </div>
              </div>
            )}
            {payment === "cod" && (
              <div className="chk__payPanel">
                <div className="chk__payNote">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.4"></circle><line x1="12" y1="8" x2="12" y2="13"></line><circle cx="12" cy="16.2" r="0.4"></circle></svg>
                  <div><strong>Cash on Delivery</strong><p>Pay in cash when your order arrives at your doorstep.</p></div>
                </div>
              </div>
            )}
            {payment === "card" && (
              <div className="chk__payPanel">
                <p className="chk__cardTitle">Pay with Debit Card</p>
                <label className="chk__field">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12.4" rx="1.8"></rect><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  <input type="text" placeholder="Card Number" inputMode="numeric" autoComplete="cc-number" />
                </label>
              </div>
            )}
          </section>

          <section className="chk__card">
            <h2 className="chk__heading">6. Additional Notes <small>(Optional)</small></h2>
            <label className="chk__field chk__field--textarea">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.4h8.4l4 4v13.2H6Z"></path></svg>
              <textarea rows={3} placeholder="Any special requests or notes for your order&hellip;" value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
            </label>

            <label className="chk__agree">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} required />
              <span className="chk__agreeBox" aria-hidden="true"><svg viewBox="0 0 16 12"><polyline points="1.5,6 6,10.5 14.5,1.5"></polyline></svg></span>
              <span>I agree to the <a href="#">Terms &amp; Conditions</a> and <a href="#">Privacy Policy</a>.</span>
            </label>

            {error && <p style={{ color: "#a33", marginTop: 8 }}>{error}</p>}

            <button type="button" className="chk__submit" disabled={placing} onClick={placeOrder}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.8" y="10.4" width="14.4" height="10.4" rx="1.8"></rect><path d="M8.1 10.4V7.6a3.9 3.9 0 0 1 7.8 0v2.8"></path></svg>
              <span>{placing ? "Placing your order…" : `Place Order — ${fmt(total)}`}</span>
              <svg className="chk__submitArrow" viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
            </button>
          </section>
        </div>
      </div>

      <ul className="chk__trust">
        <li><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M2.6 8.4h14v12.8h-14z"></path><path d="M16.6 12.4h6.6l4.2 4.2v4.6h-10.8z"></path><circle cx="9.2" cy="24" r="2.6"></circle><circle cx="22.6" cy="24" r="2.6"></circle></svg><span>Free Delivery<br />Across Egypt</span></li>
        <li><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="6.4" y="14" width="19.2" height="14" rx="2.4"></rect><path d="M10.8 14V10a5.2 5.2 0 0 1 10.4 0v4"></path><circle cx="16" cy="21" r="1.6"></circle></svg><span>Secure Payment<br />100% Protected</span></li>
        <li><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3.4 27 7.6v8.2c0 6.6-4.5 11-11 13.2C9.5 26.8 5 22.4 5 15.8V7.6Z"></path><polyline points="11.4,16.2 14.8,19.6 21,12.6"></polyline></svg><span>Easy Returns<br />Within 14 Days</span></li>
      </ul>
    </>
  );
}
