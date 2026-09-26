/* =========================================================
   ANTIQUE HOME — hero behaviour
   · serves the portrait cut on phones, the 16:9 cut on laptop
   · keeps autoplay alive on iOS / Safari
   ========================================================= */

(function () {
  'use strict';

  var video   = document.getElementById('heroVideo');
  if (!video) return;

  var SOURCES = {
    mobile:  'hero video mop.mp4',   // 720 × 1280 — portrait
    desktop: 'hero vedio lab.mp4'    // 1920 × 1080 — landscape
  };

  var wide    = window.matchMedia('(min-width: 900px)');
  // the HTML already ships with the mobile cut wired into `src`, so it
  // starts fetching and painting immediately — no gap before the first
  // frame. Only swap the file when the desktop cut is actually needed.
  var current = 'mobile';

  function play() {
    var p = video.play();
    if (p && typeof p.catch === 'function') p.catch(function () { /* blocked — retry on interaction */ });
  }

  function loadSource() {
    var key = wide.matches ? 'desktop' : 'mobile';
    if (key === current) return;
    current = key;

    video.src = SOURCES[key];
    video.load();
    play();
  }

  play();
  loadSource();

  // swap the cut only when the breakpoint is actually crossed
  if (typeof wide.addEventListener === 'function') {
    wide.addEventListener('change', loadSource);
  } else if (typeof wide.addListener === 'function') {
    wide.addListener(loadSource);
  }

  // iOS suspends playback on tab/app switch — resume quietly
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && video.paused) play();
  });

  ['touchstart', 'click'].forEach(function (evt) {
    document.addEventListener(evt, function once() {
      if (video.paused) play();
      document.removeEventListener(evt, once);
    }, { passive: true });
  });
})();


