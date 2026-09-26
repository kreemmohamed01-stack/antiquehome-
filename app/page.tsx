import { sql, type Product } from "@/lib/db";
import { PromoBar, HeroHeader } from "./components/Header";
import StorefrontChrome from "./components/StorefrontChrome";
import HeroVideo from "./components/HeroVideo";
import ProductRail from "./components/ProductRail";

export const revalidate = 0;

async function getArrivals(): Promise<Product[]> {
  try {
    const rows = (await sql`SELECT * FROM products ORDER BY created_at DESC LIMIT 7`) as Product[];
    return rows;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const products = await getArrivals();
  const featured = products[0];
  const rest = products.slice(1);

  return (
    <>
      <section className="hero" id="hero">
        <HeroVideo />

        <PromoBar />
        <HeroHeader />

        <div className="hero__inner">
          <div className="hero__copy">
            <p className="eyebrow reveal" style={{ ["--d" as string]: ".15s" }}>
              <span className="eyebrow__rule" aria-hidden="true"></span>
              Timeless Heritage
              <span className="eyebrow__rule" aria-hidden="true"></span>
            </p>

            <h1 className="headline">
              <span className="reveal" style={{ ["--d" as string]: ".28s" }}>Timeless pieces.</span>
              <span className="reveal headline__accent" style={{ ["--d" as string]: ".4s" }}>Endless beauty.</span>
            </h1>

            <p className="hero__text reveal" style={{ ["--d" as string]: ".56s" }}>
              Curated antiques and timeless pieces, crafted to bring
              character into every space.
            </p>

            <a className="cta reveal" href="/shop" style={{ ["--d" as string]: ".7s" }}>
              <span className="cta__sheen" aria-hidden="true"></span>
              <span className="cta__label">Shop Now</span>
              <span className="cta__arrow" aria-hidden="true">
                <svg viewBox="0 0 30 12"><line x1="0" y1="6" x2="26" y2="6"></line><polyline points="21,1.4 26.4,6 21,10.6"></polyline></svg>
              </span>
            </a>
          </div>
        </div>

        <a className="hero__scroll reveal" href="#collection" style={{ ["--d" as string]: ".9s" }}>
          <span className="hero__scroll-label">Scroll to Discover</span>
          <svg className="hero__scroll-arrow" viewBox="0 0 16 26" aria-hidden="true">
            <line x1="8" y1="0" x2="8" y2="20"></line>
            <polyline points="1.6,14 8,22 14.4,14"></polyline>
          </svg>
        </a>
      </section>

      <section className="arrivals" id="collection">
        <header className="arrivals__head">
          <p className="kicker kicker--center rv" data-rv>New Arrivals</p>
          <span className="ornament rv" data-rv aria-hidden="true"><i></i><b></b><i></i></span>
          <div className="arrivals__bar">
            <h2 className="arrivals__title rv rv--up" data-rv>Handpicked For You</h2>
            <div className="rail-nav rv" data-rv style={{ ["--rd" as string]: ".12s" }}>
              <button className="rail-btn" type="button" data-rail="prev" aria-label="Previous products">
                <svg viewBox="0 0 20 14" aria-hidden="true"><line x1="19" y1="7" x2="2" y2="7"></line><polyline points="7.4,1.6 1.6,7 7.4,12.4"></polyline></svg>
              </button>
              <button className="rail-btn" type="button" data-rail="next" aria-label="Next products">
                <svg viewBox="0 0 20 14" aria-hidden="true"><line x1="1" y1="7" x2="18" y2="7"></line><polyline points="12.6,1.6 18.4,7 12.6,12.4"></polyline></svg>
              </button>
            </div>
          </div>
        </header>

        {featured ? (
          <article className="feat rv rv--up" data-rv data-href={`/product/${featured.slug}`}>
            <div className="feat__body">
              <div className="feat__top">
                <span className="feat__no">01<i aria-hidden="true"></i></span>
                {featured.badge && <span className="pill">{featured.badge}</span>}
              </div>
              <h3 className="feat__name">{featured.name}</h3>
              <p className="feat__desc">{featured.description}</p>
              <p className="feat__price">EGP {Number(featured.price).toLocaleString("en-US")}</p>
              <div className="feat__actions">
                <button
                  className="btn-gold"
                  type="button"
                  data-add={featured.name}
                  data-add-id={featured.slug}
                  data-add-price={featured.price}
                  data-add-image={(featured.image_urls || [])[0] || ""}
                >
                  Add to Cart
                </button>
                <button className="fav" type="button" aria-label={`Save ${featured.name}`} aria-pressed="false">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4 4.6 13.2a4.6 4.6 0 1 1 7.4-5.3 4.6 4.6 0 1 1 7.4 5.3Z"></path></svg>
                </button>
              </div>
            </div>
            <figure className="feat__media">
              <img src={(featured.image_urls || [])[0] || ""} alt={featured.name} loading="lazy" />
            </figure>
          </article>
        ) : (
          <div className="feat rv rv--up empty-state" data-rv>
            <p style={{ padding: "40px", opacity: 0.7 }}>New arrivals are on their way — check back soon.</p>
          </div>
        )}

        <ProductRail products={rest} />
      </section>

      <section className="cats" id="categories">
        <div className="cats__head">
          <div className="cats__bg" aria-hidden="true">
            <img src="/sec 3/main sec 3.jpeg" alt="" loading="lazy" />
          </div>
          <div className="cats__headInner">
            <p className="kicker kicker--center kicker--gold rv" data-rv>Explore by Category</p>
            <span className="ornament ornament--dark rv" data-rv aria-hidden="true"><i></i><b></b><i></i></span>
            <h2 className="cats__title">
              <span className="rv rv--up" data-rv>Step Into</span>
              <span className="rv rv--up cats__title-accent" data-rv style={{ ["--rd" as string]: ".09s" }}>Timeless Beauty.</span>
            </h2>
            <p className="cats__text rv rv--up" data-rv style={{ ["--rd" as string]: ".18s" }}>
              Handpicked pieces for every corner of your story.
            </p>
            <span className="ornament ornament--dark rv" data-rv style={{ ["--rd" as string]: ".26s" }} aria-hidden="true"><i></i><b></b><i></i></span>
          </div>
        </div>

        <div className="cats__rows">
          <div className="cats__row cats__row--5">
            <a className="cat rv rv--up" href="/category/bleu-blanc" data-rv>
              <span className="cat__no">01</span><span className="cat__name">Bleu Blanc</span>
              <span className="cat__media"><img src="/sec 3/category 1.png" alt="Bleu Blanc porcelain" loading="lazy" /></span>
              <span className="cat__go" aria-hidden="true"><svg viewBox="0 0 18 12"><line x1="0" y1="6" x2="14" y2="6"></line><polyline points="10,2 14,6 10,10"></polyline></svg></span>
            </a>
            <a className="cat rv rv--up" href="/category/lighting" data-rv style={{ ["--rd" as string]: ".06s" }}>
              <span className="cat__no">02</span><span className="cat__name">Lighting</span>
              <span className="cat__media"><img src="/sec 3/category 2.png" alt="Crystal chandelier" loading="lazy" /></span>
              <span className="cat__go" aria-hidden="true"><svg viewBox="0 0 18 12"><line x1="0" y1="6" x2="14" y2="6"></line><polyline points="10,2 14,6 10,10"></polyline></svg></span>
            </a>
            <a className="cat rv rv--up" href="/category/accessories" data-rv style={{ ["--rd" as string]: ".12s" }}>
              <span className="cat__no">03</span><span className="cat__name">Accessories</span>
              <span className="cat__media"><img src="/sec 3/category 3.png" alt="Marble bust" loading="lazy" /></span>
              <span className="cat__go" aria-hidden="true"><svg viewBox="0 0 18 12"><line x1="0" y1="6" x2="14" y2="6"></line><polyline points="10,2 14,6 10,10"></polyline></svg></span>
            </a>
            <a className="cat rv rv--up" href="/category/antiques" data-rv style={{ ["--rd" as string]: ".18s" }}>
              <span className="cat__no">04</span><span className="cat__name">Antiques</span>
              <span className="cat__media"><img src="/sec 3/category 4.png" alt="Gilded mantle clock" loading="lazy" /></span>
              <span className="cat__go" aria-hidden="true"><svg viewBox="0 0 18 12"><line x1="0" y1="6" x2="14" y2="6"></line><polyline points="10,2 14,6 10,10"></polyline></svg></span>
            </a>
            <a className="cat rv rv--up" href="/category/artificial-plants-garden-stool" data-rv style={{ ["--rd" as string]: ".24s" }}>
              <span className="cat__no">05</span><span className="cat__name">Artificial Plants<small>&amp; Garden Stool</small></span>
              <span className="cat__media"><img src="/sec 3/category 5.png" alt="Planted urn and garden stool" loading="lazy" /></span>
              <span className="cat__go" aria-hidden="true"><svg viewBox="0 0 18 12"><line x1="0" y1="6" x2="14" y2="6"></line><polyline points="10,2 14,6 10,10"></polyline></svg></span>
            </a>
          </div>

          <div className="cats__row cats__row--4">
            <a className="cat rv rv--up" href="/category/wall-art-plates" data-rv>
              <span className="cat__no">06</span><span className="cat__name">Wall Art<small>&amp; Plates</small></span>
              <span className="cat__media"><img src="/sec 3/category 6.png" alt="Framed art and decorative plates" loading="lazy" /></span>
              <span className="cat__go" aria-hidden="true"><svg viewBox="0 0 18 12"><line x1="0" y1="6" x2="14" y2="6"></line><polyline points="10,2 14,6 10,10"></polyline></svg></span>
            </a>
            <a className="cat rv rv--up" href="/category/murano-glass" data-rv style={{ ["--rd" as string]: ".06s" }}>
              <span className="cat__no">07</span><span className="cat__name">Murano Glass</span>
              <span className="cat__media"><img src="/sec 3/category 7.png" alt="Murano glass vase" loading="lazy" /></span>
              <span className="cat__go" aria-hidden="true"><svg viewBox="0 0 18 12"><line x1="0" y1="6" x2="14" y2="6"></line><polyline points="10,2 14,6 10,10"></polyline></svg></span>
            </a>
            <a className="cat rv rv--up" href="/category/furniture" data-rv style={{ ["--rd" as string]: ".12s" }}>
              <span className="cat__no">08</span><span className="cat__name">Furniture</span>
              <span className="cat__media"><img src="/sec 3/category 8.png" alt="Gilt-wood armchair" loading="lazy" /></span>
              <span className="cat__go" aria-hidden="true"><svg viewBox="0 0 18 12"><line x1="0" y1="6" x2="14" y2="6"></line><polyline points="10,2 14,6 10,10"></polyline></svg></span>
            </a>
            <a className="cat rv rv--up" href="/category/sale" data-rv style={{ ["--rd" as string]: ".18s" }}>
              <span className="cat__no">09</span><span className="cat__name">Sale</span>
              <span className="cat__media"><img src="/sec 3/category 9.jpeg" alt="Sale" loading="lazy" /></span>
              <span className="cat__go" aria-hidden="true"><svg viewBox="0 0 18 12"><line x1="0" y1="6" x2="14" y2="6"></line><polyline points="10,2 14,6 10,10"></polyline></svg></span>
            </a>
          </div>
        </div>

        <aside className="help rv rv--up" data-rv>
          <div className="help__bg" aria-hidden="true"><img src="/sec 3/get in touch.jpeg" alt="" loading="lazy" /></div>
          <span className="monogram" aria-hidden="true">
            <svg viewBox="0 0 100 100">
              <path d="M50 6 76 24 94 50 76 76 50 94 24 76 6 50 24 24Z"></path>
              <path d="M50 13 71 28 87 50 71 72 50 87 29 72 13 50 29 28Z"></path>
            </svg>
            <em>AH</em>
          </span>
          <div className="help__copy">
            <h3 className="help__title">Can&apos;t find<br />what you&apos;re looking for?</h3>
            <p className="help__text">We&apos;re here to help you discover<br />the perfect piece.</p>
          </div>
          <a className="btn-outline" href="https://wa.me/201125470009" target="_blank" rel="noopener noreferrer">
            <span>Get in Touch</span>
            <svg viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
          </a>
        </aside>
      </section>

      <section className="story" id="story">
        <picture className="story__bg">
          <source media="(min-width: 900px)" srcSet="/sec%204/background%20sec%204%20desk%20.jpeg" />
          <img src="/sec 4/background sec 4 mopil .jpeg" alt="A sunlit salon with a marble fireplace, gilt armchair and a hand-glazed urn" loading="lazy" />
        </picture>

        <div className="story__panel">
          <span className="story__mark rv" data-rv aria-hidden="true">
            <svg viewBox="0 0 48 48">
              <path d="M24 4c3.6 6.4 9.6 12.4 16 16-6.4 3.6-12.4 9.6-16 16-3.6-6.4-9.6-12.4-16-16C14.4 16.4 20.4 10.4 24 4Z"></path>
              <circle cx="24" cy="20" r="5.4"></circle>
            </svg>
          </span>
          <p className="kicker kicker--center kicker--story rv" data-rv>Our Story</p>
          <span className="rule-sm rv" data-rv aria-hidden="true"></span>
          <h2 className="story__title">
            <span className="rv rv--up" data-rv>The Art of</span>
            <span className="rv rv--up story__title-xl" data-rv style={{ ["--rd" as string]: ".09s" }}>Living</span>
            <span className="rv rv--up story__title-accent" data-rv style={{ ["--rd" as string]: ".18s" }}>Beautifully</span>
          </h2>
          <span className="ornament ornament--story rv" data-rv style={{ ["--rd" as string]: ".24s" }} aria-hidden="true"><i></i><b></b><i></i></span>
          <p className="story__text rv rv--up" data-rv style={{ ["--rd" as string]: ".3s" }}>
            Timeless pieces, thoughtfully curated to bring character, history, and elegance into your everyday life.
          </p>
          <a className="btn-solid rv rv--up" href="/about" data-rv style={{ ["--rd" as string]: ".38s" }}>
            <span>Discover Our Story</span>
            <svg viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
          </a>
        </div>
      </section>

      <section className="journey" id="journey">
        <div className="journey__top">
          <div className="journey__copy">
            <p className="kicker kicker--gold rv" data-rv>
              <span>Follow Our Journey</span>
              <i className="kicker__rule" aria-hidden="true"></i>
            </p>
            <h2 className="journey__title">
              <span className="rv rv--up" data-rv>Timeless</span>
              <span className="rv rv--up" data-rv style={{ ["--rd" as string]: ".08s" }}>pieces.</span>
              <span className="rv rv--up journey__title-accent" data-rv style={{ ["--rd" as string]: ".16s" }}>Real stories.</span>
            </h2>
            <p className="journey__text rv rv--up" data-rv style={{ ["--rd" as string]: ".24s" }}>
              Behind the scenes, styling ideas,<br />
              and timeless pieces.<br />
              Find daily inspiration on Instagram.
            </p>
            <a className="ig-handle rv rv--up" data-rv style={{ ["--rd" as string]: ".32s" }} href="https://www.instagram.com/antique_home111?igsi=MXQ1eWdvbGRsb2pvaA==" target="_blank" rel="noopener noreferrer">
              <span className="ig-handle__badge" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <defs><radialGradient id="igGrad" cx="30%" cy="107%" r="150%"><stop offset="0%" stopColor="#FDF497" /><stop offset="5%" stopColor="#FDF497" /><stop offset="45%" stopColor="#FD5949" /><stop offset="60%" stopColor="#D6249F" /><stop offset="90%" stopColor="#285AEB" /></radialGradient></defs>
                  <rect x="2" y="2" width="20" height="20" rx="5.6" fill="url(#igGrad)" />
                  <rect x="5.6" y="5.6" width="12.8" height="12.8" rx="3.9" fill="none" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="17.1" cy="6.9" r="1.15" fill="#fff" />
                </svg>
              </span>
              <span className="ig-handle__name">@antique_home111</span>
              <svg className="ig-handle__arrow" viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
            </a>
          </div>

          <figure className="journey__video rv rv--zoom" data-rv>
            <video id="journeyVideo" src="/sec 5/سكشن 5 فيديو.mp4" autoPlay loop muted playsInline preload="auto" disablePictureInPicture aria-label="Styling film from the Antique Home studio"></video>
          </figure>
        </div>

        <div className="ig">
          <div className="ig__head">
            <p className="kicker kicker--gold rv" data-rv><span>On Instagram</span><i className="kicker__rule" aria-hidden="true"></i></p>
            <a className="link-arrow link-arrow--gold rv" data-rv href="https://www.instagram.com/antique_home111?igsi=MXQ1eWdvbGRsb2pvaA==" target="_blank" rel="noopener noreferrer">
              <span>View all</span>
              <svg viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
            </a>
          </div>
          <div className="ig__grid">
            <a className="ig__tile rv rv--zoom" data-rv href="https://www.instagram.com/antique_home111?igsi=MXQ1eWdvbGRsb2pvaA==" target="_blank" rel="noopener noreferrer"><img src="/sec 5/insta 1.png" alt="Pierced porcelain lanterns glowing on a marble table" loading="lazy" /></a>
            <a className="ig__tile rv rv--zoom" data-rv style={{ ["--rd" as string]: ".07s" }} href="https://www.instagram.com/antique_home111?igsi=MXQ1eWdvbGRsb2pvaA==" target="_blank" rel="noopener noreferrer"><img src="/sec 5/insta 2.png" alt="An antique urn styled with books on a console" loading="lazy" /></a>
            <a className="ig__tile rv rv--zoom" data-rv style={{ ["--rd" as string]: ".14s" }} href="https://www.instagram.com/antique_home111?igsi=MXQ1eWdvbGRsb2pvaA==" target="_blank" rel="noopener noreferrer"><img src="/sec 5/insta 3 .png" alt="A shelf lined with collected vessels" loading="lazy" /></a>
            <a className="ig__tile rv rv--zoom" data-rv style={{ ["--rd" as string]: ".21s" }} href="https://www.instagram.com/antique_home111?igsi=MXQ1eWdvbGRsb2pvaA==" target="_blank" rel="noopener noreferrer"><img src="/sec 5/insta 4.png" alt="Candlelight beside a speckled vase" loading="lazy" /></a>
          </div>
        </div>

        <ul className="trust">
          <li className="trust__item rv rv--up" data-rv>
            <span className="trust__icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 3.4 27 7.6v8.2c0 6.6-4.5 11-11 13.2C9.5 26.8 5 22.4 5 15.8V7.6Z"></path><polyline points="11.4,16.2 14.8,19.6 21,12.6"></polyline></svg></span>
            <h3 className="trust__title">Authentic<br />Quality</h3>
            <p className="trust__text">Carefully selected<br />pieces that last<br />for generations.</p>
          </li>
          <li className="trust__item rv rv--up" data-rv style={{ ["--rd" as string]: ".08s" }}>
            <span className="trust__icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M2.6 8.4h14v12.8h-14z"></path><path d="M16.6 12.4h6.6l4.2 4.2v4.6h-10.8z"></path><circle cx="9.2" cy="24" r="2.6"></circle><circle cx="22.6" cy="24" r="2.6"></circle></svg></span>
            <h3 className="trust__title">Fast &amp; Secure<br />Delivery</h3>
            <p className="trust__text">Safe packaging.<br />Delivered to<br />your doorstep.</p>
          </li>
          <li className="trust__item rv rv--up" data-rv style={{ ["--rd" as string]: ".16s" }}>
            <span className="trust__icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 3.6 28 9.8v12.4L16 28.4 4 22.2V9.8Z"></path><polyline points="4,9.8 16,16 28,9.8"></polyline><line x1="16" y1="16" x2="16" y2="28.4"></line></svg></span>
            <h3 className="trust__title">Easy Returns<br />Within 14 Days</h3>
            <p className="trust__text">Not in love?<br />Return it easily.<br />No worries.</p>
          </li>
          <li className="trust__item rv rv--up" data-rv style={{ ["--rd" as string]: ".24s" }}>
            <span className="trust__icon" aria-hidden="true"><svg viewBox="0 0 32 32"><rect x="6.4" y="14" width="19.2" height="14" rx="2.4"></rect><path d="M10.8 14V10a5.2 5.2 0 0 1 10.4 0v4"></path><circle cx="16" cy="21" r="1.6"></circle></svg></span>
            <h3 className="trust__title">100% Secure<br />Payment</h3>
            <p className="trust__text">Your payment<br />information is<br />always protected.</p>
          </li>
        </ul>

        <aside className="inspire rv rv--up" data-rv>
          <div className="inspire__bg" aria-hidden="true"><img src="/sec 5/stay inspired background.jpeg" alt="" loading="lazy" /></div>
          <div className="inspire__copy">
            <h3 className="inspire__title">Stay Inspired</h3>
            <p className="inspire__text">New arrivals, styling ideas<br />&amp; exclusive offers.</p>
            <form className="inspire__form" id="inspireForm">
              <span className="inspire__field">
                <svg className="inspire__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.4 3.6H6.2A2.4 2.4 0 0 0 3.8 6c0 8 6.2 14.2 14.2 14.2a2.4 2.4 0 0 0 2.4-2.4v-2.2l-4.4-1.6-2 2a13.6 13.6 0 0 1-5.6-5.6l2-2Z"></path></svg>
                <input id="inspirePhone" type="tel" name="phone" inputMode="tel" autoComplete="tel" placeholder="Enter your phone number" aria-label="Your phone number" required />
              </span>
              <button className="inspire__submit" type="submit">Join the List</button>
            </form>
            <p className="inspire__note" id="inspireNote" role="status" aria-live="polite"></p>
          </div>
        </aside>
      </section>

      <StorefrontChrome />
    </>
  );
}
