"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product, SiteSale } from "@/lib/db";
import { effectiveSalePercent, priceWithSale, stockState } from "@/lib/db";
import { addToCart } from "@/lib/cart";
import { cldUrl } from "@/lib/cloudinaryUrl";

export default function ProductDetail({
  product,
  prevSlug,
  nextSlug,
  siteSale,
}: {
  product: Product;
  prevSlug: string | null;
  nextSlug: string | null;
  siteSale?: SiteSale;
}) {
  const colorOptions = product.color_options || [];
  const variants = product.variants || [];

  const [colorIdx, setColorIdx] = useState(0);
  const [variantIdx, setVariantIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [fav, setFav] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [openAcc, setOpenAcc] = useState<number | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [added, setAdded] = useState(false);

  // gallery follows the selected colour when that colour has its own shots
  const images = useMemo(() => {
    const own = colorOptions[colorIdx]?.imageUrls;
    if (own && own.length) return own;
    return product.image_urls && product.image_urls.length ? product.image_urls : ["/logo hero.png"];
  }, [colorOptions, colorIdx, product.image_urls]);

  const activeImg = images[Math.min(activeIdx, images.length - 1)];

  useEffect(() => {
    setActiveIdx(0);
  }, [colorIdx, product.id]);

  const selectedVariant = variants[variantIdx];
  const basePrice = selectedVariant ? Number(selectedVariant.price) : Number(product.price);
  const sale = siteSale || { active: false, percent: 0, label: "" };
  const salePct = effectiveSalePercent(product, sale);
  const price = salePct > 0 ? priceWithSale(basePrice, salePct) : basePrice;
  const saleText = salePct > 0 ? (product.sale_label && product.sale_percent ? product.sale_label : `Sale ${salePct}%`) : "";
  const compareAt = product.compare_at_price ? Number(product.compare_at_price) : null;
  const off = salePct > 0 ? salePct
    : compareAt && compareAt > basePrice ? Math.round(((compareAt - basePrice) / compareAt) * 100)
    : null;

  // stock follows the selected size when sizes carry their own stock
  const stockQty = selectedVariant ? Number(selectedVariant.stock) : product.stock_qty;
  const state = stockState({ stock_qty: stockQty, low_stock_threshold: product.low_stock_threshold });

  const setSize = product.pricing_mode === "set" ? product.set_size : null;
  const perPiece = product.price_per_piece ? Number(product.price_per_piece) : null;

  function handleAddToCart() {
    if (state === "out") return;
    addToCart(
      {
        id: product.slug + (selectedVariant ? `::${selectedVariant.label}` : "") + (colorOptions[colorIdx] ? `::${colorOptions[colorIdx].name}` : ""),
        name: product.name,
        price,
        image: images[0],
        variant: [colorOptions[colorIdx]?.name, selectedVariant?.label].filter(Boolean).join(" · ") || undefined,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
    document.getElementById("cartBtn")?.click();
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
                  key={img + i}
                  type="button"
                  className={`pdp__thumb${i === activeIdx ? " is-active" : ""}`}
                  onClick={() => setActiveIdx(i)}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={cldUrl(img, 160)} alt="" loading="lazy" />
                </button>
              ))}
            </div>

            <figure className="pdp__main">
              <img src={cldUrl(activeImg, 900)} alt={product.name} loading="eager" onClick={() => setLightboxOpen(true)} />
              <span className="pdp__count">
                <em>{String(activeIdx + 1).padStart(2, "0")}</em><i></i><b>{String(images.length).padStart(2, "0")}</b>
              </span>
              <button type="button" className="pdp__zoom" aria-label="Zoom image" onClick={() => setLightboxOpen(true)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3H3v6"></path><path d="M15 21h6v-6"></path><path d="M21 3h-6"></path><path d="M3 21h6"></path></svg>
              </button>
            </figure>
          </div>

          <div className="pdp__info">
            {salePct > 0 ? (
              <p className="pdp__eyebrow" style={{ color: "#A93B29" }}>{saleText}</p>
            ) : product.is_new_arrival ? (
              <p className="pdp__eyebrow">New Arrival</p>
            ) : product.badge ? (
              <p className="pdp__eyebrow">{product.badge}</p>
            ) : null}

            <h1 className="pdp__title">{product.name}</h1>

            <div className="pdp__priceRow">
              <span className="pdp__price" style={salePct > 0 ? { color: "#A93B29" } : undefined}>
                EGP {price.toLocaleString("en-US")}
              </span>
              {salePct > 0 ? (
                <span className="pdp__compare">EGP {basePrice.toLocaleString("en-US")}</span>
              ) : (
                compareAt && <span className="pdp__compare">EGP {compareAt.toLocaleString("en-US")}</span>
              )}
              {off ? <span className="pdp__off">{off}% OFF</span> : null}
            </div>

            {setSize ? (
              <p style={{ margin: "-6px 0 14px", fontSize: 12.5, color: "var(--ink-600)" }}>
                Sold as a set of {setSize}
                {perPiece ? ` — EGP ${perPiece.toLocaleString("en-US")} per piece` : ""}
              </p>
            ) : null}

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

            {colorOptions.length > 0 && (
              <div className="pdp__option">
                <p className="pdp__option-label">
                  Color{colorOptions[colorIdx] ? `: ${colorOptions[colorIdx].name}` : ""}
                </p>
                <div className="pdp__swatches">
                  {colorOptions.map((c, i) => (
                    <button
                      key={c.name}
                      type="button"
                      className={`pdp__swatch${i === colorIdx ? " is-active" : ""}`}
                      style={{ background: c.hex }}
                      aria-label={c.name}
                      title={c.name}
                      onClick={() => setColorIdx(i)}
                    />
                  ))}
                </div>
              </div>
            )}

            {variants.length > 0 && (
              <div className="pdp__option">
                <p className="pdp__option-label">Size</p>
                <div className="pdp__sizes">
                  {variants.map((v, i) => {
                    const vOut = Number(v.stock) <= 0;
                    return (
                      <button
                        key={v.label}
                        type="button"
                        className={`pdp__size${i === variantIdx ? " is-active" : ""}`}
                        onClick={() => setVariantIdx(i)}
                        disabled={vOut}
                        style={vOut ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
                      >
                        {v.label}
                        <small>
                          {vOut
                            ? "Sold out"
                            : `EGP ${(salePct > 0 ? priceWithSale(v.price, salePct) : Number(v.price)).toLocaleString("en-US")}`}
                        </small>
                      </button>
                    );
                  })}
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
                  <button
                    type="button"
                    className="qty__btn"
                    aria-label="Increase quantity"
                    onClick={() => setQty((q) => Math.min(Math.max(1, stockQty || 1), q + 1))}
                  >
                    <svg viewBox="0 0 16 16" aria-hidden="true"><line x1="8" y1="3" x2="8" y2="13"></line><line x1="3" y1="8" x2="13" y2="8"></line></svg>
                  </button>
                </div>
              </div>
              <p className="pdp__stock">
                <span
                  className="pdp__stock-dot"
                  style={{ background: state === "out" ? "#A93B29" : state === "low" ? "#D9A441" : "#5C6B4A" }}
                  aria-hidden="true"
                ></span>
                {state === "out" ? "Out of Stock" : state === "low" ? "Low Stock" : "In Stock"}
                <br />
                <small>
                  {state === "out"
                    ? "Restocking soon"
                    : state === "low"
                    ? `Only ${stockQty} left`
                    : "Ready to ship"}
                </small>
              </p>
            </div>

            <div className="pdp__actions">
              <button
                type="button"
                className="pdp-btn pdp-btn--dark"
                onClick={handleAddToCart}
                disabled={state === "out"}
              >
                <span>
                  {state === "out"
                    ? "Out of Stock"
                    : added
                    ? "Added to Cart ✓"
                    : <>Add to Cart — <span>EGP {(price * qty).toLocaleString("en-US")}</span></>}
                </span>
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
                { title: "Product Details", body: `${product.description || ""}${product.size_cm ? `\nDimensions: ${product.size_cm}` : ""}${product.sku ? `\nSKU: ${product.sku}` : ""}` },
                { title: "Materials & Care", body: `${product.material || "Quality materials"}. Wipe clean with a soft, dry cloth. Avoid harsh chemicals and prolonged direct sunlight.` },
                { title: "Shipping & Returns", body: "Delivery across Egypt with standard or express shipping, priced by governorate at checkout. Easy returns within 14 days of delivery, provided the item is unused and in its original packaging." },
              ].map((acc, i) => (
                <div className="acc" key={i}>
                  <button type="button" className="acc__head" aria-expanded={openAcc === i} onClick={() => setOpenAcc(openAcc === i ? null : i)}>
                    <span>{acc.title}</span>
                    <span className="acc__plus" aria-hidden="true"><svg viewBox="0 0 16 16"><line x1="8" y1="2" x2="8" y2="14"></line><line x1="2" y1="8" x2="14" y2="8"></line></svg></span>
                  </button>
                  <div className="acc__body" style={{ maxHeight: openAcc === i ? "400px" : "0px" }}>
                    <p style={{ whiteSpace: "pre-line" }}>{acc.body}</p>
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
          <img src={cldUrl(activeImg, 1600)} alt={product.name} onClick={() => setLightboxOpen(false)} />
          <button type="button" className="pdp-lightbox__close" aria-label="Close zoom" onClick={() => setLightboxOpen(false)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="4.6" y1="4.6" x2="19.4" y2="19.4"></line><line x1="19.4" y1="4.6" x2="4.6" y2="19.4"></line></svg>
          </button>
        </div>
      </div>
    </main>
  );
}
