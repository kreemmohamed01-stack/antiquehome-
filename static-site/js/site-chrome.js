// Shared header/footer/drawer/menu wiring, ported from app/components/SiteChrome.tsx,
// HeroVideo.tsx, ProductRail's rail-nav bits, MusicPlayer.tsx and AboutStats.tsx.
// Depends on js/api.js having already run (Cart, fmtMoney, etc).
(function () {
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    // ---- scroll reveal ----
    const targets = Array.prototype.slice.call(document.querySelectorAll("[data-rv]"));
    let io;
    if (reduced || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("in"));
    } else {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
      );
      targets.forEach((el) => io.observe(el));
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
    function onCardClick(e) {
      const target = e.target;
      const card = target.closest && target.closest(".pcard, .card, .feat");
      if (!card) return;
      if (target.closest("button, a, input, select, textarea")) return;
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
        });
      });
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

    const FREE_SHIPPING_AT = 15000;
    const SHIPPING_FEE = 150;

    function renderCart() {
      const lines = Cart.read();
      const list = document.getElementById("cartItems");
      const empty = document.getElementById("cartEmpty");
      const countLine = document.getElementById("cartCount");
      const shipEl = document.querySelector(".ship");
      const shipText = document.getElementById("shipText");
      const shipFill = document.getElementById("shipFill");
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
              <button class="citem__remove" type="button" data-remove="${l.id}" aria-label="Remove ${l.name} from cart">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.4"></circle><line x1="8.8" y1="8.8" x2="15.2" y2="15.2"></line><line x1="15.2" y1="8.8" x2="8.8" y2="15.2"></line></svg>
              </button>
            </div>
            ${l.variant ? `<p class="citem__variant">${l.variant}</p>` : ""}
            <div class="citem__bottom">
              <p class="citem__price">EGP <span class="citem__price-num">${(l.price * l.qty).toLocaleString("en-US")}</span></p>
              <div class="qty" role="group" aria-label="Quantity for ${l.name}">
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

      if (countLine) countLine.textContent = lines.length === 0 ? "Your cart is empty" : totalQty === 1 ? "1 item in your cart" : totalQty + " items in your cart";

      const qualifies = subtotal >= FREE_SHIPPING_AT;
      const pct = Math.max(0, Math.min(100, (subtotal / FREE_SHIPPING_AT) * 100));
      if (shipFill) shipFill.style.width = pct + "%";
      if (shipEl) shipEl.classList.toggle("is-full", qualifies);
      if (shipText) {
        shipText.innerHTML = qualifies
          ? "You&rsquo;ve unlocked <strong>free shipping</strong>!"
          : "You are <strong>" + money(FREE_SHIPPING_AT - subtotal) + "</strong> away from free shipping";
      }

      const shippingFee = qualifies || lines.length === 0 ? 0 : SHIPPING_FEE;
      if (sumSub) sumSub.textContent = money(subtotal);
      if (sumShip) sumShip.textContent = shippingFee === 0 ? "Free" : money(shippingFee);
      if (sumTotal) sumTotal.textContent = money(subtotal + shippingFee);
    }

    function onCartListClick(e) {
      const target = e.target;
      const stepBtn = target.closest && target.closest(".qty__btn");
      if (stepBtn) {
        const id = stepBtn.getAttribute("data-qty-id") || "";
        const li = stepBtn.closest(".citem");
        const currentQty = parseInt((li && li.getAttribute("data-qty")) || "1", 10) || 1;
        const step = parseInt(stepBtn.getAttribute("data-step") || "0", 10) || 0;
        Cart.setQty(id, currentQty + step);
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
    renderCart();

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
    function wireSimpleForm(formId, inputId, noteId, validate, successMsg, errorMsg) {
      const form = document.getElementById(formId);
      if (!form) return;
      const input = document.getElementById(inputId);
      const note = document.getElementById(noteId);
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const value = ((input && input.value) || "").trim();
        if (!validate(value)) {
          if (note) {
            note.textContent = errorMsg;
            note.classList.add("err");
          }
          input && input.focus();
          return;
        }
        if (note) {
          note.textContent = successMsg;
          note.classList.remove("err");
        }
        form.reset();
      });
      input &&
        input.addEventListener("input", () => {
          if (note && note.textContent) {
            note.textContent = "";
            note.classList.remove("err");
          }
        });
    }

    wireSimpleForm("inspireForm", "inspirePhone", "inspireNote", (v) => v.replace(/[^\d]/g, "").length >= 8, "Thank you — we will be in touch.", "Please enter a valid phone number.");
    wireSimpleForm("footForm", "footEmail", "footNote", (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), "Thank you — you are on the list.", "Please enter a valid email address.");

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
      const SOURCES = { mobile: "/hero video mop.mp4", desktop: "/hero vedio lab.mp4" };
      const wide = window.matchMedia("(min-width: 900px)");
      let current = "mobile";

      function play() {
        const p = video.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      }

      function loadSource() {
        const key = wide.matches ? "desktop" : "mobile";
        if (key === current) return;
        current = key;
        video.src = SOURCES[key];
        video.load();
        play();
      }

      play();
      loadSource();
      wide.addEventListener && wide.addEventListener("change", loadSource);

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
