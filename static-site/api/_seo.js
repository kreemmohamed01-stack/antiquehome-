// Server-side copy of js/seo.js's SITE_URL — serverless functions
// can't load client JS, so this constant is kept in sync by hand.
// IMPORTANT: once the real domain is live, update this AND js/seo.js's
// SITE_URL together.
const SITE_URL = "https://www.antiqueehome.com";

// IndexNow: tells Bing / Yandex / Seznam (and the AI search engines that
// read Bing's index) that a URL changed, so new products get crawled within
// minutes instead of days. The key file lives at /<key>.txt. Google doesn't
// use IndexNow — it reads the sitemap. Fire-and-forget: never blocks or
// fails the request that triggered it.
const INDEXNOW_KEY = "6bd99ded86e28b11d14ed8db1d922e3d";
function pingIndexNow(paths) {
  try {
    const urlList = paths.map((p) => SITE_URL + p);
    fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: "www.antiqueehome.com", key: INDEXNOW_KEY, keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`, urlList }),
    }).catch(() => {});
  } catch (e) {}
}

module.exports = { SITE_URL, pingIndexNow };
