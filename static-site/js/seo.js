// Shared SEO helpers — the site's canonical base URL lives here, and
// nowhere else client-side, so swapping onto a real domain later is a
// one-line edit. (api/_seo.js holds the matching server-side copy for
// sitemap.js/robots.txt, since serverless functions can't load this file.)
//
// IMPORTANT: once the real domain is live, change SITE_URL below AND
// the identical constant at the top of api/_seo.js to match — both
// must always agree.
window.AH_SEO = (function () {
  const SITE_URL = "https://www.antiqueehome.com";
  const SITE_NAME = "Antique Home";

  // Ensures <head> has <link rel="canonical">, OG and Twitter Card tags,
  // creating any that are missing and updating ones already present
  // (a few pages set og:title etc. by hand for a specific product/page).
  // Call once per page after the real title/description are known —
  // product.html calls this again once the product loads, since its
  // <head> can't know the title until then.
  function setMeta({ title, description, path, image, type }) {
    if (title) document.title = title;

    const url = SITE_URL + (path || location.pathname);

    upsertLink("canonical", url);
    upsertMeta("description", description);
    upsertMeta("og:title", title, "property");
    upsertMeta("og:description", description, "property");
    upsertMeta("og:url", url, "property");
    upsertMeta("og:type", type || "website", "property");
    upsertMeta("og:site_name", SITE_NAME, "property");
    if (image) upsertMeta("og:image", image.startsWith("http") ? image : SITE_URL + image, "property");
    upsertMeta("twitter:card", image ? "summary_large_image" : "summary", "name");
    upsertMeta("twitter:title", title, "name");
    upsertMeta("twitter:description", description, "name");
    if (image) upsertMeta("twitter:image", image.startsWith("http") ? image : SITE_URL + image, "name");
  }

  function upsertLink(rel, href) {
    if (!href) return;
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", rel);
      document.head.appendChild(el);
    }
    el.setAttribute("href", href);
  }

  function upsertMeta(name, content, attr) {
    if (!content) return;
    const selector = `meta[${attr || "name"}="${name}"]`;
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr || "name", name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  return { SITE_URL, SITE_NAME, setMeta };
})();
