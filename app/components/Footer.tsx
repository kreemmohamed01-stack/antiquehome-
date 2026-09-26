const categoryLinks = [
  { slug: "bleu-blanc", label: "Bleu Blanc", path: "M9.4 4.4h5.2l-.5 2.1a6.6 6.6 0 0 1 4 6.1c0 3.6-2.7 6.4-6.1 6.4s-6.1-2.8-6.1-6.4a6.6 6.6 0 0 1 4-6.1Z" },
];

export default function Footer() {
  return (
    <footer className="foot" id="contact">
      <picture className="foot__bg">
        <source media="(min-width: 900px)" srcSet="/footer/background%20footer%20desk.jpeg" />
        <img src="/footer/background footer mop.jpeg" alt="" loading="lazy" />
      </picture>

      <div className="foot__inner">
        <div className="fmark rv" data-rv>
          <i className="fmark__rule" aria-hidden="true"></i>
          <a className="fmark__logo" href="/" aria-label="Antique Home — Vase &amp; Decor">
            <img src="/footer/logo-footer.png" alt="Antique Home — Vase &amp; Decor" loading="lazy" />
            <span className="fmark__shine" aria-hidden="true"></span>
          </a>
          <i className="fmark__rule" aria-hidden="true"></i>
        </div>

        <span className="fmark__gem rv" data-rv aria-hidden="true"></span>

        <div className="foot__cols">
          <nav className="fcol fcol--shop rv rv--up" data-rv aria-label="Shop">
            <h2 className="fcol__title">Shop</h2>
            <ul className="fcol__list">
              <li><a href="/category/bleu-blanc"><span className="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9.4 4.4h5.2l-.5 2.1a6.6 6.6 0 0 1 4 6.1c0 3.6-2.7 6.4-6.1 6.4s-6.1-2.8-6.1-6.4a6.6 6.6 0 0 1 4-6.1Z"/></svg></span>Bleu Blanc</a></li>
              <li><a href="/category/lighting"><span className="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.4v3.2"/><path d="M4.6 13.4 12 6.6l7.4 6.8Z"/><path d="M8.4 13.4v2.4M12 13.4v3.6M15.6 13.4v2.4"/></svg></span>Lighting</a></li>
              <li><a href="/category/accessories"><span className="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.2 13.6 8 18.4 9.6 13.6 11.2 12 16l-1.6-4.8L5.6 9.6 10.4 8Z"/><path d="M17.6 15.2l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"/></svg></span>Accessories</a></li>
              <li><a href="/category/antiques"><span className="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="11" r="6.4"/><path d="M12 7.6V11l2.4 1.6"/><path d="M7.6 18.2 6.4 21M16.4 18.2 17.6 21"/></svg></span>Antiques</a></li>
              <li><a href="/category/artificial-plants-garden-stool"><span className="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 12.4c0-3.2 2-5.6 5-6.2-.2 3.4-2.1 5.6-5 6.2Z"/><path d="M12 12.4C12 9.2 10 6.8 7 6.2c.2 3.4 2.1 5.6 5 6.2Z"/><path d="M12 12.4V16"/><path d="M7.4 16h9.2l-1 5H8.4Z"/></svg></span>Artificial Plants &amp; Garden Stool</a></li>
              <li><a href="/category/wall-art-plates"><span className="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3.6" y="4.4" width="16.8" height="12.4" rx="1.4"/><path d="M6.4 14.2 10 10.4l2.6 2.6 2.6-3.2 2.4 4.4Z"/><path d="M8.4 20.4h7.2"/></svg></span>Wall Art &amp; Plates</a></li>
              <li><a href="/category/murano-glass"><span className="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 3.6h6l-.8 4.2c1.9 1 3 2.9 3 5.1 0 3.3-2.3 5.7-5.2 5.7S6.8 16.2 6.8 12.9c0-2.2 1.1-4.1 3-5.1Z"/><path d="M8.4 21h7.2"/></svg></span>Murano Glass</a></li>
              <li><a href="/category/furniture"><span className="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5.6 12V8.4a2 2 0 0 1 2-2h8.8a2 2 0 0 1 2 2V12"/><path d="M4 12.4h16v4.2H4z"/><path d="M5.6 16.6V20M18.4 16.6V20"/></svg></span>Furniture</a></li>
              <li><a href="/category/sale"><span className="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4.4 11.6 11.6 4.4h7.2v7.2l-7.2 7.2Z"/><circle cx="15.4" cy="8.6" r="1.5"/></svg></span>Sale</a></li>
            </ul>
          </nav>

          <nav className="fcol fcol--care rv rv--up" data-rv style={{ ["--rd" as string]: ".08s" }} aria-label="Customer care">
            <h2 className="fcol__title">Customer Care</h2>
            <ul className="fcol__list">
              <li><a href="#"><span className="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M2.8 6.6h11v9.2h-11z"/><path d="M13.8 9.6h4.4l3 3v3.2h-7.4z"/><circle cx="7.2" cy="18.4" r="2"/><circle cx="17.4" cy="18.4" r="2"/></svg></span>Shipping &amp; Delivery</a></li>
              <li><a href="#"><span className="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4.4 9.6A8 8 0 1 1 4 13.4"/><polyline points="4.2,4.6 4.2,9.8 9.4,9.8"/></svg></span>Returns &amp; Exchanges</a></li>
              <li><a href="#"><span className="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.4 20.4 7.6v8.8L12 20.6 3.6 16.4V7.6Z"/><polyline points="3.6,7.6 12,11.8 20.4,7.6"/><line x1="12" y1="11.8" x2="12" y2="20.6"/></svg></span>Track Your Order</a></li>
              <li><a href="https://wa.me/201125470009" target="_blank" rel="noopener noreferrer"><span className="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8.2 4.4H6a2.2 2.2 0 0 0-2.2 2.2c0 7.4 5.8 13.2 13.2 13.2a2.2 2.2 0 0 0 2.2-2.2v-2l-4-1.5-1.8 1.8a12.4 12.4 0 0 1-5.1-5.1L10 8.8Z"/></svg></span>Contact Us</a></li>
              <li><a href="#"><span className="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.4 19.6 6v6.2c0 4.8-3.2 8-7.6 9.4-4.4-1.4-7.6-4.6-7.6-9.4V6Z"/><polyline points="9,12.2 11.2,14.4 15.2,10"/></svg></span>Privacy Policy</a></li>
              <li><a href="#"><span className="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 3.4h8.4l4 4v13.2H6Z"/><polyline points="14.2,3.6 14.2,7.6 18.2,7.6"/><line x1="8.8" y1="12" x2="15.4" y2="12"/><line x1="8.8" y1="15.6" x2="13.4" y2="15.6"/></svg></span>Terms &amp; Conditions</a></li>
            </ul>
          </nav>

          <div className="fcol fcol--news rv rv--up" data-rv style={{ ["--rd" as string]: ".16s" }}>
            <h2 className="fcol__title">Newsletter</h2>
            <p className="fnews__text">Stay inspired with new<br />arrivals, stories &amp; offers.</p>
            <form className="fnews" id="footForm">
              <input id="footEmail" type="email" name="email" autoComplete="email" placeholder="Enter your email" aria-label="Your email address" required />
              <button type="submit" aria-label="Subscribe">
                <svg viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="21" y2="6"></line><polyline points="16.4,1.6 21.4,6 16.4,10.4"></polyline></svg>
              </button>
            </form>
            <p className="fnews__note" id="footNote" role="status" aria-live="polite"></p>
          </div>
        </div>

        <div className="fbar">
          <ul className="fbar__list">
            <li className="fbar__item rv rv--up" data-rv>
              <span className="fbar__ico" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M2.6 8.4h14v12.8h-14z"/><path d="M16.6 12.4h6.6l4.2 4.2v4.6h-10.8z"/><circle cx="9.2" cy="24" r="2.6"/><circle cx="22.6" cy="24" r="2.6"/></svg></span>
              <div className="fbar__copy"><h3>Worldwide Delivery</h3><p>Bringing timeless pieces<br />to your door.</p></div>
            </li>
            <li className="fbar__item rv rv--up" data-rv style={{ ["--rd" as string]: ".08s" }}>
              <span className="fbar__ico" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 3.4 27 7.6v8.2c0 6.6-4.5 11-11 13.2C9.5 26.8 5 22.4 5 15.8V7.6Z"/><polyline points="11.4,16.2 14.8,19.6 21,12.6"/></svg></span>
              <div className="fbar__copy"><h3>Secure Payments</h3><p>Your transactions are<br />100% protected.</p></div>
            </li>
            <li className="fbar__item fbar__item--social rv rv--up" data-rv style={{ ["--rd" as string]: ".16s" }}>
              <ul className="fsocial">
                <li><a href="https://www.instagram.com/antique_home111?igsi=MXQ1eWdvbGRsb2pvaA==" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <defs><radialGradient id="fIg" cx="30%" cy="107%" r="150%"><stop offset="0%" stopColor="#FDF497"/><stop offset="5%" stopColor="#FDF497"/><stop offset="45%" stopColor="#FD5949"/><stop offset="60%" stopColor="#D6249F"/><stop offset="90%" stopColor="#285AEB"/></radialGradient></defs>
                    <rect x="2" y="2" width="20" height="20" rx="5.6" fill="url(#fIg)"/>
                    <rect x="5.6" y="5.6" width="12.8" height="12.8" rx="3.9" fill="none" stroke="#fff" strokeWidth="1.5"/>
                    <circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" strokeWidth="1.5"/>
                    <circle cx="17.1" cy="6.9" r="1.15" fill="#fff"/>
                  </svg></a></li>
                <li><a href="#" aria-label="Email us">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#4caf50" d="M45 16.2l-5 2.75-5 4.75L35 40h7c1.657 0 3-1.343 3-3V16.2z"/>
                    <path fill="#1e88e5" d="M3 16.2l3.614 1.71L13 23.7V40H6c-1.657 0-3-1.343-3-3V16.2z"/>
                    <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"/>
                    <path fill="#c62828" d="M3 12.298V16.2l10 7.5V11.2L9.876 8.859A4.298 4.298 0 0 0 7.298 8h0A4.298 4.298 0 0 0 3 12.298z"/>
                    <path fill="#fbc02d" d="M45 12.298V16.2l-10 7.5V11.2l3.124-2.341A4.298 4.298 0 0 1 40.702 8h0A4.298 4.298 0 0 1 45 12.298z"/>
                  </svg></a></li>
                <li><a href="#" aria-label="Find us on Google Maps">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#4285F4" d="M24 46s-3.9-5-7.3-10.2h14.6C27.9 41 24 46 24 46z"/>
                    <path fill="#34A853" d="M11.9 28.7C10 25.6 8.8 22.6 8.8 19.6c0-2.9.9-5.6 2.5-7.8l11.1 9.4-10.5 7.5z"/>
                    <path fill="#FBBC04" d="M36.1 28.7c1.9-3.1 3.1-6.1 3.1-9.1 0-2.9-.9-5.6-2.5-7.8l-11.1 9.4 10.5 7.5z"/>
                    <path fill="#EA4335" d="M24 2c5.2 0 9.8 2.7 12.4 6.8L24 19.6 11.6 8.8C14.2 4.7 18.8 2 24 2z"/>
                    <circle cx="24" cy="19.6" r="5.5" fill="#fff"/>
                  </svg></a></li>
                <li><a href="https://wa.me/201125470009" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#25D366" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413"/>
                  </svg></a></li>
              </ul>
            </li>
            <li className="fbar__item rv rv--up" data-rv style={{ ["--rd" as string]: ".24s" }}>
              <span className="fbar__ico" aria-hidden="true"><svg viewBox="0 0 32 32"><circle cx="16" cy="13" r="8"/><polyline points="12.4,13.2 15,15.8 19.6,10.6"/><path d="M11.4 19.6 9.2 29l6.8-3.4 6.8 3.4-2.2-9.4"/></svg></span>
              <div className="fbar__copy"><h3>Quality Guaranteed</h3><p>Thoughtfully curated pieces<br />that last a lifetime.</p></div>
            </li>
          </ul>
        </div>

        <div className="fsign rv" data-rv>
          <i className="fsign__rule" aria-hidden="true"></i>
          <span className="fsign__label">Powered by</span> <a className="fsign__name" href="https://kreemaly.com" target="_blank" rel="noopener noreferrer">kreemaly</a>
          <i className="fsign__rule" aria-hidden="true"></i>
        </div>

        <p className="fcopy rv" data-rv style={{ ["--rd" as string]: ".08s" }}>© 2025 Antique Home. All rights reserved.</p>
      </div>
    </footer>
  );
}
