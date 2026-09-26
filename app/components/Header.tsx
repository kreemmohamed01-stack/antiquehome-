type HeaderProps = {
  logoHref?: string;
};

export function PromoBar() {
  return (
    <div className="promo-bar" role="note">
      <p className="promo-bar__text">
        <span>Spend <strong className="promo-bar__num">EGP 5,000</strong> &amp; Get <strong className="promo-bar__num">EGP 1,000</strong> Gift Free</span>
        <span aria-hidden="true">Spend <strong className="promo-bar__num">EGP 5,000</strong> &amp; Get <strong className="promo-bar__num">EGP 1,000</strong> Gift Free</span>
      </p>
    </div>
  );
}

// Header used inside the hero on the homepage (overlay style).
export function HeroHeader({ logoHref = "#hero" }: HeaderProps) {
  return (
    <header className="header">
      <a className="brand" href={logoHref} aria-label="Antique Home — Vase &amp; Decor">
        <img className="brand__logo" src="/logo hero.png" alt="Antique Home — Vase &amp; Decor" />
        <span className="brand__shine" aria-hidden="true"></span>
      </a>

      <button className="icon-btn menu-btn" type="button" id="menuBtn" aria-haspopup="true" aria-expanded="false" aria-controls="sideMenu" aria-label="Open menu">
        <span className="menu-btn__lines" aria-hidden="true">
          <span></span><span></span><span></span>
        </span>
        <span className="menu-btn__label">Menu</span>
      </button>

      <nav className="header__actions" aria-label="Utilities">
        <button className="icon-btn" type="button" id="searchBtn" aria-haspopup="true" aria-expanded="false" aria-controls="searchDrawer" aria-label="Search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.4"></circle>
            <line x1="15.7" y1="15.7" x2="20.2" y2="20.2"></line>
          </svg>
        </button>
        <button className="icon-btn cart-btn" type="button" id="cartBtn" aria-haspopup="true" aria-expanded="false" aria-controls="cartDrawer" aria-label="Shopping bag">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5.6 7.8h12.8l1 12.4H4.6z"></path>
            <path d="M8.9 9.6V6.6a3.1 3.1 0 0 1 6.2 0v3"></path>
          </svg>
          <span className="cart-btn__count">0</span>
        </button>
      </nav>
    </header>
  );
}

// Header used on interior pages (shop/product/about/category) with the
// desktop topbar + inline nav row underneath.
export function ShopHeader({ active }: { active: "shop" | "about" | "" }) {
  return (
    <div className="shop-header">
      <header className="header">
        <a className="brand" href="/" aria-label="Antique Home — Vase &amp; Decor">
          <img className="brand__logo" src="/logo hero.png" alt="Antique Home — Vase &amp; Decor" />
          <span className="brand__shine" aria-hidden="true"></span>
        </a>

        <button className="icon-btn menu-btn" type="button" id="menuBtn" aria-haspopup="true" aria-expanded="false" aria-controls="sideMenu" aria-label="Open menu">
          <span className="menu-btn__lines" aria-hidden="true">
            <span></span><span></span><span></span>
          </span>
          <span className="menu-btn__label">Menu</span>
        </button>

        <nav className="header__actions" aria-label="Utilities">
          <button className="icon-btn" type="button" id="searchBtn" aria-haspopup="true" aria-expanded="false" aria-controls="searchDrawer" aria-label="Search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.4"></circle>
              <line x1="15.7" y1="15.7" x2="20.2" y2="20.2"></line>
            </svg>
          </button>
          <button className="icon-btn cart-btn" type="button" id="cartBtn" aria-haspopup="true" aria-expanded="false" aria-controls="cartDrawer" aria-label="Shopping bag">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5.6 7.8h12.8l1 12.4H4.6z"></path>
              <path d="M8.9 9.6V6.6a3.1 3.1 0 0 1 6.2 0v3"></path>
            </svg>
            <span className="cart-btn__count">0</span>
          </button>
        </nav>
      </header>

      <nav className="shop-nav" aria-label="Primary">
        <a href="/">Home</a>
        <a href="/shop" className={active === "shop" ? "is-active" : ""}>Shop</a>
        <a href="/#collection">Collections</a>
        <a href="/about" className={active === "about" ? "is-active" : ""}>About</a>
        <a href="/#contact">Contact</a>
      </nav>
    </div>
  );
}

export function ShopTopbar() {
  return (
    <div className="shop-topbar">
      <span className="shop-topbar__ship">
        <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M2.6 8.4h14v12.8h-14z"></path><path d="M16.6 12.4h6.6l4.2 4.2v4.6h-10.8z"></path><circle cx="9.2" cy="24" r="2.6"></circle><circle cx="22.6" cy="24" r="2.6"></circle></svg>
        Free Delivery Across Egypt
      </span>
      <span className="shop-topbar__right"><span>EGP</span><span>|</span><span>EN</span></span>
    </div>
  );
}
