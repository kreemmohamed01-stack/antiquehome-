export default function CartDrawer() {
  return (
    <div className="drawer" id="cartDrawerWrap" aria-hidden="true">
      <button className="drawer__scrim" id="cartScrim" type="button" tabIndex={-1} aria-label="Close cart"></button>

      <aside className="drawer__panel drawer__panel--cart" id="cartDrawer" aria-label="Your cart">
        <div className="drawer__scroll">
          <div className="dw__head">
            <h2 className="dw__title">
              Your Cart
              <span className="dw__spark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2 14 10 22 12 14 14 12 22 10 14 2 12 10 10Z"></path></svg></span>
            </h2>
            <button className="dw__close" type="button" id="cartClose" aria-label="Close cart">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.4"></circle><line x1="8.8" y1="8.8" x2="15.2" y2="15.2"></line><line x1="15.2" y1="8.8" x2="8.8" y2="15.2"></line></svg>
            </button>
          </div>

          <span className="ornament dw__ornament" aria-hidden="true"><i></i><b></b><i></i></span>

          <p className="dw__sub" id="cartCount">Your cart is empty</p>

          <div className="ship">
            <div className="ship__row">
              <span className="ship__ico" aria-hidden="true">
                <svg viewBox="0 0 32 32"><path d="M2.6 8.4h14v12.8h-14z"></path><path d="M16.6 12.4h6.6l4.2 4.2v4.6h-10.8z"></path><circle cx="9.2" cy="24" r="2.6"></circle><circle cx="22.6" cy="24" r="2.6"></circle></svg>
              </span>
              <p className="ship__text" id="shipText">You are <strong>EGP 15,000</strong> away from free shipping</p>
              <span className="ship__goal">Free Shipping<br /><strong>EGP 15,000</strong></span>
            </div>
            <div className="ship__bar"><span className="ship__fill" id="shipFill" style={{ width: "0%" }}></span></div>
          </div>

          <ul className="citems" id="cartItems"></ul>

          <p className="citems__empty" id="cartEmpty">Your cart is empty — time to discover something timeless.</p>

          <div className="promo" style={{ display: "none" }}>
            <button className="promo__row" type="button" id="promoToggle" aria-expanded="false" aria-controls="promoBody">
              <span className="promo__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4.6 12.4V6a1.4 1.4 0 0 1 1.4-1.4h6.4l8 8-7.8 7.8-8-8Z"></path><circle cx="9" cy="9" r="1.5"></circle></svg></span>
              <span className="promo__label">Add Promo Code</span>
              <svg className="promo__chev" viewBox="0 0 12 8" aria-hidden="true"><polyline points="1,1.5 6,6.5 11,1.5"></polyline></svg>
            </button>
            <div className="promo__wrap" id="promoBody">
              <form className="promo__form" id="promoForm">
                <input type="text" id="promoInput" placeholder="Enter promo code" aria-label="Promo code" autoComplete="off" />
                <button type="submit">Apply</button>
              </form>
              <p className="promo__note" id="promoNote" role="status" aria-live="polite"></p>
            </div>
          </div>

          <div className="summary" style={{ display: "none" }}>
            <div className="summary__row"><span>Subtotal</span><span id="sumSubtotal">EGP 0</span></div>
            <div className="summary__row"><span>Shipping</span><span id="sumShipping">EGP 0</span></div>
            <div className="summary__total">
              <span>Total<small>Including VAT</small></span>
              <strong id="sumTotal">EGP 0</strong>
            </div>
          </div>

          <a className="dw-btn dw-btn--dark" href="/checkout" id="checkoutBtn" style={{ display: "none" }}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.6 7.8h12.8l1 12.4H4.6z"></path><path d="M8.9 9.6V6.6a3.1 3.1 0 0 1 6.2 0v3"></path></svg>
            <span>Proceed to Checkout</span>
          </a>

          <ul className="dw-trust">
            <li><span className="dw-trust__ico" aria-hidden="true"><svg viewBox="0 0 32 32"><rect x="6.4" y="14" width="19.2" height="14" rx="2.4"></rect><path d="M10.8 14V10a5.2 5.2 0 0 1 10.4 0v4"></path><circle cx="16" cy="21" r="1.6"></circle></svg></span><span>Secure<br />Payment</span></li>
            <li><span className="dw-trust__ico" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 3.4 27 7.6v8.2c0 6.6-4.5 11-11 13.2C9.5 26.8 5 22.4 5 15.8V7.6Z"></path><polyline points="11.4,16.2 14.8,19.6 21,12.6"></polyline></svg></span><span>Premium<br />Quality</span></li>
            <li><span className="dw-trust__ico" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M4.4 9.8A12 12 0 1 1 4 16"></path><polyline points="4.4,4.2 4.4,9.8 10,9.8"></polyline></svg></span><span>Easy<br />Returns</span></li>
            <li><span className="dw-trust__ico" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M6 17v-2a10 10 0 0 1 20 0v2"></path><rect x="4.4" y="17" width="6" height="8" rx="2"></rect><rect x="21.6" y="17" width="6" height="8" rx="2"></rect><path d="M26 25v1.4a3 3 0 0 1-3 3h-4.6"></path></svg></span><span>24/7<br />Support</span></li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
