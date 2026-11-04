# Antique Home

Storefront and dashboard for [antiqueehome.com](https://www.antiqueehome.com).
Plain HTML/CSS/JS pages plus Vercel serverless functions, Neon Postgres for
data and Cloudinary for product photos. Every push to `main` deploys.

## Layout

```
antique home/
├── static-site/            ← the website (Vercel deploys this folder)
│   ├── *.html              pages: index, shop, product, about, checkout,
│   │                       order-confirmation, shipping, returns, privacy, terms
│   ├── admin/              the dashboard (/admin)
│   ├── api/                serverless functions (/api/*); files starting
│   │                       with _ are shared helpers, not endpoints
│   ├── css/                storefront stylesheets (inlined into pages at build time)
│   │   ├── base.css        shared site styles; fonts.css, page-loader.css
│   │   ├── <page>.css      one per page (shop, product, checkout, about…)
│   │   └── admin/          dashboard styles; admin/pages/ = one page's own styles
│   ├── js/                 storefront scripts
│   │   ├── api.js, i18n.js, site-chrome.js, chrome-partials.js  shared
│   │   ├── <page>.js       one per page (index, shop, product, checkout…)
│   │   ├── page-loader.js  "Loading" screen (inlined at build: data-inline)
│   │   └── admin/          dashboard shell + effects; admin/pages/<page>.js
│   │                       = the code for admin/<page>.html
│   ├── fonts/              self-hosted web fonts
│   ├── images/
│   │   ├── brand/          logos
│   │   ├── home/           homepage sections (hero poster, collections,
│   │   │                   instagram tiles, section backgrounds)
│   │   ├── categories/     default category photos
│   │   ├── shop/           shop page hero (desktop + mobile)
│   │   ├── backgrounds/    page, menu and footer backgrounds
│   │   └── about/          about page photos
│   ├── videos/             hero, intro and instagram films
│   ├── audio/              ambient music
│   ├── scripts/            build step (stamp-assets.js) and admin tools
│   ├── vercel.json         routes, redirects, cache headers
│   └── favicons, og-logo-v2.png, site.webmanifest, robots.txt and the
│       IndexNow key stay at the root, where browsers and crawlers look
├── scripts/                one-off database scripts (migrations, seeds)
├── source-media/           original photos/videos — NOT deployed
│   ├── lighting/, plants/  product photos used by the seed scripts
│   ├── videos/             full-length source films
│   └── unused/             retired assets kept for reference
└── backups/                local backups (git-ignored)
```

## Common tasks

- **Forgotten dashboard password** (run inside `static-site/`):
  `node --env-file=.env.local scripts/reset-admin-password.js "NewPassword123!"`
- **New page image:** put it in the matching `static-site/images/<section>/`
  folder with a lowercase, dash-separated English name (e.g. `hero-mobile.webp`).
