export default function SearchDrawer() {
  return (
    <div className="drawer" id="searchDrawerWrap" aria-hidden="true">
      <button className="drawer__scrim" id="searchScrim" type="button" tabIndex={-1} aria-label="Close search"></button>

      <aside className="drawer__panel drawer__panel--search" id="searchDrawer" aria-label="Search">
        <div className="drawer__scroll">
          <div className="dw__head">
            <h2 className="dw__title">
              Search
              <span className="dw__spark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2 14 10 22 12 14 14 12 22 10 14 2 12 10 10Z"></path></svg></span>
            </h2>
            <button className="dw__close" type="button" id="searchClose" aria-label="Close search">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.4"></circle><line x1="8.8" y1="8.8" x2="15.2" y2="15.2"></line><line x1="15.2" y1="8.8" x2="8.8" y2="15.2"></line></svg>
            </button>
          </div>

          <p className="dw__sub">Find the pieces that speak to your space</p>

          <form className="sfield" id="searchForm" action="/shop">
            <svg className="sfield__ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.4"></circle><line x1="15.7" y1="15.7" x2="20.2" y2="20.2"></line></svg>
            <input type="text" id="searchInput" name="q" placeholder="Search for products, collections&hellip;" aria-label="Search for products or collections" autoComplete="off" />
            <button type="submit" aria-label="Search">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 14 10 22 12 14 14 12 22 10 14 2 12 10 10Z"></path></svg>
            </button>
          </form>

          <p className="dw__label">Browse Categories</p>
          <div className="cats-row">
            <a className="cats-row__item" href="/category/bleu-blanc">
              <span className="cats-row__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9.4 4.4h5.2l-.5 2.1a6.6 6.6 0 0 1 4 6.1c0 3.6-2.7 6.4-6.1 6.4s-6.1-2.8-6.1-6.4a6.6 6.6 0 0 1 4-6.1Z"/></svg></span>
              <span>Bleu Blanc</span>
            </a>
            <a className="cats-row__item" href="/category/lighting">
              <span className="cats-row__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.4v3.2"/><path d="M4.6 13.4 12 6.6l7.4 6.8Z"/><path d="M8.4 13.4v2.4M12 13.4v3.6M15.6 13.4v2.4"/></svg></span>
              <span>Lighting</span>
            </a>
            <a className="cats-row__item" href="/category/accessories">
              <span className="cats-row__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.2 13.6 8 18.4 9.6 13.6 11.2 12 16l-1.6-4.8L5.6 9.6 10.4 8Z"/><path d="M17.6 15.2l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"/></svg></span>
              <span>Accessories</span>
            </a>
            <a className="cats-row__item" href="/category/antiques">
              <span className="cats-row__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="11" r="6.4"/><path d="M12 7.6V11l2.4 1.6"/><path d="M7.6 18.2 6.4 21M16.4 18.2 17.6 21"/></svg></span>
              <span>Antiques</span>
            </a>
            <a className="cats-row__item" href="/category/murano-glass">
              <span className="cats-row__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 3.6h6l-.8 4.2c1.9 1 3 2.9 3 5.1 0 3.3-2.3 5.7-5.2 5.7S6.8 16.2 6.8 12.9c0-2.2 1.1-4.1 3-5.1Z"/><path d="M8.4 21h7.2"/></svg></span>
              <span>Murano Glass</span>
            </a>
            <a className="cats-row__item cats-row__item--all" href="/shop">
              <span className="cats-row__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3.6" y="3.6" width="7.2" height="7.2" rx="1"></rect><rect x="13.2" y="3.6" width="7.2" height="7.2" rx="1"></rect><rect x="3.6" y="13.2" width="7.2" height="7.2" rx="1"></rect><rect x="13.2" y="13.2" width="7.2" height="7.2" rx="1"></rect></svg></span>
              <span>All Categories</span>
            </a>
          </div>

          <span className="ornament dw__ornament" aria-hidden="true"><i></i><b></b><i></i></span>

          <div className="dw__labelRow">
            <p className="dw__label">Featured Results</p>
            <a className="link-arrow" href="/shop">
              <span>View all</span>
              <svg viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
            </a>
          </div>

          <p className="sresults__empty" style={{ padding: "8px 0 20px", opacity: 0.7 }}>New products are added regularly — check back soon.</p>

          <div className="dw-help">
            <span className="dw-help__spark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2 14 10 22 12 14 14 12 22 10 14 2 12 10 10Z"></path></svg></span>
            <div className="dw-help__copy">
              <h3>Can&rsquo;t find what you&rsquo;re looking for?</h3>
              <p>Our team is here to help you find the perfect piece.</p>
            </div>
            <a className="dw-btn dw-btn--gold" href="https://wa.me/201125470009" target="_blank" rel="noopener noreferrer">
              <span>Contact Us</span>
              <svg viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}
