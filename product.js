/* =========================================================
   ANTIQUE HOME — PRODUCT DETAIL PAGE
   Gallery thumbs, color/size selection, quantity, accordions,
   add-to-cart. Loaded after script.js (shared header/drawer wiring).
   ========================================================= */

(function () {
  'use strict';

  var pdp = document.querySelector('.pdp');
  if (!pdp) return;

  /* ---------------------------------------------------------
     product catalog — used to cycle Prev / Next between the
     pieces shown on shop.html. Each entry's own thumbnail set
     reuses the same six gallery photos, only the main product
     shot (first thumb) changes per item.
     --------------------------------------------------------- */

  var CATALOG = [
    { name: 'Rustic Ceramic Vase', crumb: 'Rustic Ceramic Vase', badge: 'New Arrival', price: 'EGP 2,450', compare: 'EGP 3,100', off: '21% OFF', desc: 'A handcrafted ceramic vase with a natural, earthy texture that brings warmth and character to any space. Perfect for modern, classic, or rustic interiors.', img: 'sec 2/pic 11.jpeg' },
    { name: 'Marble Table Lamp', crumb: 'Marble Table Lamp', badge: 'Bestseller', price: 'EGP 5,900', compare: '', off: '', desc: 'A hand-carved marble base paired with a soft linen shade, casting a warm, ambient glow across any room.', img: 'sec 2/pic 33.png' },
    { name: 'Abstract Decor Sculpture', crumb: 'Abstract Decor Sculpture', badge: '', price: 'EGP 3,200', compare: '', off: '', desc: 'A sculptural stoneware form, hand-finished in a matte earth tone — a quiet centerpiece for any shelf or console.', img: 'sec 2/pic 66.png' },
    { name: 'Earth Tone Vase', crumb: 'Earth Tone Vase', badge: '', price: 'EGP 2,750', compare: '', off: '', desc: 'A rounded ceramic vase glazed in a warm earth tone, equally at home with fresh stems or standing alone.', img: 'sec 2/pic 44.png' },
    { name: 'Bouclé Accent Chair', crumb: 'Bouclé Accent Chair', badge: 'Bestseller', price: 'EGP 12,900', compare: '', off: '', desc: 'A curved silhouette upholstered in soft bouclé, finished with a solid wood base for lasting comfort.', img: 'sec 2/pic 55.png' },
    { name: 'Marble Decorative Tray', crumb: 'Marble Decorative Tray', badge: '', price: 'EGP 3,600', compare: '', off: '', desc: 'A honed marble tray with soft veining, ideal for styling candles, perfume, or a favourite trinket.', img: 'sec 2/pic 22.png' },
    { name: 'Organic Wall Mirror', crumb: 'Organic Wall Mirror', badge: '', price: 'EGP 6,800', compare: '', off: '', desc: 'An organically shaped mirror in a warm metal frame, bringing soft light and gentle movement to a wall.', img: 'sec 2/pic 77.png' },
    { name: 'Large Floor Vase', crumb: 'Large Floor Vase', badge: '', price: 'EGP 4,950', compare: 'EGP 5,950', off: '17% OFF', desc: 'A statement floor vase in hand-glazed ceramic, textured to catch the light from every angle.', img: 'sec 2/pic 11.jpeg' }
  ];

  var currentIndex = 0;

  function applyProduct(i) {
    var p = CATALOG[i];
    if (!p) return;
    currentIndex = i;

    setText('pdpCrumb', p.crumb);
    setText('pdpTitle', p.name);
    setText('pdpDesc', p.desc);
    setText('pdpEyebrow', p.badge || 'Featured');
    document.getElementById('pdpEyebrow').style.display = p.badge ? '' : 'none';

    setText('pdpPrice', p.price);
    var compareEl = document.getElementById('pdpCompare');
    var offEl = document.getElementById('pdpOff');
    if (compareEl) compareEl.style.display = p.compare ? '' : 'none';
    if (offEl) offEl.style.display = p.off ? '' : 'none';
    if (p.compare) setText('pdpCompare', p.compare);
    if (p.off) setText('pdpOff', p.off);

    setText('pdpAddPrice', p.price);
    var addBtn = document.getElementById('pdpAddToCart');
    if (addBtn) addBtn.setAttribute('data-add', p.name);

    var mainImg = document.getElementById('pdpMainImg');
    if (mainImg) mainImg.setAttribute('src', p.img);
    var firstThumb = document.querySelector('.pdp__thumb');
    if (firstThumb) {
      firstThumb.setAttribute('data-img', p.img);
      var thumbImg = firstThumb.querySelector('img');
      if (thumbImg) thumbImg.setAttribute('src', p.img);
    }
    document.querySelectorAll('.pdp__thumb').forEach(function (t, idx) {
      t.classList.toggle('is-active', idx === 0);
    });
    var indexEl = document.getElementById('pdpIndex');
    if (indexEl) indexEl.textContent = '01';

    document.title = p.name + ' — Antique Home';
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  var prevBtn = document.getElementById('pdpPrev');
  var nextBtn = document.getElementById('pdpNext');
  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      applyProduct((currentIndex - 1 + CATALOG.length) % CATALOG.length);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      applyProduct((currentIndex + 1) % CATALOG.length);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------------------------------------------------------
     gallery — thumbnail click swaps main image
     --------------------------------------------------------- */

  var mainImg = document.getElementById('pdpMainImg');
  var indexEl = document.getElementById('pdpIndex');
  var thumbs = Array.prototype.slice.call(document.querySelectorAll('.pdp__thumb'));

  thumbs.forEach(function (thumb, i) {
    thumb.addEventListener('click', function () {
      var src = thumb.getAttribute('data-img');
      if (mainImg && src) mainImg.setAttribute('src', src);
      thumbs.forEach(function (t) { t.classList.remove('is-active'); });
      thumb.classList.add('is-active');
      if (indexEl) indexEl.textContent = String(i + 1).padStart(2, '0');
    });
  });

  /* ---------------------------------------------------------
     zoom lightbox — click the zoom button or the main image
     --------------------------------------------------------- */

  var lightbox = document.getElementById('pdpLightbox');
  var lightboxImg = document.getElementById('pdpLightboxImg');
  var zoomBtn = document.querySelector('.pdp__zoom');

  function openLightbox() {
    if (!lightbox || !lightboxImg || !mainImg) return;
    lightboxImg.setAttribute('src', mainImg.getAttribute('src'));
    lightboxImg.setAttribute('alt', mainImg.getAttribute('alt') || '');
    lightbox.setAttribute('data-open', 'true');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.setAttribute('data-open', 'false');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (zoomBtn) zoomBtn.addEventListener('click', openLightbox);
  if (mainImg) mainImg.addEventListener('click', openLightbox);
  var lbScrim = document.getElementById('pdpLightboxScrim');
  var lbClose = document.getElementById('pdpLightboxClose');
  if (lbScrim) lbScrim.addEventListener('click', closeLightbox);
  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lightboxImg) lightboxImg.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });

  /* ---------------------------------------------------------
     color swatches
     --------------------------------------------------------- */

  var colorName = document.getElementById('pdpColorName');
  document.querySelectorAll('.pdp__swatch').forEach(function (sw) {
    sw.addEventListener('click', function () {
      document.querySelectorAll('.pdp__swatch').forEach(function (s) { s.classList.remove('is-active'); });
      sw.classList.add('is-active');
      if (colorName) colorName.textContent = sw.getAttribute('data-color') || '';
    });
  });

  /* ---------------------------------------------------------
     size selector
     --------------------------------------------------------- */

  document.querySelectorAll('.pdp__size').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.pdp__size').forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
    });
  });

  /* ---------------------------------------------------------
     quantity stepper
     --------------------------------------------------------- */

  var qtyNum = document.getElementById('pdpQtyNum');
  var minus = document.getElementById('pdpQtyMinus');
  var plus = document.getElementById('pdpQtyPlus');

  function getQty() { return parseInt((qtyNum && qtyNum.textContent) || '1', 10) || 1; }
  function setQty(n) { if (qtyNum) qtyNum.textContent = String(Math.max(1, n)); }

  if (minus) minus.addEventListener('click', function () { setQty(getQty() - 1); });
  if (plus) plus.addEventListener('click', function () { setQty(getQty() + 1); });

  /* ---------------------------------------------------------
     accordions
     --------------------------------------------------------- */

  document.querySelectorAll('.acc__head').forEach(function (head) {
    var body = head.nextElementSibling;
    head.addEventListener('click', function () {
      var open = head.getAttribute('aria-expanded') === 'true';
      head.setAttribute('aria-expanded', open ? 'false' : 'true');
      if (body) body.style.maxHeight = open ? '0px' : body.scrollHeight + 'px';
    });
  });

  /* ---------------------------------------------------------
     wishlist toggle
     --------------------------------------------------------- */

  var fav = document.getElementById('pdpFav');
  if (fav) {
    fav.addEventListener('click', function () {
      var pressed = fav.getAttribute('aria-pressed') === 'true';
      fav.setAttribute('aria-pressed', pressed ? 'false' : 'true');
    });
  }

  /* ---------------------------------------------------------
     add to cart — opens the cart drawer via the shared header
     wiring in script.js (dispatches a click on the hidden
     cartBtn's open logic through the same data-add hook used
     on shop cards, so cart count/summary stay in sync)
     --------------------------------------------------------- */

  var addBtn = document.getElementById('pdpAddToCart');
  if (addBtn) {
    addBtn.addEventListener('click', function () {
      addBtn.classList.add('pop');
      setTimeout(function () { addBtn.classList.remove('pop'); }, 400);
      var cartBtn = document.getElementById('cartBtn');
      if (cartBtn) cartBtn.click();
    });
  }

})();
