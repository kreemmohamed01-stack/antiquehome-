// Server-side copy of js/seo.js's SITE_URL — serverless functions
// can't load client JS, so this constant is kept in sync by hand.
// IMPORTANT: once the real domain is live, update this AND js/seo.js's
// SITE_URL together.
const SITE_URL = "https://www.antiqueehome.com";

module.exports = { SITE_URL };
