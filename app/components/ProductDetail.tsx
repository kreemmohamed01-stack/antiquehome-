"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/db";
import { addToCart } from "@/lib/cart";

export default function ProductDetail({
  product,
  prevSlug,
  nextSlug,
}: {
  product: Product;
  prevSlug: string | null;
  nextSlug: string | null;
}) {
  const images = product.image_urls && product.image_urls.length ? product.image_urls : ["/khph.png"];
  const [activeImg, setActiveImg] = useState(images[0]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [fav, setFav] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [openAcc, setOpenAcc] = useState<number | null>(null);

  useEffect(() => {
    setActiveImg(images[0]);
    setActiveIdx(0);
  }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const price = Number(product.price);
  const compareAt = product.compare_at_price ? Number(product.compare_at_price) : null;
  const off = compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : null;

  function handleAddToCart() {
    addToCart({ id: product.slug, name: product.name, price, image: images[0] }, qty);
    const cartBtn = document.getElementById("cartBtn");
    cartBtn?.click();
  }

  return (
    <main className="pdp">
      <div className="pdp__bg" aria-hidden="true">
        <img src="/خلفيه منتجات.png" alt="" loading="eager" />
      </div>

      <div className="pdp__inner">
        <div className="pdp__topbar">
          <p className="crumb">
            <a href="/">Home</a>
            <span className="crumb__sep" aria-hidden="true">&rsaquo;</span>
            <a href="/shop">Shop</a>
            <span className="crumb__sep" aria-hidden="true">&rsaquo;</span>
            <span className="crumb__here">{product.name}</span>
          </p>
          <nav className="pdp__nav" aria-label="Other products">
            {prevSlug ? (
              <a className="pdp__nav-link" href={`/product/${prevSlug}`}>
                <svg viewBox="0 0 20 14" aria-hidden="true"><line x1="19" y1="7" x2="2" y2="7"></line><polyline points="7.4,1.6 1.6,7 7.4,12.4"></polyline></svg>Prev
              </a>
            ) : (
              <span className="pdp__nav-link" style={{ opacity: 0.4 }}>Prev</span>
            )}
            <span className="pdp__nav-sep" aria-hidden="true">|</span>
            {nextSlug ? (
              <a className="pdp__nav-link" href={`/product/${nextSlug}`}>
                Next<svg viewBox="0 0 20 14" aria-hidden="true"><line x1="1" y1="7" x2="18" y2="7"></line><polyline points="12.6,1.6 18.4,7 12.6,12.4"></polyline></svg>
              </a>
            ) : (
              <span className="pdp__nav-link" style={{ opacity: 0.4 }}>Next</span>
            )}
          </nav>
        </div>

        <div className="pdp__top">
          <div className="pdp__gallery">
            <div className="pdp__thumbs">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  className={`pdp__thumb${i === activeIdx ? " is-active" : ""}`}
                  onClick={() => { setActiveImg(img); setActiveIdx(i); }}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={img} alt="" loading="lazy" />
                </button>
              ))}
            </div>

            <figure className="pdp__main">
              <img src={activeImg} alt={product.name} loading="eager" onClick={() => setLightboxOpen(true)} />
              <span className="pdp__count"><em>{String(activeIdx + 1).padStart(2, "0")}</em><i></i><b>{String(images.length).padStart(2, "0")}</b></span>
              <button type="button" className="pdp__zoom" aria-label="Zoom image" onClick={() => setLightboxOpen(true)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3H3v6"></path><path d="M15 21h6v-6"></path><path d="M21 3h-6"></path><path d="M3 21h6"></path></svg>
              </button>
            </figure>
          </div>

          <div className="pdp__info">
            {product.badge && <p className="pdp__eyebrow">{product.badge}</p>}
            <h1 className="pdp__title">{product.name}</h1>

            <div className="pdp__priceRow">
              <span className="pdp__price">EGP {price.toLocaleString("en-US")}</span>
              {compareAt && <span className="pdp__compare">EGP {compareAt.toLocaleString("en-US")}</span>}
              {off && <span className="pdp__off">{off}% OFF</span>}
            </div>

            <div className="pdp__rating">
              <span className="pdp__stars" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg viewBox="0 0 24 24" key={i}><path d="M12 2 14.9 8.6 22 9.3 16.8 13.9 18.4 21 12 17.3 5.6 21 7.2 13.9 2 9.3 9.1 8.6Z"></path></svg>
                ))}
              </span>
              <span className="pdp__rating-num">{Number(product.rating).toFixed(1)}</span>
              <span className="pdp__rating-count">({product.review_count} reviews)</span>
            </div>

            <p className="pdp__desc">{product.description}</p>

            <span className="pdp__rule" aria-hidden="true"></span>

            {product.colors && product.colors.length > 0 && (
              <div className="pdp__option">
                <p className="pdp__option-label">Color</p>
                <div className="pdp__swatches">
                  {product.colors.map((c, i) => (
                    <button key={c} type="button" className={`pdp__swatch${i === 0 ? " is-active" : ""}`} style={{ background: c }} aria-label={c}></button>
                  ))}
                </div>
              </div>
            )}

            <div className="pdp__qtyRow">
              <div>
                <p className="pdp__option-label">Quantity:</p>
                <div className="qty pdp__qty" role="group" aria-label="Quantity">
                  <button type="button" className="qty__btn" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                    <svg viewBox="0 0 16 16" aria-hidden="true"><line x1="3" y1="8" x2="13" y2="8"></line></svg>
                  </button>
                  <span className="qty__num">{qty}</span>
                  <button type="button" className="qty__btn" aria-label="Increase quantity" onClick={() => setQty((q) => q + 1)}>
                    <svg viewBox="0 0 16 16" aria-hidden="true"><line x1="8" y1="3" x2="8" y2="13"></line><line x1="3" y1="8" x2="13" y2="8"></line></svg>
                  </button>
                </div>
              </div>
              <p className="pdp__stock">
                <span className="pdp__stock-dot" aria-hidden="true"></span>
                {product.stock_qty > 0 ? "In Stock" : "Out of Stock"}<br /><small>{product.stock_qty > 0 ? "Ready to ship" : "Restocking soon"}</small>
              </p>
            </div>

            <div className="pdp__actions">
              <button type="button" className="pdp-btn pdp-btn--dark" onClick={handleAddToCart} disabled={product.stock_qty <= 0}>
                <span>Add to Cart — <span>EGP {price.toLocaleString("en-US")}</span></span>
              </button>
              <button type="button" className="pdp-fav" aria-label="Save to wishlist" aria-pressed={fav} onClick={() => setFav((v) => !v)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4 4.6 13.2a4.6 4.6 0 1 1 7.4-5.3 4.6 4.6 0 1 1 7.4 5.3Z"></path></svg>
              </button>
            </div>

            <ul className="pdp__trust">
              <li><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M2.6 8.4h14v12.8h-14z"></path><path d="M16.6 12.4h6.6l4.2 4.2v4.6h-10.8z"></path><circle cx="9.2" cy="24" r="2.6"></circle><circle cx="22.6" cy="24" r="2.6"></circle></svg><span>Free Delivery<br />Across Egypt</span></li>
              <li><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4.4 9.8A12 12 0 1 1 4 16"></path><polyline points="4.4,4.2 4.4,9.8 10,9.8"></polyline></svg><span>Easy Returns<br />Within 14 Days</span></li>
              <li><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="6.4" y="14" width="19.2" height="14" rx="2.4"></rect><path d="M10.8 14V10a5.2 5.2 0 0 1 10.4 0v4"></path><circle cx="16" cy="21" r="1.6"></circle></svg><span>Secure Payment<br />100% Safe</span></li>
            </ul>

            <span className="pdp__rule" aria-hidden="true"></span>

            <div className="pdp__accordions">
              {[
                { title: "Product Details", body: product.description || "" },
                { title: "Materials & Care", body: `${product.material || "Quality materials"}. Wipe clean with a soft, dry cloth. Avoid harsh chemicals and prolonged direct sunlight.` },
                { title: "Shipping & Returns", body: "Free delivery across Egypt on orders over EGP 3,000. Easy returns within 14 days of delivery, provided the item is unused and in its original packaging." },
              ].map((acc, i) => (
                <div className="acc" key={i}>
                  <button type="button" className="acc__head" aria-expanded={openAcc === i} onClick={() => setOpenAcc(openAcc === i ? null : i)}>
                    <span>{acc.title}</span>
                    <span className="acc__plus" aria-hidden="true"><svg viewBox="0 0 16 16"><line x1="8" y1="2" x2="8" y2="14"></line><line x1="2" y1="8" x2="14" y2="8"></line></svg></span>
                  </button>
                  <div className="acc__body" style={{ maxHeight: openAcc === i ? "400px" : "0px" }}>
                    <p>{acc.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="pdp__story">
          <p className="pdp__story-kicker">Handcrafted With Purpose</p>
          <h2 className="pdp__story-title">Natural Texture,<br />Timeless Beauty.</h2>
          <p className="pdp__story-text">Each piece is carefully handcrafted, featuring a unique texture and earthy tones that make it a perfect addition to any interior style.</p>
          <ul className="pdp__features">
            <li><span className="pdp__feature-ico" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 4c6 6 6 14 0 24-6-10-6-18 0-24Z"></path></svg></span><strong>100%</strong><span>Handcrafted</span></li>
            <li><span className="pdp__feature-ico" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 3 27 12l-11 17L5 12Z"></path></svg></span><strong>Premium</strong><span>{product.material || "Quality"} Material</span></li>
            <li><span className="pdp__feature-ico" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M6 12v10a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V12"></path></svg></span><strong>Unique</strong><span>Each Piece is One of a Kind</span></li>
          </ul>
        </section>
      </div>

      <div className="pdp-lightbox" data-open={lightboxOpen ? "true" : "false"} aria-hidden={!lightboxOpen}>
        <button type="button" className="pdp-lightbox__scrim" tabIndex={-1} aria-label="Close zoom" onClick={() => setLightboxOpen(false)}></button>
        <div className="pdp-lightbox__stage">
          <img src={activeImg} alt={product.name} onClick={() => setLightboxOpen(false)} />
          <button type="button" className="pdp-lightbox__close" aria-label="Close zoom" onClick={() => setLightboxOpen(false)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="4.6" y1="4.6" x2="19.4" y2="19.4"></line><line x1="19.4" y1="4.6" x2="4.6" y2="19.4"></line></svg>
          </button>
        </div>
      </div>
    </main>
  );
}
