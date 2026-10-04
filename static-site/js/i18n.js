// Site-wide English/Arabic language switch. Stored per-visitor in
// localStorage (key "ah_lang"), applied on every page load before paint
// (this script is loaded in <head>, synchronously, right after the
// fonts link) so there's no flash of the wrong language/direction.
//
// How it works:
//  - Static text: any element with data-i18n="key" gets its textContent
//    swapped from the DICTIONARY below when Arabic is active, and
//    restored to its original (English) text when switched back — the
//    original text is read from the DOM itself on first load, so no
//    duplicate "English copy" needs to be kept anywhere else.
//  - Dynamic/JS-rendered content (shop grid, product page, cart, etc.):
//    each page's own script calls the shared t(key) helper when it
//    builds its HTML strings, and re-renders on the "ah:langchange"
//    event this file dispatches when the language is switched.
//  - Product/category names: use AH_I18N.productName(product) /
//    AH_I18N.categoryName(category), which fall back to the English
//    name whenever no Arabic name has been set for that item — so nothing
//    ever shows blank.
(function () {
  const STORAGE_KEY = "ah_lang";
  const RTL_FONT_LINK_ID = "ah-rtl-fonts";

  function getLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "ar" || saved === "en") return saved;
    } catch {}
    return "en";
  }

  function ensureArabicFonts() {
    if (document.getElementById(RTL_FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = RTL_FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;500;600;700&family=Tajawal:wght@300;400;500;700&display=swap";
    document.head.appendChild(link);
  }

  // Applies <html lang/dir> + the data-i18n text swap. Called immediately
  // on script load (so it runs before first paint) and again whenever the
  // language is switched.
  function applyLang(lang) {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "ar" ? "rtl" : "ltr";
    if (lang === "ar") ensureArabicFonts();

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (lang === "ar") {
        if (!el.hasAttribute("data-i18n-en")) el.setAttribute("data-i18n-en", el.textContent);
        const ar = window.AH_DICTIONARY && window.AH_DICTIONARY[key];
        el.textContent = ar || el.getAttribute("data-i18n-en");
      } else if (el.hasAttribute("data-i18n-en")) {
        el.textContent = el.getAttribute("data-i18n-en");
      }
    });

    // Same idea but for text that has nested markup inside it (e.g. a
    // <strong> for a highlighted number) — swaps innerHTML instead of
    // textContent, with the Arabic dictionary entry holding the HTML.
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      if (lang === "ar") {
        if (!el.hasAttribute("data-i18n-html-en")) el.setAttribute("data-i18n-html-en", el.innerHTML);
        const ar = window.AH_DICTIONARY && window.AH_DICTIONARY[key];
        el.innerHTML = ar || el.getAttribute("data-i18n-html-en");
      } else if (el.hasAttribute("data-i18n-html-en")) {
        el.innerHTML = el.getAttribute("data-i18n-html-en");
      }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (lang === "ar") {
        if (!el.hasAttribute("data-i18n-ph-en")) el.setAttribute("data-i18n-ph-en", el.placeholder || "");
        const ar = window.AH_DICTIONARY && window.AH_DICTIONARY[key];
        el.placeholder = ar || el.getAttribute("data-i18n-ph-en");
      } else if (el.hasAttribute("data-i18n-ph-en")) {
        el.placeholder = el.getAttribute("data-i18n-ph-en");
      }
    });
  }

  function setLang(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
    applyLang(lang);
    document.dispatchEvent(new CustomEvent("ah:langchange", { detail: { lang } }));
  }

  // t(key): looks up the Arabic string for the current language; returns
  // the English fallback (2nd arg) untouched when in English mode or when
  // no translation exists for that key yet.
  function t(key, fallbackEn) {
    if (getLang() !== "ar") return fallbackEn;
    const dict = window.AH_DICTIONARY || {};
    return dict[key] || fallbackEn;
  }

  // Product/category names: prefer the stored Arabic name; fall back to
  // the English one in Arabic mode when no translation was set, rather
  // than ever showing blank.
  function productName(p) {
    if (!p) return "";
    if (getLang() === "ar" && p.name_ar) return p.name_ar;
    return p.name || "";
  }
  function productDescription(p) {
    if (!p) return "";
    if (getLang() === "ar" && p.description_ar) return p.description_ar;
    return p.description || "";
  }
  function categoryName(c) {
    if (!c) return "";
    if (getLang() === "ar") {
      const dict = window.AH_DICTIONARY || {};
      return c.name_ar || dict[`banner:${c.slug}Title`] || c.name || "";
    }
    return c.name || "";
  }

  // Search matching: lets a customer search in Arabic even though most
  // product names are stored in English — matches against the English
  // name, the Arabic name (if set), and the description in both languages.
  function productMatchesQuery(p, query) {
    const q = (query || "").trim().toLowerCase();
    if (!q) return true;
    const haystacks = [p.name, p.name_ar, p.description, p.description_ar, p.material, p.sku]
      .filter(Boolean)
      .map((s) => String(s).toLowerCase());
    return haystacks.some((h) => h.includes(q));
  }

  window.AH_I18N = { getLang, setLang, applyLang, t, productName, productDescription, categoryName, productMatchesQuery };

  // Apply immediately (before DOMContentLoaded) to avoid a flash of the
  // wrong direction/font on reload when Arabic was already selected.
  applyLang(getLang());

  // Re-apply the data-i18n text swap once the DOM is actually parsed too
  // (elements added by this same inline script tag's page might not
  // exist yet at the point applyLang() first ran).
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  // Wires every #langBtn on the page (there's one per page's own header
  // markup — index.html, about.html, and the ones rendered by shop.js /
  // product.js / checkout.js / order-confirmation.js) so clicking it
  // flips the language, and keeps its own label in sync with the
  // *other* language's name (so it reads "العربية" while on the English
  // site, and "English" while on the Arabic site — it names the language
  // you'll switch to, not the one you're on).
  function wireLangButtons() {
    document.querySelectorAll("#langBtn, .lang-btn").forEach((btn) => {
      if (btn.dataset.wired) return;
      btn.dataset.wired = "1";
      btn.addEventListener("click", () => setLang(getLang() === "ar" ? "en" : "ar"));
    });
    updateLangLabels();
  }
  function updateLangLabels() {
    const next = getLang() === "ar" ? "English" : "العربية";
    document.querySelectorAll("#langBtnLabel, .lang-btn__label").forEach((el) => { el.textContent = next; });
  }

  document.addEventListener("ah:langchange", updateLangLabels);
  ready(() => { applyLang(getLang()); wireLangButtons(); });
  // Pages that inject their header later (shop/product/checkout/order-
  // confirmation render it from JS) call this again once their own
  // markup exists — exposed on AH_I18N for that purpose.
  window.AH_I18N.wireLangButtons = wireLangButtons;
})();
