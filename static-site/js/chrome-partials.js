// Injects the shared footer / side menu / cart+search drawers / whatsapp float /
// music player markup into #chromeSlot on every storefront page (ported verbatim
// from Footer.tsx, SideMenu.tsx, CartDrawer.tsx, SearchDrawer.tsx, WhatsAppFloat.tsx,
// MusicPlayer.tsx). Injected as a string (not React) so site-chrome.js's
// getElementById lookups find the same DOM structure/ids/classes.
(function () {
  // Stable place-id link (resolved from the shop's shared Google Maps
  // short link) rather than a plain text-search query, so it always
  // opens the exact pinned location rather than a "best guess" result.
  var MAPS_URL = "https://maps.google.com/maps?q=2+Mahmoud+Haridy,+El+Nozha,+Cairo+Governorate&ftid=0x145817d7eee8f175:0x984cb1d837b32a46";

  var CHROME_HTML = `
<footer class="foot" id="contact">
  <picture class="foot__bg">
    <source media="(min-width: 900px)" srcset="/footer/background%20footer%20desk.jpeg" />
    <img src="/footer/background footer mop.jpeg" alt="" loading="lazy" />
  </picture>

  <div class="foot__inner">
    <div class="fmark rv" data-rv>
      <i class="fmark__rule" aria-hidden="true"></i>
      <a class="fmark__logo" href="/" aria-label="Antique Home — Vase &amp; Decor">
        <img src="/footer/logo-footer.png" alt="Antique Home — Vase &amp; Decor" loading="lazy" />
        <span class="fmark__shine" aria-hidden="true"></span>
      </a>
      <i class="fmark__rule" aria-hidden="true"></i>
    </div>

    <span class="fmark__gem rv" data-rv aria-hidden="true"></span>

    <div class="foot__cols">
      <nav class="fcol fcol--shop rv rv--up" data-rv aria-label="Shop">
        <h2 class="fcol__title">Shop</h2>
        <ul class="fcol__list">
          <li><a href="/shop.html?category=bleu-blanc"><span class="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9.4 4.4h5.2l-.5 2.1a6.6 6.6 0 0 1 4 6.1c0 3.6-2.7 6.4-6.1 6.4s-6.1-2.8-6.1-6.4a6.6 6.6 0 0 1 4-6.1Z"/></svg></span>Bleu Blanc</a></li>
          <li><a href="/shop.html?category=lighting"><span class="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.4v3.2"/><path d="M4.6 13.4 12 6.6l7.4 6.8Z"/><path d="M8.4 13.4v2.4M12 13.4v3.6M15.6 13.4v2.4"/></svg></span>Lighting</a></li>
          <li><a href="/shop.html?category=accessories"><span class="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.2 13.6 8 18.4 9.6 13.6 11.2 12 16l-1.6-4.8L5.6 9.6 10.4 8Z"/><path d="M17.6 15.2l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"/></svg></span>Accessories</a></li>
          <li><a href="/shop.html?category=antiques"><span class="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="11" r="6.4"/><path d="M12 7.6V11l2.4 1.6"/><path d="M7.6 18.2 6.4 21M16.4 18.2 17.6 21"/></svg></span>Antiques</a></li>
          <li><a href="/shop.html?category=artificial-plants-garden-stool"><span class="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 12.4c0-3.2 2-5.6 5-6.2-.2 3.4-2.1 5.6-5 6.2Z"/><path d="M12 12.4C12 9.2 10 6.8 7 6.2c.2 3.4 2.1 5.6 5 6.2Z"/><path d="M12 12.4V16"/><path d="M7.4 16h9.2l-1 5H8.4Z"/></svg></span>Artificial Plants &amp; Garden Stool</a></li>
          <li><a href="/shop.html?category=wall-art-plates"><span class="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3.6" y="4.4" width="16.8" height="12.4" rx="1.4"/><path d="M6.4 14.2 10 10.4l2.6 2.6 2.6-3.2 2.4 4.4Z"/><path d="M8.4 20.4h7.2"/></svg></span>Wall Art &amp; Plates</a></li>
          <li><a href="/shop.html?category=murano-glass"><span class="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 3.6h6l-.8 4.2c1.9 1 3 2.9 3 5.1 0 3.3-2.3 5.7-5.2 5.7S6.8 16.2 6.8 12.9c0-2.2 1.1-4.1 3-5.1Z"/><path d="M8.4 21h7.2"/></svg></span>Murano Glass</a></li>
          <li><a href="/shop.html?category=furniture"><span class="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5.6 12V8.4a2 2 0 0 1 2-2h8.8a2 2 0 0 1 2 2V12"/><path d="M4 12.4h16v4.2H4z"/><path d="M5.6 16.6V20M18.4 16.6V20"/></svg></span>Furniture</a></li>
          <li><a href="/shop.html?category=sale"><span class="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4.4 11.6 11.6 4.4h7.2v7.2l-7.2 7.2Z"/><circle cx="15.4" cy="8.6" r="1.5"/></svg></span>Sale</a></li>
        </ul>
      </nav>

      <nav class="fcol fcol--care rv rv--up" data-rv style="--rd:.08s" aria-label="Customer care">
        <h2 class="fcol__title">Customer Care</h2>
        <ul class="fcol__list">
          <li><a href="#"><span class="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M2.8 6.6h11v9.2h-11z"/><path d="M13.8 9.6h4.4l3 3v3.2h-7.4z"/><circle cx="7.2" cy="18.4" r="2"/><circle cx="17.4" cy="18.4" r="2"/></svg></span>Shipping &amp; Delivery</a></li>
          <li><a href="#"><span class="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4.4 9.6A8 8 0 1 1 4 13.4"/><polyline points="4.2,4.6 4.2,9.8 9.4,9.8"/></svg></span>Returns &amp; Exchanges</a></li>
          <li><a href="#"><span class="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.4 20.4 7.6v8.8L12 20.6 3.6 16.4V7.6Z"/><polyline points="3.6,7.6 12,11.8 20.4,7.6"/><line x1="12" y1="11.8" x2="12" y2="20.6"/></svg></span>Track Your Order</a></li>
          <li><a href="https://wa.me/201105288355" target="_blank" rel="noopener noreferrer"><span class="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8.2 4.4H6a2.2 2.2 0 0 0-2.2 2.2c0 7.4 5.8 13.2 13.2 13.2a2.2 2.2 0 0 0 2.2-2.2v-2l-4-1.5-1.8 1.8a12.4 12.4 0 0 1-5.1-5.1L10 8.8Z"/></svg></span>Contact Us</a></li>
          <li><a href="#"><span class="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.4 19.6 6v6.2c0 4.8-3.2 8-7.6 9.4-4.4-1.4-7.6-4.6-7.6-9.4V6Z"/><polyline points="9,12.2 11.2,14.4 15.2,10"/></svg></span>Privacy Policy</a></li>
          <li><a href="#"><span class="fcol__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 3.4h8.4l4 4v13.2H6Z"/><polyline points="14.2,3.6 14.2,7.6 18.2,7.6"/><line x1="8.8" y1="12" x2="15.4" y2="12"/><line x1="8.8" y1="15.6" x2="13.4" y2="15.6"/></svg></span>Terms &amp; Conditions</a></li>
        </ul>
      </nav>

      <div class="fcol fcol--news rv rv--up" data-rv style="--rd:.16s">
        <h2 class="fcol__title">Newsletter</h2>
        <p class="fnews__text">Stay inspired with new<br />arrivals, stories &amp; offers.</p>
        <form class="fnews" id="footForm">
          <input id="footEmail" type="email" name="email" autocomplete="email" placeholder="Enter your email" aria-label="Your email address" required />
          <button type="submit" aria-label="Subscribe">
            <svg viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="21" y2="6"></line><polyline points="16.4,1.6 21.4,6 16.4,10.4"></polyline></svg>
          </button>
        </form>
        <p class="fnews__note" id="footNote" role="status" aria-live="polite"></p>
      </div>
    </div>

    <div class="fvisit rv rv--up" data-rv>
      <a class="fvisit__inner" href="${MAPS_URL}" target="_blank" rel="noopener noreferrer">
        <span class="fvisit__ico" aria-hidden="true">
          <svg viewBox="0 0 32 32"><path d="M16 3.4c-5.6 0-10 4.4-10 10 0 7.4 10 15.2 10 15.2s10-7.8 10-15.2c0-5.6-4.4-10-10-10Z"/><circle cx="16" cy="13.4" r="3.6"/></svg>
        </span>
        <span class="fvisit__copy">
          <span class="fvisit__label">Visit Our Showroom</span>
          <span class="fvisit__addr">El Nozha, Taha Hussein St. — 2 Mahmoud Haridy</span>
        </span>
        <span class="fvisit__cta">
          <span>Get Directions</span>
          <svg viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
        </span>
      </a>
    </div>

    <div class="fbar">
      <ul class="fbar__list">
        <li class="fbar__item rv rv--up" data-rv>
          <span class="fbar__ico" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M2.6 8.4h14v12.8h-14z"/><path d="M16.6 12.4h6.6l4.2 4.2v4.6h-10.8z"/><circle cx="9.2" cy="24" r="2.6"/><circle cx="22.6" cy="24" r="2.6"/></svg></span>
          <div class="fbar__copy"><h3>Worldwide Delivery</h3><p>Bringing timeless pieces<br />to your door.</p></div>
        </li>
        <li class="fbar__item rv rv--up" data-rv style="--rd:.08s">
          <span class="fbar__ico" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 3.4 27 7.6v8.2c0 6.6-4.5 11-11 13.2C9.5 26.8 5 22.4 5 15.8V7.6Z"/><polyline points="11.4,16.2 14.8,19.6 21,12.6"/></svg></span>
          <div class="fbar__copy"><h3>Secure Payments</h3><p>Your transactions are<br />100% protected.</p></div>
        </li>
        <li class="fbar__item fbar__item--social rv rv--up" data-rv style="--rd:.16s">
          <ul class="fsocial">
            <li><a href="https://www.instagram.com/antique_home111?igsi=MXQ1eWdvbGRsb2pvaA==" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <defs><radialGradient id="fIg" cx="30%" cy="107%" r="150%"><stop offset="0%" stop-color="#FDF497"/><stop offset="5%" stop-color="#FDF497"/><stop offset="45%" stop-color="#FD5949"/><stop offset="60%" stop-color="#D6249F"/><stop offset="90%" stop-color="#285AEB"/></radialGradient></defs>
                <rect x="2" y="2" width="20" height="20" rx="5.6" fill="url(#fIg)"/>
                <rect x="5.6" y="5.6" width="12.8" height="12.8" rx="3.9" fill="none" stroke="#fff" stroke-width="1.5"/>
                <circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" stroke-width="1.5"/>
                <circle cx="17.1" cy="6.9" r="1.15" fill="#fff"/>
              </svg></a></li>
            <li class="fsocial__fb" style="display:none"><a href="#" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="11" fill="#1877F2"/>
                <path fill="#fff" d="M15.1 12.7h-2.1V20h-3v-7.3H8.6v-2.6h1.4V8.7c0-1.9 1-3 3.3-3h2v2.6h-1.3c-.9 0-1 .3-1 1v1.2h2.4l-.3 2.6Z"/>
              </svg></a></li>
            <li><a href="#" aria-label="Email us">
              <svg viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#4caf50" d="M45 16.2l-5 2.75-5 4.75L35 40h7c1.657 0 3-1.343 3-3V16.2z"/>
                <path fill="#1e88e5" d="M3 16.2l3.614 1.71L13 23.7V40H6c-1.657 0-3-1.343-3-3V16.2z"/>
                <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"/>
                <path fill="#c62828" d="M3 12.298V16.2l10 7.5V11.2L9.876 8.859A4.298 4.298 0 0 0 7.298 8h0A4.298 4.298 0 0 0 3 12.298z"/>
                <path fill="#fbc02d" d="M45 12.298V16.2l-10 7.5V11.2l3.124-2.341A4.298 4.298 0 0 1 40.702 8h0A4.298 4.298 0 0 1 45 12.298z"/>
              </svg></a></li>
            <li><a href="${MAPS_URL}" target="_blank" rel="noopener noreferrer" aria-label="Find us on Google Maps">
              <svg viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#4285F4" d="M24 46s-3.9-5-7.3-10.2h14.6C27.9 41 24 46 24 46z"/>
                <path fill="#34A853" d="M11.9 28.7C10 25.6 8.8 22.6 8.8 19.6c0-2.9.9-5.6 2.5-7.8l11.1 9.4-10.5 7.5z"/>
                <path fill="#FBBC04" d="M36.1 28.7c1.9-3.1 3.1-6.1 3.1-9.1 0-2.9-.9-5.6-2.5-7.8l-11.1 9.4 10.5 7.5z"/>
                <path fill="#EA4335" d="M24 2c5.2 0 9.8 2.7 12.4 6.8L24 19.6 11.6 8.8C14.2 4.7 18.8 2 24 2z"/>
                <circle cx="24" cy="19.6" r="5.5" fill="#fff"/>
              </svg></a></li>
            <li><a href="https://wa.me/201105288355" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#25D366" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413"/>
              </svg></a></li>
          </ul>
        </li>
        <li class="fbar__item rv rv--up" data-rv style="--rd:.24s">
          <span class="fbar__ico" aria-hidden="true"><svg viewBox="0 0 32 32"><circle cx="16" cy="13" r="8"/><polyline points="12.4,13.2 15,15.8 19.6,10.6"/><path d="M11.4 19.6 9.2 29l6.8-3.4 6.8 3.4-2.2-9.4"/></svg></span>
          <div class="fbar__copy"><h3>Quality Guaranteed</h3><p>Thoughtfully curated pieces<br />that last a lifetime.</p></div>
        </li>
      </ul>
    </div>

    <div class="fsign rv" data-rv>
      <i class="fsign__rule" aria-hidden="true"></i>
      <span class="fsign__label">Powered by</span> <a class="fsign__name" href="https://kreemaly.com" target="_blank" rel="noopener noreferrer">kreemaly</a>
      <i class="fsign__rule" aria-hidden="true"></i>
    </div>

    <p class="fcopy rv" data-rv style="--rd:.08s">© 2025 Antique Home. All rights reserved.</p>
  </div>
</footer>

<div class="sidemenu" id="sideMenuWrap" aria-hidden="true">
  <button class="sidemenu__scrim" id="sideScrim" type="button" tabindex="-1" aria-label="Close menu"></button>

  <nav class="sidemenu__panel" id="sideMenu" aria-label="Main menu">
    <div class="sm__head">
      <a class="sm__brand" href="/" aria-label="Antique Home — Vase &amp; Decor">
        <img src="/footer/logo-footer.png" alt="Antique Home — Vase &amp; Decor" />
      </a>
      <button class="sm__close" type="button" id="sideClose" aria-label="Close menu">
        <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="4.6" y1="4.6" x2="19.4" y2="19.4"></line><line x1="19.4" y1="4.6" x2="4.6" y2="19.4"></line></svg>
      </button>
    </div>

    <span class="sm__gem" aria-hidden="true"></span>

    <ul class="sm__nav">
      <li class="sm__item">
        <a href="/">
          <span class="sm__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 11.4 12 4.6l8 6.8"></path><path d="M6 10v9.4h12V10"></path><path d="M10 19.4v-6h4v6"></path></svg></span>
          <span class="sm__label">Home</span>
        </a>
      </li>
      <li class="sm__item">
        <a href="/shop.html">
          <span class="sm__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3.6" y="3.6" width="7.2" height="7.2" rx="1"/><rect x="13.2" y="3.6" width="7.2" height="7.2" rx="1"/><rect x="3.6" y="13.2" width="7.2" height="7.2" rx="1"/><rect x="13.2" y="13.2" width="7.2" height="7.2" rx="1"/></svg></span>
          <span class="sm__label">Shop Now</span>
        </a>
      </li>
      <li class="sm__item">
        <a href="/shop.html?category=bleu-blanc">
          <span class="sm__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9.4 4.4h5.2l-.5 2.1a6.6 6.6 0 0 1 4 6.1c0 3.6-2.7 6.4-6.1 6.4s-6.1-2.8-6.1-6.4a6.6 6.6 0 0 1 4-6.1Z"/></svg></span>
          <span class="sm__label">Bleu Blanc</span>
          <svg class="sm__chev" viewBox="0 0 12 20" aria-hidden="true"><polyline points="2,2 10,10 2,18"></polyline></svg>
        </a>
      </li>
      <li class="sm__item">
        <a href="/shop.html?category=lighting">
          <span class="sm__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.4v3.2"/><path d="M4.6 13.4 12 6.6l7.4 6.8Z"/><path d="M8.4 13.4v2.4M12 13.4v3.6M15.6 13.4v2.4"/></svg></span>
          <span class="sm__label">Lighting</span>
          <svg class="sm__chev" viewBox="0 0 12 20" aria-hidden="true"><polyline points="2,2 10,10 2,18"></polyline></svg>
        </a>
      </li>
      <li class="sm__item sm__item--expand" id="smAccessories">
        <div class="sm__row">
          <a class="sm__link" href="/shop.html?category=accessories">
            <span class="sm__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.2 13.6 8 18.4 9.6 13.6 11.2 12 16l-1.6-4.8L5.6 9.6 10.4 8Z"/><path d="M17.6 15.2l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"/></svg></span>
            <span class="sm__label">Accessories</span>
          </a>
          <button type="button" class="sm__plus" aria-expanded="false" aria-controls="smAccessoriesSub" aria-label="Show Accessories subcategories">
            <svg viewBox="0 0 16 16" aria-hidden="true"><line x1="8" y1="2" x2="8" y2="14"></line><line x1="2" y1="8" x2="14" y2="8"></line></svg>
          </button>
        </div>
        <div class="sm__sub-wrap" id="smAccessoriesSub">
          <ul class="sm__sub">
            <li><a href="/shop.html?category=colored-vases">Colored Vases</a></li>
            <li><a href="/shop.html?category=candle-holder">Candle Holder</a></li>
            <li><a href="/shop.html?category=raisin">Raisin</a></li>
            <li><a href="/shop.html?category=tissue-box">Tissue Box</a></li>
            <li><a href="/shop.html?category=ashtray">Ashtray</a></li>
            <li><a href="/shop.html?category=photo-frame">Photo Frame</a></li>
          </ul>
        </div>
      </li>
      <li class="sm__item">
        <a href="/shop.html?category=antiques">
          <span class="sm__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="11" r="6.4"/><path d="M12 7.6V11l2.4 1.6"/><path d="M7.6 18.2 6.4 21M16.4 18.2 17.6 21"/></svg></span>
          <span class="sm__label">Antiques</span>
          <svg class="sm__chev" viewBox="0 0 12 20" aria-hidden="true"><polyline points="2,2 10,10 2,18"></polyline></svg>
        </a>
      </li>
      <li class="sm__item">
        <a href="/shop.html?category=artificial-plants-garden-stool">
          <span class="sm__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 12.4c0-3.2 2-5.6 5-6.2-.2 3.4-2.1 5.6-5 6.2Z"/><path d="M12 12.4C12 9.2 10 6.8 7 6.2c.2 3.4 2.1 5.6 5 6.2Z"/><path d="M12 12.4V16"/><path d="M7.4 16h9.2l-1 5H8.4Z"/></svg></span>
          <span class="sm__label">Artificial Plants &amp; Garden Stool</span>
          <svg class="sm__chev" viewBox="0 0 12 20" aria-hidden="true"><polyline points="2,2 10,10 2,18"></polyline></svg>
        </a>
      </li>
      <li class="sm__item">
        <a href="/shop.html?category=wall-art-plates">
          <span class="sm__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3.6" y="4.4" width="16.8" height="12.4" rx="1.4"/><path d="M6.4 14.2 10 10.4l2.6 2.6 2.6-3.2 2.4 4.4Z"/><path d="M8.4 20.4h7.2"/></svg></span>
          <span class="sm__label">Wall Art &amp; Plates</span>
          <svg class="sm__chev" viewBox="0 0 12 20" aria-hidden="true"><polyline points="2,2 10,10 2,18"></polyline></svg>
        </a>
      </li>
      <li class="sm__item">
        <a href="/shop.html?category=murano-glass">
          <span class="sm__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 3.6h6l-.8 4.2c1.9 1 3 2.9 3 5.1 0 3.3-2.3 5.7-5.2 5.7S6.8 16.2 6.8 12.9c0-2.2 1.1-4.1 3-5.1Z"/><path d="M8.4 21h7.2"/></svg></span>
          <span class="sm__label">Murano Glass</span>
          <svg class="sm__chev" viewBox="0 0 12 20" aria-hidden="true"><polyline points="2,2 10,10 2,18"></polyline></svg>
        </a>
      </li>
      <li class="sm__item">
        <a href="/shop.html?category=furniture">
          <span class="sm__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5.6 12V8.4a2 2 0 0 1 2-2h8.8a2 2 0 0 1 2 2V12"/><path d="M4 12.4h16v4.2H4z"/><path d="M5.6 16.6V20M18.4 16.6V20"/></svg></span>
          <span class="sm__label">Furniture</span>
          <svg class="sm__chev" viewBox="0 0 12 20" aria-hidden="true"><polyline points="2,2 10,10 2,18"></polyline></svg>
        </a>
      </li>
      <li class="sm__item">
        <a href="/shop.html?category=sale">
          <span class="sm__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4.4 11.6 11.6 4.4h7.2v7.2l-7.2 7.2Z"/><circle cx="15.4" cy="8.6" r="1.5"/></svg></span>
          <span class="sm__label">Sale</span>
          <svg class="sm__chev" viewBox="0 0 12 20" aria-hidden="true"><polyline points="2,2 10,10 2,18"></polyline></svg>
        </a>
      </li>
    </ul>

    <span class="sm__rule" aria-hidden="true"></span>

    <div class="sm__toggle">
      <span class="sm__toggle-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.4"/><path d="M3.6 12h16.8"/><path d="M12 3.6a13 13 0 0 1 0 16.8M12 3.6a13 13 0 0 0 0 16.8"/></svg></span>
      <span class="sm__toggle-label">Language</span>
      <div class="sm__switch" role="group" aria-label="Language">
        <button type="button" class="sm__opt is-active" data-lang="en">EN</button>
        <button type="button" class="sm__opt" data-lang="ar">AR</button>
      </div>
    </div>

    <div class="sm__toggle">
      <span class="sm__toggle-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.4"/><path d="M12 7.2v9.6"/><path d="M14.6 9.4a2.8 2.8 0 0 0-2.6-1.4c-1.7 0-2.8.9-2.8 2s1 1.7 2.8 2c1.8.3 2.8.9 2.8 2s-1.1 2-2.8 2a2.9 2.9 0 0 1-2.7-1.4"/></svg></span>
      <span class="sm__toggle-label">Currency</span>
      <div class="sm__switch" role="group" aria-label="Currency">
        <button type="button" class="sm__opt is-active" data-currency="egp">EGP</button>
        <button type="button" class="sm__opt" data-currency="usd">USD</button>
      </div>
    </div>

    <span class="sm__rule" aria-hidden="true"></span>

    <ul class="sm__social">
      <li><a href="https://www.instagram.com/antique_home111?igsi=MXQ1eWdvbGRsb2pvaA==" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <defs><radialGradient id="smIg" cx="30%" cy="107%" r="150%"><stop offset="0%" stop-color="#FDF497"/><stop offset="5%" stop-color="#FDF497"/><stop offset="45%" stop-color="#FD5949"/><stop offset="60%" stop-color="#D6249F"/><stop offset="90%" stop-color="#285AEB"/></radialGradient></defs>
          <rect x="2" y="2" width="20" height="20" rx="5.6" fill="url(#smIg)"/>
          <rect x="5.6" y="5.6" width="12.8" height="12.8" rx="3.9" fill="none" stroke="#fff" stroke-width="1.5"/>
          <circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" stroke-width="1.5"/>
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
      <li><a href="${MAPS_URL}" target="_blank" rel="noopener noreferrer" aria-label="Find us on Google Maps">
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#4285F4" d="M24 46s-3.9-5-7.3-10.2h14.6C27.9 41 24 46 24 46z"/>
          <path fill="#34A853" d="M11.9 28.7C10 25.6 8.8 22.6 8.8 19.6c0-2.9.9-5.6 2.5-7.8l11.1 9.4-10.5 7.5z"/>
          <path fill="#FBBC04" d="M36.1 28.7c1.9-3.1 3.1-6.1 3.1-9.1 0-2.9-.9-5.6-2.5-7.8l-11.1 9.4 10.5 7.5z"/>
          <path fill="#EA4335" d="M24 2c5.2 0 9.8 2.7 12.4 6.8L24 19.6 11.6 8.8C14.2 4.7 18.8 2 24 2z"/>
          <circle cx="24" cy="19.6" r="5.5" fill="#fff"/>
        </svg></a></li>
      <li><a href="https://wa.me/201105288355" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#25D366" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413"/>
        </svg></a></li>
    </ul>

    <p class="sm__credit"><span class="sm__credit-label">Powered by</span> <a class="sm__credit-name" href="https://kreemaly.com" target="_blank" rel="noopener noreferrer">kreemaly</a></p>
  </nav>
</div>

<div class="drawer" id="cartDrawerWrap" aria-hidden="true">
  <button class="drawer__scrim" id="cartScrim" type="button" tabindex="-1" aria-label="Close cart"></button>

  <aside class="drawer__panel drawer__panel--cart" id="cartDrawer" aria-label="Your cart">
    <div class="drawer__scroll">
      <div class="dw__head">
        <h2 class="dw__title">
          Your Cart
          <span class="dw__spark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2 14 10 22 12 14 14 12 22 10 14 2 12 10 10Z"></path></svg></span>
        </h2>
        <button class="dw__close" type="button" id="cartClose" aria-label="Close cart">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.4"></circle><line x1="8.8" y1="8.8" x2="15.2" y2="15.2"></line><line x1="15.2" y1="8.8" x2="8.8" y2="15.2"></line></svg>
        </button>
      </div>

      <span class="ornament dw__ornament" aria-hidden="true"><i></i><b></b><i></i></span>

      <p class="dw__sub" id="cartCount">Your cart is empty</p>

      <div class="ship">
        <div class="ship__row">
          <span class="ship__ico" aria-hidden="true">
            <svg viewBox="0 0 32 32"><path d="M2.6 8.4h14v12.8h-14z"></path><path d="M16.6 12.4h6.6l4.2 4.2v4.6h-10.8z"></path><circle cx="9.2" cy="24" r="2.6"></circle><circle cx="22.6" cy="24" r="2.6"></circle></svg>
          </span>
          <p class="ship__text" id="shipText">You are <strong>EGP 15,000</strong> away from free shipping</p>
          <span class="ship__goal">Free Shipping<br /><strong>EGP 15,000</strong></span>
        </div>
        <div class="ship__bar"><span class="ship__fill" id="shipFill" style="width:0%"></span></div>
      </div>

      <ul class="citems" id="cartItems"></ul>

      <p class="citems__empty" id="cartEmpty">Your cart is empty — time to discover something timeless.</p>

      <div class="promo" style="display:none">
        <button class="promo__row" type="button" id="promoToggle" aria-expanded="false" aria-controls="promoBody">
          <span class="promo__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4.6 12.4V6a1.4 1.4 0 0 1 1.4-1.4h6.4l8 8-7.8 7.8-8-8Z"></path><circle cx="9" cy="9" r="1.5"></circle></svg></span>
          <span class="promo__label">Add Promo Code</span>
          <svg class="promo__chev" viewBox="0 0 12 8" aria-hidden="true"><polyline points="1,1.5 6,6.5 11,1.5"></polyline></svg>
        </button>
        <div class="promo__wrap" id="promoBody">
          <form class="promo__form" id="promoForm">
            <input type="text" id="promoInput" placeholder="Enter promo code" aria-label="Promo code" autocomplete="off" />
            <button type="submit">Apply</button>
          </form>
          <p class="promo__note" id="promoNote" role="status" aria-live="polite"></p>
        </div>
      </div>

      <div class="summary" style="display:none">
        <div class="summary__row"><span>Subtotal</span><span id="sumSubtotal">EGP 0</span></div>
        <div class="summary__row"><span>Shipping</span><span id="sumShipping">EGP 0</span></div>
        <div class="summary__total">
          <span>Total<small>Including VAT</small></span>
          <strong id="sumTotal">EGP 0</strong>
        </div>
      </div>

      <a class="dw-btn dw-btn--dark" href="/checkout.html" id="checkoutBtn" style="display:none">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.6 7.8h12.8l1 12.4H4.6z"></path><path d="M8.9 9.6V6.6a3.1 3.1 0 0 1 6.2 0v3"></path></svg>
        <span>Proceed to Checkout</span>
      </a>

      <ul class="dw-trust">
        <li><span class="dw-trust__ico" aria-hidden="true"><svg viewBox="0 0 32 32"><rect x="6.4" y="14" width="19.2" height="14" rx="2.4"></rect><path d="M10.8 14V10a5.2 5.2 0 0 1 10.4 0v4"></path><circle cx="16" cy="21" r="1.6"></circle></svg></span><span>Secure<br />Payment</span></li>
        <li><span class="dw-trust__ico" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 3.4 27 7.6v8.2c0 6.6-4.5 11-11 13.2C9.5 26.8 5 22.4 5 15.8V7.6Z"></path><polyline points="11.4,16.2 14.8,19.6 21,12.6"></polyline></svg></span><span>Premium<br />Quality</span></li>
        <li><span class="dw-trust__ico" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M4.4 9.8A12 12 0 1 1 4 16"></path><polyline points="4.4,4.2 4.4,9.8 10,9.8"></polyline></svg></span><span>Easy<br />Returns</span></li>
        <li><span class="dw-trust__ico" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M6 17v-2a10 10 0 0 1 20 0v2"></path><rect x="4.4" y="17" width="6" height="8" rx="2"></rect><rect x="21.6" y="17" width="6" height="8" rx="2"></rect><path d="M26 25v1.4a3 3 0 0 1-3 3h-4.6"></path></svg></span><span>24/7<br />Support</span></li>
      </ul>
    </div>
  </aside>
</div>

<div class="drawer" id="searchDrawerWrap" aria-hidden="true">
  <button class="drawer__scrim" id="searchScrim" type="button" tabindex="-1" aria-label="Close search"></button>

  <aside class="drawer__panel drawer__panel--search" id="searchDrawer" aria-label="Search">
    <div class="drawer__scroll">
      <div class="dw__head">
        <h2 class="dw__title">
          Search
          <span class="dw__spark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2 14 10 22 12 14 14 12 22 10 14 2 12 10 10Z"></path></svg></span>
        </h2>
        <button class="dw__close" type="button" id="searchClose" aria-label="Close search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.4"></circle><line x1="8.8" y1="8.8" x2="15.2" y2="15.2"></line><line x1="15.2" y1="8.8" x2="8.8" y2="15.2"></line></svg>
        </button>
      </div>

      <p class="dw__sub">Find the pieces that speak to your space</p>

      <form class="sfield" id="searchForm" action="/shop.html">
        <svg class="sfield__ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.4"></circle><line x1="15.7" y1="15.7" x2="20.2" y2="20.2"></line></svg>
        <input type="text" id="searchInput" name="q" placeholder="Search for products, collections&hellip;" aria-label="Search for products or collections" autocomplete="off" />
        <button type="submit" aria-label="Search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 14 10 22 12 14 14 12 22 10 14 2 12 10 10Z"></path></svg>
        </button>
      </form>

      <p class="dw__label">Browse Categories</p>
      <div class="cats-row">
        <a class="cats-row__item" href="/shop.html?category=bleu-blanc">
          <span class="cats-row__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9.4 4.4h5.2l-.5 2.1a6.6 6.6 0 0 1 4 6.1c0 3.6-2.7 6.4-6.1 6.4s-6.1-2.8-6.1-6.4a6.6 6.6 0 0 1 4-6.1Z"/></svg></span>
          <span>Bleu Blanc</span>
        </a>
        <a class="cats-row__item" href="/shop.html?category=lighting">
          <span class="cats-row__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.4v3.2"/><path d="M4.6 13.4 12 6.6l7.4 6.8Z"/><path d="M8.4 13.4v2.4M12 13.4v3.6M15.6 13.4v2.4"/></svg></span>
          <span>Lighting</span>
        </a>
        <a class="cats-row__item" href="/shop.html?category=accessories">
          <span class="cats-row__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.2 13.6 8 18.4 9.6 13.6 11.2 12 16l-1.6-4.8L5.6 9.6 10.4 8Z"/><path d="M17.6 15.2l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"/></svg></span>
          <span>Accessories</span>
        </a>
        <a class="cats-row__item" href="/shop.html?category=antiques">
          <span class="cats-row__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="11" r="6.4"/><path d="M12 7.6V11l2.4 1.6"/><path d="M7.6 18.2 6.4 21M16.4 18.2 17.6 21"/></svg></span>
          <span>Antiques</span>
        </a>
        <a class="cats-row__item" href="/shop.html?category=murano-glass">
          <span class="cats-row__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 3.6h6l-.8 4.2c1.9 1 3 2.9 3 5.1 0 3.3-2.3 5.7-5.2 5.7S6.8 16.2 6.8 12.9c0-2.2 1.1-4.1 3-5.1Z"/><path d="M8.4 21h7.2"/></svg></span>
          <span>Murano Glass</span>
        </a>
        <a class="cats-row__item cats-row__item--all" href="/shop.html">
          <span class="cats-row__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3.6" y="3.6" width="7.2" height="7.2" rx="1"></rect><rect x="13.2" y="3.6" width="7.2" height="7.2" rx="1"></rect><rect x="3.6" y="13.2" width="7.2" height="7.2" rx="1"></rect><rect x="13.2" y="13.2" width="7.2" height="7.2" rx="1"></rect></svg></span>
          <span>All Categories</span>
        </a>
      </div>

      <span class="ornament dw__ornament" aria-hidden="true"><i></i><b></b><i></i></span>

      <div class="dw__labelRow">
        <p class="dw__label">Featured Results</p>
        <a class="link-arrow" href="/shop.html">
          <span>View all</span>
          <svg viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
        </a>
      </div>

      <p class="sresults__empty" style="padding:8px 0 20px;opacity:.7">New products are added regularly — check back soon.</p>

      <div class="dw-help">
        <span class="dw-help__spark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2 14 10 22 12 14 14 12 22 10 14 2 12 10 10Z"></path></svg></span>
        <div class="dw-help__copy">
          <h3>Can&rsquo;t find what you&rsquo;re looking for?</h3>
          <p>Our team is here to help you find the perfect piece.</p>
        </div>
        <a class="dw-btn dw-btn--gold" href="https://wa.me/201105288355" target="_blank" rel="noopener noreferrer">
          <span>Contact Us</span>
          <svg viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
        </a>
      </div>
    </div>
  </aside>
</div>

<a class="whatsapp-float" href="https://wa.me/201105288355" target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp">
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#fff" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413"/>
  </svg>
</a>

<audio id="bgMusic" src="/audio/ambient.mp3" loop preload="none"></audio>
<button class="music-toggle" type="button" id="musicToggle" aria-pressed="false" aria-label="Play ambient music">
  <svg class="music-toggle__off" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 6.6 15.2 3v18L9 17.4"></path>
    <path d="M9 6.6H4.4a1 1 0 0 0-1 1v8.8a1 1 0 0 0 1 1H9"></path>
    <line x1="18.6" y1="9" x2="22.2" y2="15"></line>
    <line x1="22.2" y1="9" x2="18.6" y2="15"></line>
  </svg>
  <svg class="music-toggle__on" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 6.6 15.2 3v18L9 17.4"></path>
    <path d="M9 6.6H4.4a1 1 0 0 0-1 1v8.8a1 1 0 0 0 1 1H9"></path>
    <path d="M18.4 8.4a5 5 0 0 1 0 7.2"></path>
    <path d="M20.8 6a8.4 8.4 0 0 1 0 12"></path>
  </svg>
</button>
`;

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  // Rewrites every hardcoded WhatsApp/Instagram/Facebook link on the page
  // (chrome + any page-specific ones, e.g. index.html's own CTA buttons)
  // with the admin-edited links from Marketing, when set. Matches by the
  // known default hrefs so it only touches actual social links, never an
  // unrelated wa.me-style URL a future page might add on purpose.
  const DEFAULT_WHATSAPP = "https://wa.me/201105288355";
  const DEFAULT_INSTAGRAM = "https://www.instagram.com/antique_home111?igsi=MXQ1eWdvbGRsb2pvaA==";

  async function applySocialLinks() {
    let social = null;
    try { social = await fetch("/api/settings?key=site_social", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)); } catch { social = null; }
    if (!social) return;
    if (social.whatsapp) {
      document.querySelectorAll(`a[href="${DEFAULT_WHATSAPP}"]`).forEach((a) => { a.href = social.whatsapp; });
    }
    if (social.instagram) {
      document.querySelectorAll(`a[href="${DEFAULT_INSTAGRAM}"]`).forEach((a) => { a.href = social.instagram; });
    }
    if (social.facebook) {
      document.querySelectorAll('.fsocial__fb').forEach((li) => {
        li.style.display = "";
        const a = li.querySelector("a");
        if (a) a.href = social.facebook;
      });
    }
  }

  // When Marketing's announcement bar is turned on, its text replaces
  // whatever this page's own .promo-bar ticker says (both looped spans,
  // so the seamless-scroll effect still works); left alone when it's off.
  async function applyAnnouncement() {
    let ann = null;
    try { ann = await fetch("/api/settings?key=site_announcement", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)); } catch { ann = null; }
    if (!ann || !ann.active || !ann.text) return;
    document.querySelectorAll(".promo-bar__text span").forEach((span) => { span.textContent = ann.text; });
  }

  ready(function () {
    const slot = document.getElementById("chromeSlot");
    if (slot) slot.outerHTML = CHROME_HTML;
    applySocialLinks();
    applyAnnouncement();
  });
})();
