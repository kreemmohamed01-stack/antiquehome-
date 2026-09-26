"use client";

import type { Product } from "@/lib/db";
import { useEffect, useRef } from "react";

export default function ProductRail({ products }: { products: Product[] }) {
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rail = railRef.current;
    const prev = document.querySelector('[data-rail="prev"]') as HTMLButtonElement | null;
    const next = document.querySelector('[data-rail="next"]') as HTMLButtonElement | null;
    if (!rail || !prev || !next) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function step() {
      const card = rail!.querySelector(".card");
      if (!card) return rail!.clientWidth * 0.8;
      const gap = parseFloat(getComputedStyle(rail!).columnGap) || 14;
      return card.getBoundingClientRect().width + gap;
    }

    const nav = prev.parentElement!;

    function sync() {
      const slack = rail!.scrollWidth - rail!.clientWidth;
      const idle = slack < 4;
      nav.classList.toggle("idle", idle);
      prev!.disabled = idle || rail!.scrollLeft < 4;
      next!.disabled = idle || rail!.scrollLeft > slack - 4;
    }

    const onPrev = () => rail!.scrollBy({ left: -step(), behavior: reduced ? "auto" : "smooth" });
    const onNext = () => rail!.scrollBy({ left: step(), behavior: reduced ? "auto" : "smooth" });

    prev.addEventListener("click", onPrev);
    next.addEventListener("click", onNext);
    rail.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();

    return () => {
      prev.removeEventListener("click", onPrev);
      next.removeEventListener("click", onNext);
      rail.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [products]);

  if (!products.length) return <div className="rail" id="productRail" ref={railRef} />;

  return (
    <div className="rail" id="productRail" ref={railRef}>
      {products.map((p, i) => (
        <article className="card" key={p.id} data-href={`/product/${p.slug}`}>
          <figure className="card__media">
            <img src={(p.image_urls || [])[0] || ""} alt={p.name} loading="lazy" />
            <span className="card__no">{String(i + 2).padStart(2, "0")}</span>
            <button className="fav fav--sm" type="button" aria-label={`Save ${p.name}`} aria-pressed="false">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4 4.6 13.2a4.6 4.6 0 1 1 7.4-5.3 4.6 4.6 0 1 1 7.4 5.3Z"></path></svg>
            </button>
          </figure>
          <div className="card__body">
            <h3 className="card__name">{p.name}</h3>
            <p className="card__cat">Decor</p>
            <p className="card__price">EGP {Number(p.price).toLocaleString("en-US")}</p>
            <button
              className="add"
              type="button"
              data-add={p.name}
              data-add-id={p.slug}
              data-add-price={p.price}
              data-add-image={(p.image_urls || [])[0] || ""}
              aria-label={`Add ${p.name} to cart`}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true"><line x1="10" y1="4.4" x2="10" y2="15.6"></line><line x1="4.4" y1="10" x2="15.6" y2="10"></line></svg>
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
