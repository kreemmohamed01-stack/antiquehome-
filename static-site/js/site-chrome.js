// Shared header/footer/drawer/menu wiring, ported from app/components/SiteChrome.tsx,
// HeroVideo.tsx, ProductRail's rail-nav bits, MusicPlayer.tsx and AboutStats.tsx.
// Depends on js/api.js having already run (Cart, fmtMoney, etc).
(function () {
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  function t(key, fallbackEn) {
    return window.AH_I18N ? window.AH_I18N.t(key, fallbackEn) : fallbackEn;
  }

  // ---- scroll reveal ----
  // Any element marked data-rv fades/slides into view the first time it
  // scrolls into the viewport (direction set by its rv--up/rv--left/
  // rv--zoom class, see sections.css). Exposed as window.AH_REVEAL so
  // pages that build their content in JS after this file's own ready()
  // pass (shop.js, product.js, checkout.js, order-confirmation.js) can
  // call AH_REVEAL.scan() once their markup exists, to pick up the
  // data-rv elements it just added — scan() is safe to call repeatedly,
  // it only ever observes elements it hasn't seen yet.
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let revealIo = null;
  function ensureRevealObserver() {
    if (revealIo || reduced || !("IntersectionObserver" in window)) return;
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
  function scanReveal(root) {
    const scope = root || document;
    const targets = Array.prototype.slice.call(scope.querySelectorAll("[data-rv]:not([data-rv-seen])"));
    if (!targets.length) return;
    if (reduced || !("IntersectionObserver" in window)) {
      targets.forEach((el) => { el.classList.add("in"); el.setAttribute("data-rv-seen", ""); });
      return;
    }
    ensureRevealObserver();
    targets.forEach((el) => {
      el.setAttribute("data-rv-seen", "");
      revealIo.observe(el);
    });
  }
  window.AH_REVEAL = { scan: scanReveal };

  // ---- instant navigation: prefetch on hover ----
  // Speculation Rules: when a visitor hovers (or starts tapping) an
  // internal link, the browser quietly downloads that page's HTML, so the
  // click itself feels instant. "prefetch" (not "prerender") on purpose —
  // it runs no JavaScript, so it never fires a fake page-view beacon or
  // plays the next page's scroll-reveal animations off-screen. Browsers
  // without support ignore the script tag entirely.
  (function speculate() {
    try {
      if (!HTMLScriptElement.supports || !HTMLScriptElement.supports("speculationrules")) return;
      const s = document.createElement("script");
      s.type = "speculationrules";
      s.textContent = JSON.stringify({
        prefetch: [{
          where: {
            and: [
              { href_matches: "/*" },
              { not: { href_matches: "/admin/*" } },
              { not: { href_matches: "/api/*" } },
              { not: { selector_matches: "[target=_blank], [download]" } },
            ],
          },
          eagerness: "moderate",
        }],
      });
      document.head.appendChild(s);
    } catch {}
  })();

  ready(function () {
    scanReveal(document);

    // ---- shared scroll lock ----
    let lockCount = 0;
    function lockScroll() {
      lockCount++;
      document.body.style.overflow = "hidden";
    }
    function unlockScroll() {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) document.body.style.overflow = "";
    }

    // ---- fav / add to cart pop ----
    function pop(el) {
      el.classList.remove("pop");
      void el.offsetWidth;
      el.classList.add("pop");
    }

    function onDocClick(e) {
      const target = e.target;
      const favBtn = target.closest && target.closest(".fav");
      if (favBtn) {
        const on = favBtn.getAttribute("aria-pressed") === "true";
        favBtn.setAttribute("aria-pressed", on ? "false" : "true");
        if (!on && !reduced) pop(favBtn);
        return;
      }

      const addBtn = target.closest && target.closest("[data-add]");
      if (addBtn) {
        const id = addBtn.getAttribute("data-add-id") || addBtn.getAttribute("data-add") || "";
        const name = addBtn.getAttribute("data-add") || "";
        const price = parseFloat(addBtn.getAttribute("data-add-price") || "0") || 0;
        const image = addBtn.getAttribute("data-add-image") || "";
        const weightKg = parseFloat(addBtn.getAttribute("data-add-weight") || "0") || 0;
        if (id) Cart.add({ id, name, price, image, weightKg }, 1);
        if (!reduced) pop(addBtn);
      }
    }
    document.addEventListener("click", onDocClick);

    // ---- product card click-through ----
    // On touch devices (no real :hover), the Add to Cart bar is hidden by
    // default (see .is-touched in shop.css/sections.css). The first tap on
    // a card reveals it instead of navigating; a second tap (or a tap once
    // it's already revealed) goes to the product page as normal. Tapping
    // the add-to-cart button itself always adds to cart, never navigates.
    const isTouchDevice = window.matchMedia && !window.matchMedia("(hover: hover)").matches;

    function onCardClick(e) {
      const target = e.target;
      const card = target.closest && target.closest(".pcard, .card, .feat");
      if (!card) return;
      if (target.closest("button, a, input, select, textarea")) return;

      if (isTouchDevice && !card.classList.contains("is-touched")) {
        e.preventDefault();
        document.querySelectorAll(".pcard.is-touched, .card.is-touched, .feat.is-touched").forEach((c) => {
          if (c !== card) c.classList.remove("is-touched");
        });
        card.classList.add("is-touched");
        return;
      }

      const link = card.getAttribute("data-href");
      if (link) window.location.href = link;
    }
    document.addEventListener("click", onCardClick);

    // ---- side menu ----
    const menuBtn = document.getElementById("menuBtn");
    const sideWrap = document.getElementById("sideMenuWrap");
    let closeMenu;
    if (menuBtn && sideWrap) {
      const sideScrim = document.getElementById("sideScrim");
      const sideClose = document.getElementById("sideClose");
      let lastFocus = null;

      const onKey = (e) => {
        if (e.key === "Escape") closeMenu && closeMenu();
      };

      const openMenu = () => {
        lastFocus = document.activeElement;
        sideWrap.classList.add("is-open");
        sideWrap.setAttribute("aria-hidden", "false");
        menuBtn.setAttribute("aria-expanded", "true");
        lockScroll();
        sideClose && sideClose.focus();
        document.addEventListener("keydown", onKey);
      };

      closeMenu = () => {
        sideWrap.classList.remove("is-open");
        sideWrap.setAttribute("aria-hidden", "true");
        menuBtn.setAttribute("aria-expanded", "false");
        unlockScroll();
        document.removeEventListener("keydown", onKey);
        if (lastFocus && lastFocus.focus) lastFocus.focus();
        else menuBtn.focus();
      };

      menuBtn.addEventListener("click", openMenu);
      sideScrim && sideScrim.addEventListener("click", closeMenu);
      sideClose && sideClose.addEventListener("click", closeMenu);

      sideWrap.querySelectorAll(".sm__item a, .sm__sub a").forEach((a) => a.addEventListener("click", () => closeMenu && closeMenu()));

      sideWrap.querySelectorAll(".sm__item--expand").forEach((item) => {
        const plus = item.querySelector(".sm__plus");
        const wrap = item.querySelector(".sm__sub-wrap");
        if (!plus || !wrap) return;
        const setOpen = (open) => {
          wrap.style.maxHeight = open ? wrap.scrollHeight + "px" : "0px";
        };
        plus.addEventListener("click", () => {
          const open = item.classList.toggle("is-open");
          plus.setAttribute("aria-expanded", open ? "true" : "false");
          setOpen(open);
        });
      });

      sideWrap.querySelectorAll(".sm__switch").forEach((group) => {
        group.addEventListener("click", (e) => {
          const btn = e.target.closest && e.target.closest(".sm__opt");
          if (!btn) return;
          group.querySelectorAll(".sm__opt").forEach((o) => o.classList.toggle("is-active", o === btn));
          // the Language switch (data-lang) drives the real site-wide
          // language toggle; Currency (data-currency) stays cosmetic for
          // now since EGP is the only currency the storefront supports.
          if (btn.dataset.lang && window.AH_I18N) window.AH_I18N.setLang(btn.dataset.lang);
        });
      });
      // keep the side menu's own EN/AR buttons in sync when the language
      // changes from elsewhere (the header's #langBtn, or this same
      // switch on another open instance of the menu).
      function syncSideMenuLangSwitch() {
        if (!window.AH_I18N) return;
        const lang = window.AH_I18N.getLang();
        sideWrap.querySelectorAll('.sm__switch [data-lang]').forEach((o) => {
          o.classList.toggle("is-active", o.dataset.lang === lang);
        });
      }
      document.addEventListener("ah:langchange", syncSideMenuLangSwitch);
      syncSideMenuLangSwitch();
    }

    // ---- generic drawer (cart/search) ----
    function setupDrawer(triggerId, wrapId, scrimId, closeId) {
      const trigger = document.getElementById(triggerId);
      const wrap = document.getElementById(wrapId);
      if (!trigger || !wrap) return null;
      const scrim = document.getElementById(scrimId);
      const closeBtn = document.getElementById(closeId);
      let lastFocus = null;

      const onKey = (e) => {
        if (e.key === "Escape") close();
      };

      function open() {
        lastFocus = document.activeElement;
        wrap.classList.add("is-open");
        wrap.setAttribute("aria-hidden", "false");
        trigger.setAttribute("aria-expanded", "true");
        lockScroll();
        closeBtn && closeBtn.focus();
        document.addEventListener("keydown", onKey);
      }
      function close() {
        wrap.classList.remove("is-open");
        wrap.setAttribute("aria-hidden", "true");
        trigger.setAttribute("aria-expanded", "false");
        unlockScroll();
        document.removeEventListener("keydown", onKey);
        if (lastFocus && lastFocus.focus) lastFocus.focus();
        else trigger.focus();
      }

      trigger.addEventListener("click", open);
      scrim && scrim.addEventListener("click", close);
      closeBtn && closeBtn.addEventListener("click", close);
      return { open, close };
    }

    const cartDrawer = setupDrawer("cartBtn", "cartDrawerWrap", "cartScrim", "cartClose");
    const searchDrawer = setupDrawer("searchBtn", "searchDrawerWrap", "searchScrim", "searchClose");

    document.querySelectorAll(".drawer__panel a[href]").forEach((a) => {
      a.addEventListener("click", () => {
        const host = a.closest(".drawer");
        if (host && host.id === "cartDrawerWrap") cartDrawer && cartDrawer.close();
        if (host && host.id === "searchDrawerWrap") searchDrawer && searchDrawer.close();
      });
    });

    // ---- cart rendering ----
    function money(n) {
      return "EGP " + Math.round(n).toLocaleString("en-US");
    }

    const SHIPPING_FEE = 150;

    // Cart-drawer promo code — shares its result with the checkout page
    // via sessionStorage under "ah_coupon", so a code applied here is
    // already filled in at checkout instead of being asked for twice.
    //
    // The cart is the coupon's permanent home: the coupon turned on from
    // the admin Discounts page shows up here automatically (isAuto: true)
    // with no typing required, and disappears the moment it's turned off
    // there — mirroring how the sale banner works for the homepage. A
    // customer can still type a different code by hand in the promo box;
    // that manual choice (isAuto missing/false) is never overwritten by
    // the dashboard sync below.
    function getAppliedCoupon() {
      try { return JSON.parse(sessionStorage.getItem("ah_coupon") || "null"); } catch { return null; }
    }
    function setAppliedCoupon(coupon) {
      try {
        if (coupon) sessionStorage.setItem("ah_coupon", JSON.stringify(coupon));
        else sessionStorage.removeItem("ah_coupon");
      } catch {}
      // reuse cart:changed so anything listening for cart state also
      // updates when a promo code is applied.
      document.dispatchEvent(new CustomEvent("cart:changed"));
    }

    async function syncFeaturedCoupon() {
      let featured = null;
      try { featured = await API.get("/api/coupons?featured=1"); } catch { featured = null; }
      const current = getAppliedCoupon();
      // Never touch a coupon the customer typed in themselves.
      if (current && !current.isAuto) return;

      if (featured && featured.code && featured.percent > 0) {
        if (!current || current.code !== featured.code || current.percent !== featured.percent) {
          setAppliedCoupon({ code: featured.code, percent: featured.percent, isAuto: true });
        }
      } else if (current && current.isAuto) {
        setAppliedCoupon(null);
      }
    }

    function renderCart() {
      const lines = Cart.read();
      const list = document.getElementById("cartItems");
      const empty = document.getElementById("cartEmpty");
      const countLine = document.getElementById("cartCount");
      const sumSub = document.getElementById("sumSubtotal");
      const sumShip = document.getElementById("sumShipping");
      const sumTotal = document.getElementById("sumTotal");
      const badge = document.querySelector(".cart-btn__count");
      const promo = document.querySelector(".promo");
      const summary = document.querySelector(".summary");
      const checkoutBtn = document.getElementById("checkoutBtn");

      if (!list) return;

      const subtotal = Cart.total();
      const totalQty = Cart.count();

      list.innerHTML = lines
        .map(
          (l) => `
        <li class="citem" data-id="${l.id}" data-price="${l.price}" data-qty="${l.qty}">
          <figure class="citem__media"><img src="${l.image}" alt="${l.name}" loading="lazy" /></figure>
          <div class="citem__body">
            <div class="citem__top">
              <h3 class="citem__name">${l.name}</h3>
              <button class="citem__remove" type="button" data-remove="${l.id}" aria-label="${t("removeFromCart", "Remove {name} from cart").replace("{name}", l.name)}">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.4"></circle><line x1="8.8" y1="8.8" x2="15.2" y2="15.2"></line><line x1="15.2" y1="8.8" x2="8.8" y2="15.2"></line></svg>
              </button>
            </div>
            ${l.variant ? `<p class="citem__variant">${l.variant}</p>` : ""}
            <div class="citem__bottom">
              <p class="citem__price">EGP <span class="citem__price-num">${(l.price * l.qty).toLocaleString("en-US")}</span></p>
              <div class="qty" role="group" aria-label="${t("quantityForItem", "Quantity for {name}").replace("{name}", l.name)}">
                <button type="button" class="qty__btn" data-step="-1" data-qty-id="${l.id}" aria-label="Decrease quantity"><svg viewBox="0 0 16 16" aria-hidden="true"><line x1="3" y1="8" x2="13" y2="8"></line></svg></button>
                <span class="qty__num">${l.qty}</span>
                <button type="button" class="qty__btn" data-step="1" data-qty-id="${l.id}" aria-label="Increase quantity"><svg viewBox="0 0 16 16" aria-hidden="true"><line x1="8" y1="3" x2="8" y2="13"></line><line x1="3" y1="8" x2="13" y2="8"></line></svg></button>
              </div>
            </div>
          </div>
        </li>`
        )
        .join("");

      if (badge) badge.textContent = String(totalQty);
      list.hidden = lines.length === 0;
      if (empty) empty.hidden = lines.length !== 0;
      if (promo) promo.style.display = lines.length === 0 ? "none" : "";
      if (summary) summary.style.display = lines.length === 0 ? "none" : "";
      if (checkoutBtn) checkoutBtn.style.display = lines.length === 0 ? "none" : "";

      if (countLine) countLine.textContent = lines.length === 0 ? t("cartEmptyShort", "Your cart is empty") : totalQty === 1 ? t("oneItemInCart", "1 item in your cart") : t("itemsInCart", "{n} items in your cart").replace("{n}", totalQty);

      const shippingFee = lines.length === 0 ? 0 : SHIPPING_FEE;
      const coupon = getAppliedCoupon();
      const discount = coupon ? Math.round(subtotal * (coupon.percent / 100) * 100) / 100 : 0;
      if (sumSub) sumSub.textContent = money(subtotal);
      if (sumShip) sumShip.textContent = shippingFee === 0 ? t("freeLabel", "Free") : money(shippingFee);
      if (sumTotal) sumTotal.textContent = money(Math.max(0, subtotal - discount) + shippingFee);

      // discount row — inserted right before the shipping row so it's
      // visible whenever a coupon is applied, removed when it isn't
      const summaryEl = document.querySelector(".summary");
      if (summaryEl) {
        let discountRow = summaryEl.querySelector(".summary__row--discount");
        if (coupon) {
          if (!discountRow) {
            discountRow = document.createElement("div");
            discountRow.className = "summary__row summary__row--discount";
            summaryEl.insertBefore(discountRow, summaryEl.querySelector(".summary__total"));
          }
          discountRow.innerHTML = `<span>${t("discountCoupon", "Discount ({code})").replace("{code}", coupon.code)}</span><span>-${money(discount)}</span>`;
        } else if (discountRow) {
          discountRow.remove();
        }
      }

      // promo box state: show the applied code, or the entry form
      const promoRow = document.getElementById("promoToggle");
      const promoLabel = promoRow && promoRow.querySelector(".promo__label");
      if (promoLabel) promoLabel.textContent = coupon ? t("couponApplied2", 'Code "{code}" applied — {percent}% off').replace("{code}", coupon.code).replace("{percent}", coupon.percent) : t("addPromoCode", "Add Promo Code");
      if (promoRow) promoRow.classList.toggle("is-applied", Boolean(coupon));
    }

    function onCartListClick(e) {
      const target = e.target;
      const stepBtn = target.closest && target.closest(".qty__btn");
      if (stepBtn) {
        const id = stepBtn.getAttribute("data-qty-id") || "";
        const li = stepBtn.closest(".citem");
        const currentQty = parseInt((li && li.getAttribute("data-qty")) || "1", 10) || 1;
        const step = parseInt(stepBtn.getAttribute("data-step") || "0", 10) || 0;
        // Pressing "-" at qty 1 removes the item — same as tapping the
        // remove (×) button — instead of doing nothing (Cart.setQty
        // never lets qty go below 1).
        if (step < 0 && currentQty <= 1) {
          Cart.remove(id);
        } else {
          Cart.setQty(id, currentQty + step);
        }
        return;
      }
      const removeBtn = target.closest && target.closest(".citem__remove");
      if (removeBtn) {
        const id = removeBtn.getAttribute("data-remove") || "";
        Cart.remove(id);
      }
    }
    const cartItemsEl = document.getElementById("cartItems");
    cartItemsEl && cartItemsEl.addEventListener("click", onCartListClick);

    document.addEventListener("cart:changed", renderCart);
    document.addEventListener("ah:langchange", renderCart);
    renderCart();
    // Pick up the dashboard's featured coupon on load, and keep checking
    // periodically so turning it on/off in the admin shows up live in an
    // already-open cart drawer without needing a page refresh.
    syncFeaturedCoupon().then(renderCart);
    setInterval(() => { syncFeaturedCoupon().then(renderCart); }, 20000);

    // ---- cart drawer promo code ----
    const promoToggleBtn = document.getElementById("promoToggle");
    const promoBodyEl = document.getElementById("promoBody");
    const promoFormEl = document.getElementById("promoForm");
    const promoInputEl = document.getElementById("promoInput");
    const promoNoteEl = document.getElementById("promoNote");

    if (promoToggleBtn && promoBodyEl) {
      promoToggleBtn.addEventListener("click", () => {
        const open = promoToggleBtn.getAttribute("aria-expanded") === "true";
        promoToggleBtn.setAttribute("aria-expanded", open ? "false" : "true");
        promoBodyEl.classList.toggle("is-open", !open);
        if (!open) {
          const applied = getAppliedCoupon();
          if (applied && promoInputEl) promoInputEl.value = applied.code;
        }
      });
    }

    if (promoFormEl) {
      promoFormEl.addEventListener("submit", async (e) => {
        e.preventDefault();
        const code = (promoInputEl && promoInputEl.value.trim()) || "";
        if (!code) return;
        if (promoNoteEl) { promoNoteEl.textContent = t("checking", "Checking…"); promoNoteEl.className = "promo__note"; }
        try {
          const data = await API.post("/api/coupons", { code });
          setAppliedCoupon({ code: data.code, percent: data.percent });
          if (promoNoteEl) { promoNoteEl.textContent = t("couponAppliedShort", "Applied — {percent}% off").replace("{percent}", data.percent); promoNoteEl.className = "promo__note"; }
          renderCart();
        } catch (err) {
          setAppliedCoupon(null);
          if (promoNoteEl) { promoNoteEl.textContent = (err.data && err.data.error) || t("couponInvalid", "This code isn't valid."); promoNoteEl.className = "promo__note err"; }
          renderCart();
        }
      });
    }

    // ---- search filter ----
    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");
    function onSearchSubmit(e) {
      e.preventDefault();
      const q = ((searchInput && searchInput.value) || "").trim();
      window.location.href = "/shop.html" + (q ? "?q=" + encodeURIComponent(q) : "");
    }
    searchForm && searchForm.addEventListener("submit", onSearchSubmit);

    // ---- newsletter / inspire forms (client-only, no backend) ----
    // Newsletter signup forms (the homepage "Stay Inspired" section and
    // the footer's email field) both post to the real newsletter API —
    // signups actually land in the DB and show up under Marketing in the
    // admin dashboard, rather than only showing a client-side thank-you.
    function wireNewsletterForm(formId, inputId, noteId, errorMsg) {
      const form = document.getElementById(formId);
      if (!form) return;
      const input = document.getElementById(inputId);
      const note = document.getElementById(noteId);
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const value = ((input && input.value) || "").trim();
        if (!emailRe.test(value)) {
          if (note) { note.textContent = errorMsg; note.classList.add("err"); }
          input && input.focus();
          return;
        }
        try {
          await API.post("/api/customers?newsletter=1", { email: value });
          if (note) { note.textContent = t("newsletterSuccess", "Thank you — you are on the list."); note.classList.remove("err"); }
          form.reset();
        } catch {
          if (note) { note.textContent = t("newsletterError", "Something went wrong — please try again."); note.classList.add("err"); }
        }
      });
      input &&
        input.addEventListener("input", () => {
          if (note && note.textContent) {
            note.textContent = "";
            note.classList.remove("err");
          }
        });
    }

    wireNewsletterForm("inspireForm", "inspireEmail", "inspireNote", t("invalidEmail", "Please enter a valid email address."));
    wireNewsletterForm("footForm", "footEmail", "footNote", t("invalidEmail", "Please enter a valid email address."));

    // ---- music player ----
    (function musicPlayer() {
      const STORAGE_KEY = "ah_music_on";
      const audio = document.getElementById("bgMusic");
      const btn = document.getElementById("musicToggle");
      if (!audio || !btn) return;

      audio.volume = 0.35;

      function setPlaying(isPlaying) {
        btn.setAttribute("aria-pressed", isPlaying ? "true" : "false");
        btn.setAttribute("aria-label", isPlaying ? "Pause ambient music" : "Play ambient music");
      }

      function play() {
        audio
          .play()
          .then(() => {
            setPlaying(true);
            try {
              localStorage.setItem(STORAGE_KEY, "1");
            } catch {}
          })
          .catch(() => setPlaying(false));
      }

      function pauseAudio() {
        audio.pause();
        setPlaying(false);
        try {
          localStorage.setItem(STORAGE_KEY, "0");
        } catch {}
      }

      btn.addEventListener("click", () => {
        if (audio.paused) play();
        else pauseAudio();
      });

      try {
        if (localStorage.getItem(STORAGE_KEY) === "1") play();
      } catch {}
    })();

    // ---- hero video (only present on homepage) ----
    (function heroVideo() {
      const video = document.getElementById("heroVideo");
      if (!video) return;
      // Single hero video for both mobile and desktop now — src is
      // already set in the markup, so this just handles autoplay.
      function play() {
        const p = video.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      }

      play();

      document.addEventListener("visibilitychange", () => {
        if (!document.hidden && video.paused) play();
      });

      ["touchstart", "click"].forEach((evt) => {
        const handler = () => {
          if (video.paused) play();
          document.removeEventListener(evt, handler);
        };
        document.addEventListener(evt, handler, { passive: true });
      });
    })();

    // ---- journey video (homepage, far below the fold) ----
    // Ships with data-src + preload="none" so its ~1.7MB isn't downloaded
    // during the initial page load; starts loading ~600px before it scrolls
    // into view, and pauses while off-screen to save CPU/battery.
    (function journeyVideo() {
      const video = document.getElementById("journeyVideo");
      if (!video || !video.dataset.src) return;
      const play = () => { const p = video.play(); if (p && p.catch) p.catch(() => {}); };
      if (!("IntersectionObserver" in window)) { video.src = video.dataset.src; play(); return; }
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            if (!video.getAttribute("src")) video.src = video.dataset.src;
            play();
          } else if (video.getAttribute("src")) {
            video.pause();
          }
        });
      }, { rootMargin: "600px 0px" });
      io.observe(video);
    })();

    // ---- product rail nav (homepage) ----
    (function productRail() {
      const rail = document.getElementById("productRail");
      const prev = document.querySelector('[data-rail="prev"]');
      const next = document.querySelector('[data-rail="next"]');
      if (!rail || !prev || !next) return;

      function step() {
        const card = rail.querySelector(".card");
        if (!card) return rail.clientWidth * 0.8;
        const gap = parseFloat(getComputedStyle(rail).columnGap) || 14;
        return card.getBoundingClientRect().width + gap;
      }

      const nav = prev.parentElement;

      function sync() {
        const slack = rail.scrollWidth - rail.clientWidth;
        const idle = slack < 4;
        nav.classList.toggle("idle", idle);
        prev.disabled = idle || rail.scrollLeft < 4;
        next.disabled = idle || rail.scrollLeft > slack - 4;
      }

      prev.addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: reduced ? "auto" : "smooth" }));
      next.addEventListener("click", () => rail.scrollBy({ left: step(), behavior: reduced ? "auto" : "smooth" }));
      rail.addEventListener("scroll", sync, { passive: true });
      window.addEventListener("resize", sync);
      sync();
    })();

    // ---- about page stat counters ----
    (function aboutStats() {
      const stats = document.querySelectorAll(".about__stats strong[data-count]");
      if (!stats.length) return;
      const DURATION = 2000;

      function animateCount(el) {
        const target = parseFloat(el.getAttribute("data-count") || "0") || 0;
        const suffix = el.getAttribute("data-suffix") || "";
        if (reduced) {
          el.textContent = target + suffix;
          return;
        }
        let start = null;
        const ease = (t) => 1 - Math.pow(1 - t, 3);
        function frame(ts) {
          if (start === null) start = ts;
          const progress = Math.min(1, (ts - start) / DURATION);
          const value = Math.round(target * ease(progress));
          el.textContent = value + suffix;
          if (progress < 1) requestAnimationFrame(frame);
          else el.textContent = target + suffix;
        }
        requestAnimationFrame(frame);
      }

      let done = false;
      function trigger() {
        if (done) return;
        done = true;
        stats.forEach((el) => animateCount(el));
      }

      if ("IntersectionObserver" in window) {
        const wrap = document.querySelector(".about__stats");
        const statIo = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                trigger();
                statIo.disconnect();
              }
            });
          },
          { threshold: 0.4 }
        );
        if (wrap) statIo.observe(wrap);
        else trigger();
      } else {
        trigger();
      }
    })();

    // ---- print button ----
    document.querySelectorAll("[data-print]").forEach((btn) => {
      btn.addEventListener("click", () => window.print());
    });
  });
})();