/* =========================================================
   SECTIONS 02 – 05
   ========================================================= */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- shared body scroll lock -------------------------------------------
     A counter, not a flag: the side menu and a drawer (cart/search) can
     legitimately be open at the same time, and the second one closing
     must not unlock the page while the first is still open. */
  var lockCount = 0;
  function lockScroll() {
    lockCount++;
    document.body.style.overflow = 'hidden';
  }
  function unlockScroll() {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) document.body.style.overflow = '';
  }

  /* ---- scroll reveal ---------------------------------------------------- */

  var targets = document.querySelectorAll('[data-rv]');

  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(targets, function (el) { el.classList.add('in'); });
  } else {
    var pending = Array.prototype.slice.call(targets);

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

    pending.forEach(function (el) { io.observe(el); });

    function reveal(el) {
      el.classList.add('in');
      io.unobserve(el);                       // reveal once, then stop watching
      var i = pending.indexOf(el);
      if (i > -1) pending.splice(i, 1);
      if (!pending.length) stopFallback();
    }

    // Safety net: if a notification is ever missed, a scroll-time geometry
    // check still reveals what is on screen. It retires itself as soon as
    // every target has been revealed, so it costs nothing thereafter.
    var last = 0;

    function sweep() {
      var limit = window.innerHeight * 0.9;
      for (var i = pending.length - 1; i >= 0; i--) {
        var r = pending[i].getBoundingClientRect();
        if (r.top < limit && r.bottom > 0) reveal(pending[i]);
      }
    }

    // time-throttled rather than rAF-throttled, so a busy frame can never
    // starve it; `pending` only shrinks, so the work trends to nothing
    function onScroll() {
      var now = Date.now();
      if (now - last < 90) return;
      last = now;
      sweep();
    }

    function stopFallback() {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  /* ---- product rail arrows ---------------------------------------------- */

  var rail = document.getElementById('productRail');
  var prev = document.querySelector('[data-rail="prev"]');
  var next = document.querySelector('[data-rail="next"]');

  if (rail && prev && next) {
    function step() {
      var card = rail.querySelector('.card');
      if (!card) return rail.clientWidth * 0.8;
      var gap = parseFloat(getComputedStyle(rail).columnGap) || 14;
      return card.getBoundingClientRect().width + gap;
    }

    var nav = prev.parentElement;

    function sync() {
      // when every card already fits there is nothing to page through
      var slack = rail.scrollWidth - rail.clientWidth;
      var idle  = slack < 4;
      nav.classList.toggle('idle', idle);
      prev.disabled = idle || rail.scrollLeft < 4;
      next.disabled = idle || rail.scrollLeft > slack - 4;
    }

    prev.addEventListener('click', function () {
      rail.scrollBy({ left: -step(), behavior: reduced ? 'auto' : 'smooth' });
    });
    next.addEventListener('click', function () {
      rail.scrollBy({ left: step(), behavior: reduced ? 'auto' : 'smooth' });
    });

    rail.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }

  /* ---- save / add to cart ----------------------------------------------- */

  function pop(el) {
    el.classList.remove('pop');
    void el.offsetWidth;                     // restart the keyframes
    el.classList.add('pop');
  }

  document.addEventListener('click', function (e) {
    var favBtn = e.target.closest ? e.target.closest('.fav') : null;
    if (favBtn) {
      var on = favBtn.getAttribute('aria-pressed') === 'true';
      favBtn.setAttribute('aria-pressed', on ? 'false' : 'true');
      if (!on && !reduced) pop(favBtn);
      return;
    }

    var addBtn = e.target.closest ? e.target.closest('[data-add]') : null;
    if (addBtn) {
      var count = document.querySelector('.cart-btn__count');
      if (count) {
        count.textContent = String((parseInt(count.textContent, 10) || 0) + 1);
        if (!reduced) pop(count);
      }
      if (!reduced) pop(addBtn);
    }
  });

  /* ---- product cards: click the name or photo to open the product page --
     applies site-wide (shop grid cards, category grid cards, home arrivals
     rail + featured product) without needing every card's markup changed.
     Clicks on a button, a real link, or form control inside the card still
     do their own thing (fav, add-to-cart, swatches, etc). -------------- */

  document.addEventListener('click', function (e) {
    var card = e.target.closest ? e.target.closest('.pcard, .card, .feat') : null;
    if (!card) return;
    if (e.target.closest('button, a, input, select, textarea')) return;
    var link = card.getAttribute('data-href') || 'product.html';
    window.location.href = link;
  });

  /* ---- stay inspired : phone number ------------------------------------- */

  var form = document.getElementById('inspireForm');

  if (form) {
    var input = document.getElementById('inspirePhone');
    var note  = document.getElementById('inspireNote');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var digits = (input.value || '').replace(/[^\d]/g, '');

      if (digits.length < 8) {
        note.textContent = 'Please enter a valid phone number.';
        note.classList.add('err');
        input.focus();
        return;
      }

      note.textContent = 'Thank you — we will be in touch.';
      note.classList.remove('err');
      form.reset();
    });

    input.addEventListener('input', function () {
      if (note.textContent) {
        note.textContent = '';
        note.classList.remove('err');
      }
    });
  }

  /* ---- side menu ---------------------------------------------------------- */

  var menuBtn  = document.getElementById('menuBtn');
  var sideWrap = document.getElementById('sideMenuWrap');

  if (menuBtn && sideWrap) {
    var sideScrim = document.getElementById('sideScrim');
    var sideClose = document.getElementById('sideClose');
    var lastFocus = null;

    function openMenu() {
      lastFocus = document.activeElement;
      sideWrap.classList.add('is-open');
      sideWrap.setAttribute('aria-hidden', 'false');
      menuBtn.setAttribute('aria-expanded', 'true');
      lockScroll();
      if (sideClose) sideClose.focus();
      document.addEventListener('keydown', onKey);
    }

    function closeMenu() {
      sideWrap.classList.remove('is-open');
      sideWrap.setAttribute('aria-hidden', 'true');
      menuBtn.setAttribute('aria-expanded', 'false');
      unlockScroll();
      document.removeEventListener('keydown', onKey);
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
      else menuBtn.focus();
    }

    function onKey(e) {
      if (e.key === 'Escape') closeMenu();
    }

    menuBtn.addEventListener('click', openMenu);
    if (sideScrim) sideScrim.addEventListener('click', closeMenu);
    if (sideClose) sideClose.addEventListener('click', closeMenu);

    // a nav link click both navigates and tidies the menu away
    sideWrap.querySelectorAll('.sm__item a, .sm__sub a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });

    // Accessories (and any future item built the same way): the plus
    // toggles its subcategory list without closing the whole menu. The
    // open height is measured from the content itself (scrollHeight),
    // so it animates correctly regardless of how many subcategories
    // a given item ends up with.
    sideWrap.querySelectorAll('.sm__item--expand').forEach(function (item) {
      var plus = item.querySelector('.sm__plus');
      var wrap = item.querySelector('.sm__sub-wrap');
      if (!plus || !wrap) return;

      function setOpen(open) {
        wrap.style.maxHeight = open ? wrap.scrollHeight + 'px' : '0px';
      }

      plus.addEventListener('click', function () {
        var open = item.classList.toggle('is-open');
        plus.setAttribute('aria-expanded', open ? 'true' : 'false');
        setOpen(open);
      });

      // a viewport resize (e.g. rotating the phone) can reflow the
      // subcategory text onto a different number of lines
      window.addEventListener('resize', function () {
        if (item.classList.contains('is-open')) setOpen(true);
      });
    });

    // language / currency pill switches
    sideWrap.querySelectorAll('.sm__switch').forEach(function (group) {
      group.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('.sm__opt') : null;
        if (!btn) return;
        group.querySelectorAll('.sm__opt').forEach(function (o) {
          o.classList.toggle('is-active', o === btn);
        });
      });
    });
  }

  /* ---- generic right-side drawer (cart / search) -------------------------- */

  function setupDrawer(triggerId, wrapId, scrimId, closeId) {
    var trigger = document.getElementById(triggerId);
    var wrap    = document.getElementById(wrapId);
    if (!trigger || !wrap) return null;

    var scrim     = document.getElementById(scrimId);
    var closeBtn  = document.getElementById(closeId);
    var lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      wrap.classList.add('is-open');
      wrap.setAttribute('aria-hidden', 'false');
      trigger.setAttribute('aria-expanded', 'true');
      lockScroll();
      if (closeBtn) closeBtn.focus();
      document.addEventListener('keydown', onKey);
    }

    function close() {
      wrap.classList.remove('is-open');
      wrap.setAttribute('aria-hidden', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      unlockScroll();
      document.removeEventListener('keydown', onKey);
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
      else trigger.focus();
    }

    function onKey(e) { if (e.key === 'Escape') close(); }

    trigger.addEventListener('click', open);
    if (scrim)    scrim.addEventListener('click', close);
    if (closeBtn) closeBtn.addEventListener('click', close);

    return { open: open, close: close };
  }

  var cartDrawer   = setupDrawer('cartBtn',   'cartDrawerWrap',   'cartScrim',   'cartClose');
  var searchDrawer = setupDrawer('searchBtn', 'searchDrawerWrap', 'searchScrim', 'searchClose');

  // any plain link inside a drawer (categories, "view all", contact, recently
  // viewed tiles) both navigates and tidies the drawer away
  document.querySelectorAll('.drawer__panel a[href]').forEach(function (a) {
    a.addEventListener('click', function () {
      var host = a.closest('.drawer');
      if (host === document.getElementById('cartDrawerWrap') && cartDrawer) cartDrawer.close();
      if (host === document.getElementById('searchDrawerWrap') && searchDrawer) searchDrawer.close();
    });
  });

  /* ---- cart: quantity, remove, live totals --------------------------------- */

  (function () {
    var list      = document.getElementById('cartItems');
    var empty     = document.getElementById('cartEmpty');
    var countLine = document.getElementById('cartCount');
    var shipEl    = document.querySelector('.ship');
    var shipText  = document.getElementById('shipText');
    var shipFill  = document.getElementById('shipFill');
    var sumSub    = document.getElementById('sumSubtotal');
    var sumShip   = document.getElementById('sumShipping');
    var sumTotal  = document.getElementById('sumTotal');
    var badge     = document.querySelector('.cart-btn__count');
    if (!list) return;

    var FREE_SHIPPING_AT = 15000;
    var SHIPPING_FEE     = 150;

    function money(n) { return 'EGP ' + n.toLocaleString('en-US'); }

    function recalc() {
      var items = Array.prototype.slice.call(list.querySelectorAll('.citem'));
      var subtotal = 0;
      var totalQty = 0;

      items.forEach(function (li) {
        var price = parseFloat(li.getAttribute('data-price')) || 0;
        var qty   = parseInt(li.getAttribute('data-qty'), 10) || 1;
        subtotal += price * qty;
        totalQty += qty;
        var lineEl = li.querySelector('.citem__price-num');
        if (lineEl) lineEl.textContent = (price * qty).toLocaleString('en-US');
      });

      if (badge) badge.textContent = String(totalQty);

      if (list) list.hidden = items.length === 0;
      if (empty) empty.hidden = items.length !== 0;
      document.querySelectorAll('.promo, .summary, .dw-btn--dark, .dw-btn--outline').forEach(function (el) {
        el.style.display = items.length === 0 ? 'none' : '';
      });

      if (countLine) {
        countLine.textContent = totalQty === 1 ? '1 item in your cart' : totalQty + ' items in your cart';
      }

      var qualifies = subtotal >= FREE_SHIPPING_AT;
      var pct = Math.max(0, Math.min(100, (subtotal / FREE_SHIPPING_AT) * 100));
      if (shipFill) shipFill.style.width = pct + '%';
      if (shipEl) shipEl.classList.toggle('is-full', qualifies);
      if (shipText) {
        shipText.innerHTML = qualifies
          ? 'You&rsquo;ve unlocked <strong>free shipping</strong>!'
          : 'You are <strong>' + money(FREE_SHIPPING_AT - subtotal) + '</strong> away from free shipping';
      }

      var shippingFee = qualifies ? 0 : SHIPPING_FEE;
      if (sumSub)   sumSub.textContent   = money(subtotal);
      if (sumShip)  sumShip.textContent  = shippingFee === 0 ? 'Free' : money(shippingFee);
      if (sumTotal) sumTotal.textContent = money(subtotal + shippingFee);
    }

    list.addEventListener('click', function (e) {
      var stepBtn = e.target.closest ? e.target.closest('.qty__btn') : null;
      if (stepBtn) {
        var li  = stepBtn.closest('.citem');
        var qty = parseInt(li.getAttribute('data-qty'), 10) || 1;
        var step = parseInt(stepBtn.getAttribute('data-step'), 10) || 0;
        qty = Math.max(1, Math.min(9, qty + step));
        li.setAttribute('data-qty', String(qty));
        var numEl = li.querySelector('.qty__num');
        if (numEl) numEl.textContent = String(qty);
        recalc();
        return;
      }

      var removeBtn = e.target.closest ? e.target.closest('.citem__remove') : null;
      if (removeBtn) {
        var row = removeBtn.closest('.citem');
        row.style.transition = 'opacity .35s ease, transform .35s ease';
        row.style.opacity = '0';
        row.style.transform = 'translateX(18px)';
        setTimeout(function () {
          row.remove();
          recalc();
        }, reduced ? 0 : 350);
      }
    });

    recalc();

    // the fill is already at its final width by the time anyone opens the
    // drawer (recalc runs at load, while the panel is off-screen) — replay
    // it from zero each time so the reveal is actually seen
    var cartBtn = document.getElementById('cartBtn');
    if (cartBtn && shipFill && !reduced) {
      cartBtn.addEventListener('click', function () {
        var target = shipFill.style.width;
        shipFill.style.transition = 'none';
        shipFill.style.width = '0%';
        void shipFill.offsetWidth;              // force reflow before re-enabling
        shipFill.style.transition = '';
        requestAnimationFrame(function () { shipFill.style.width = target; });
      });
    }
  })();

  /* ---- cart: promo code ----------------------------------------------------- */

  (function () {
    var toggle = document.getElementById('promoToggle');
    var wrap   = document.getElementById('promoBody');
    var form   = document.getElementById('promoForm');
    var input  = document.getElementById('promoInput');
    var note   = document.getElementById('promoNote');
    if (!toggle || !wrap) return;

    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      wrap.style.maxHeight = open ? wrap.scrollHeight + 'px' : '0px';
      if (open) setTimeout(function () { input && input.focus(); }, 200);
    });

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var value = (input.value || '').trim();
        if (!value) {
          note.textContent = 'Please enter a code.';
          note.classList.add('err');
          return;
        }
        note.textContent = 'Promo code applied — savings will show at checkout.';
        note.classList.remove('err');
      });
      input.addEventListener('input', function () {
        if (note.textContent) { note.textContent = ''; note.classList.remove('err'); }
      });
    }
  })();

  /* ---- cart: checkout / view cart (no live backend, closes tidily) --------- */

  (function () {
    var checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function () {
        // let the link navigate to checkout.html normally
        if (cartDrawer) cartDrawer.close();
      });
    }
    var viewCartBtn = document.getElementById('viewCartBtn');
    if (viewCartBtn) {
      viewCartBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (cartDrawer) cartDrawer.close();
      });
    }
  })();

  /* ---- search: field, pills, live filter, recently-viewed rail ------------- */

  (function () {
    var form    = document.getElementById('searchForm');
    var input   = document.getElementById('searchInput');
    var results = document.querySelectorAll('.sresult');
    if (!input) return;

    function applyFilter() {
      var q = input.value.trim().toLowerCase();
      results.forEach(function (li) {
        var name = (li.querySelector('.sresult__name') || {}).textContent || '';
        li.classList.toggle('is-hidden', q.length > 0 && name.toLowerCase().indexOf(q) === -1);
      });
    }

    input.addEventListener('input', applyFilter);
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); applyFilter(); });

    document.querySelectorAll('.pill-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        input.value = btn.textContent;
        applyFilter();
        input.focus();
      });
    });

    var rail = document.getElementById('recentRail');
    var next = document.getElementById('recentNext');
    if (rail && next) {
      next.addEventListener('click', function () {
        var tile = rail.querySelector('.recent__tile');
        var step = tile ? tile.getBoundingClientRect().width + 9 : 140;
        // loop back to the start once the rail is exhausted
        if (rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4) {
          rail.scrollTo({ left: 0, behavior: reduced ? 'auto' : 'smooth' });
        } else {
          rail.scrollBy({ left: step, behavior: reduced ? 'auto' : 'smooth' });
        }
      });
    }
  })();

  /* ---- footer newsletter ------------------------------------------------- */

  var fForm = document.getElementById('footForm');

  if (fForm) {
    var fInput = document.getElementById('footEmail');
    var fNote  = document.getElementById('footNote');

    fForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var value = (fInput.value || '').trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        fNote.textContent = 'Please enter a valid email address.';
        fNote.classList.add('err');
        fInput.focus();
        return;
      }

      fNote.textContent = 'Thank you — you are on the list.';
      fNote.classList.remove('err');
      fForm.reset();
    });

    fInput.addEventListener('input', function () {
      if (fNote.textContent) {
        fNote.textContent = '';
        fNote.classList.remove('err');
      }
    });
  }

  /* ---- section 05 film: keep it running, no controls --------------------- */

  var film = document.getElementById('journeyVideo');

  if (film) {
    var start = function () {
      var p = film.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    };

    start();

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && film.paused) start();
    });

    // some phones refuse autoplay until the page has been touched once
    ['touchstart', 'click'].forEach(function (evt) {
      document.addEventListener(evt, function once() {
        if (film.paused) start();
        document.removeEventListener(evt, once);
      }, { passive: true });
    });
  }
})();
