"use client";

import { useEffect } from "react";
import { CART_EVENT, addToCart, readCart, removeFromCart, setQty, cartTotals } from "@/lib/cart";

/**
 * Client-side behavior for the shared header/menu/drawers/cart, ported
 * from the original script.js. Runs once per page mount and wires up
 * event delegation against the shared DOM structure/class names.
 */
export default function SiteChrome() {
  useEffect(() => {
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
    const targets = Array.prototype.slice.call(document.querySelectorAll("[data-rv]")) as HTMLElement[];
    let io: IntersectionObserver | undefined;
    if (reduced || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("in"));
    } else {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("in");
            io!.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
      );
      targets.forEach((el) => io!.observe(el));
    }

    // ---- fav / add to cart pop ----
    function pop(el: Element) {
      el.classList.remove("pop");
      void (el as HTMLElement).offsetWidth;
      el.classList.add("pop");
    }

    function onDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const favBtn = target.closest?.(".fav") as HTMLElement | null;
      if (favBtn) {
        const on = favBtn.getAttribute("aria-pressed") === "true";
        favBtn.setAttribute("aria-pressed", on ? "false" : "true");
        if (!on && !reduced) pop(favBtn);
        return;
      }

      const addBtn = target.closest?.("[data-add]") as HTMLElement | null;
      if (addBtn) {
        const id = addBtn.getAttribute("data-add-id") || addBtn.getAttribute("data-add") || "";
        const name = addBtn.getAttribute("data-add") || "";
        const price = parseFloat(addBtn.getAttribute("data-add-price") || "0") || 0;
        const image = addBtn.getAttribute("data-add-image") || "";
        if (id) addToCart({ id, name, price, image });
        if (!reduced) pop(addBtn);
      }
    }
    document.addEventListener("click", onDocClick);

    // ---- product card click-through ----
    function onCardClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const card = target.closest?.(".pcard, .card, .feat") as HTMLElement | null;
      if (!card) return;
      if (target.closest("button, a, input, select, textarea")) return;
      const link = card.getAttribute("data-href");
      if (link) window.location.href = link;
    }
    document.addEventListener("click", onCardClick);

    // ---- side menu ----
    const menuBtn = document.getElementById("menuBtn");
    const sideWrap = document.getElementById("sideMenuWrap");
    let closeMenu: (() => void) | undefined;
    if (menuBtn && sideWrap) {
      const sideScrim = document.getElementById("sideScrim");
      const sideClose = document.getElementById("sideClose");
      let lastFocus: Element | null = null;

      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") closeMenu?.();
      };

      const openMenu = () => {
        lastFocus = document.activeElement;
        sideWrap.classList.add("is-open");
        sideWrap.setAttribute("aria-hidden", "false");
        menuBtn.setAttribute("aria-expanded", "true");
        lockScroll();
        (sideClose as HTMLElement | null)?.focus();
        document.addEventListener("keydown", onKey);
      };

      closeMenu = () => {
        sideWrap.classList.remove("is-open");
        sideWrap.setAttribute("aria-hidden", "true");
        menuBtn.setAttribute("aria-expanded", "false");
        unlockScroll();
        document.removeEventListener("keydown", onKey);
        if (lastFocus && (lastFocus as HTMLElement).focus) (lastFocus as HTMLElement).focus();
        else menuBtn.focus();
      };

      menuBtn.addEventListener("click", openMenu);
      sideScrim?.addEventListener("click", closeMenu);
      sideClose?.addEventListener("click", closeMenu);

      sideWrap.querySelectorAll(".sm__item a, .sm__sub a").forEach((a) => a.addEventListener("click", () => closeMenu?.()));

      sideWrap.querySelectorAll(".sm__item--expand").forEach((item) => {
        const plus = item.querySelector(".sm__plus") as HTMLElement | null;
        const wrap = item.querySelector(".sm__sub-wrap") as HTMLElement | null;
        if (!plus || !wrap) return;
        const setOpen = (open: boolean) => {
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
          const btn = (e.target as HTMLElement).closest?.(".sm__opt");
          if (!btn) return;
          group.querySelectorAll(".sm__opt").forEach((o) => o.classList.toggle("is-active", o === btn));
        });
      });
    }

    // ---- generic drawer (cart/search) ----
    function setupDrawer(triggerId: string, wrapId: string, scrimId: string, closeId: string) {
      const trigger = document.getElementById(triggerId);
      const wrap = document.getElementById(wrapId);
      if (!trigger || !wrap) return null;
      const scrim = document.getElementById(scrimId);
      const closeBtn = document.getElementById(closeId);
      let lastFocus: Element | null = null;

      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") close();
      };

      function open() {
        lastFocus = document.activeElement;
        wrap!.classList.add("is-open");
        wrap!.setAttribute("aria-hidden", "false");
        trigger!.setAttribute("aria-expanded", "true");
        lockScroll();
        (closeBtn as HTMLElement | null)?.focus();
        document.addEventListener("keydown", onKey);
      }
      function close() {
        wrap!.classList.remove("is-open");
        wrap!.setAttribute("aria-hidden", "true");
        trigger!.setAttribute("aria-expanded", "false");
        unlockScroll();
        document.removeEventListener("keydown", onKey);
        if (lastFocus && (lastFocus as HTMLElement).focus) (lastFocus as HTMLElement).focus();
        else (trigger as HTMLElement).focus();
      }

      trigger.addEventListener("click", open);
      scrim?.addEventListener("click", close);
      closeBtn?.addEventListener("click", close);
      return { open, close };
    }

    const cartDrawer = setupDrawer("cartBtn", "cartDrawerWrap", "cartScrim", "cartClose");
    const searchDrawer = setupDrawer("searchBtn", "searchDrawerWrap", "searchScrim", "searchClose");

    document.querySelectorAll(".drawer__panel a[href]").forEach((a) => {
      a.addEventListener("click", () => {
        const host = a.closest(".drawer");
        if (host?.id === "cartDrawerWrap") cartDrawer?.close();
        if (host?.id === "searchDrawerWrap") searchDrawer?.close();
      });
    });

    // ---- cart rendering ----
    function money(n: number) {
      return "EGP " + Math.round(n).toLocaleString("en-US");
    }

    const FREE_SHIPPING_AT = 15000;
    const SHIPPING_FEE = 150;

    function renderCart() {
      const lines = readCart();
      const list = document.getElementById("cartItems");
      const empty = document.getElementById("cartEmpty");
      const countLine = document.getElementById("cartCount");
      const shipEl = document.querySelector(".ship") as HTMLElement | null;
      const shipText = document.getElementById("shipText");
      const shipFill = document.getElementById("shipFill") as HTMLElement | null;
      const sumSub = document.getElementById("sumSubtotal");
      const sumShip = document.getElementById("sumShipping");
      const sumTotal = document.getElementById("sumTotal");
      const badge = document.querySelector(".cart-btn__count");
      const promo = document.querySelector(".promo") as HTMLElement | null;
      const summary = document.querySelector(".summary") as HTMLElement | null;
      const checkoutBtn = document.getElementById("checkoutBtn") as HTMLElement | null;

      if (!list) return;

      const { subtotal, totalQty } = cartTotals(lines);

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

    function onCartListClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const stepBtn = target.closest?.(".qty__btn") as HTMLElement | null;
      if (stepBtn) {
        const id = stepBtn.getAttribute("data-qty-id") || "";
        const li = stepBtn.closest(".citem") as HTMLElement | null;
        const currentQty = parseInt(li?.getAttribute("data-qty") || "1", 10) || 1;
        const step = parseInt(stepBtn.getAttribute("data-step") || "0", 10) || 0;
        setQty(id, currentQty + step);
        return;
      }
      const removeBtn = target.closest?.(".citem__remove") as HTMLElement | null;
      if (removeBtn) {
        const id = removeBtn.getAttribute("data-remove") || "";
        removeFromCart(id);
      }
    }
    document.getElementById("cartItems")?.addEventListener("click", onCartListClick);

    window.addEventListener(CART_EVENT, renderCart);
    renderCart();

    // ---- search filter (client only, on shop page results if present) ----
    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput") as HTMLInputElement | null;
    function onSearchSubmit(e: Event) {
      e.preventDefault();
      const q = (searchInput?.value || "").trim();
      window.location.href = "/shop" + (q ? "?q=" + encodeURIComponent(q) : "");
    }
    searchForm?.addEventListener("submit", onSearchSubmit);

    // ---- newsletter / inspire forms (client-only, no backend) ----
    function wireSimpleForm(formId: string, inputId: string, noteId: string, validate: (v: string) => boolean, successMsg: string, errorMsg: string) {
      const form = document.getElementById(formId) as HTMLFormElement | null;
      if (!form) return;
      const input = document.getElementById(inputId) as HTMLInputElement | null;
      const note = document.getElementById(noteId);
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const value = (input?.value || "").trim();
        if (!validate(value)) {
          if (note) {
            note.textContent = errorMsg;
            note.classList.add("err");
          }
          input?.focus();
          return;
        }
        if (note) {
          note.textContent = successMsg;
          note.classList.remove("err");
        }
        form.reset();
      });
      input?.addEventListener("input", () => {
        if (note && note.textContent) {
          note.textContent = "";
          note.classList.remove("err");
        }
      });
    }

    wireSimpleForm("inspireForm", "inspirePhone", "inspireNote", (v) => v.replace(/[^\d]/g, "").length >= 8, "Thank you — we will be in touch.", "Please enter a valid phone number.");
    wireSimpleForm("footForm", "footEmail", "footNote", (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), "Thank you — you are on the list.", "Please enter a valid email address.");

    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("click", onCardClick);
      window.removeEventListener(CART_EVENT, renderCart);
      document.getElementById("cartItems")?.removeEventListener("click", onCartListClick);
      searchForm?.removeEventListener("submit", onSearchSubmit);
      io?.disconnect();
    };
  }, []);

  return null;
}
