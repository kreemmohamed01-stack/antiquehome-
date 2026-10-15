// 3D tilt + cursor spotlight for dashboard cards (styles in css/admin-luxe.css).
// Pure decoration: it only sets CSS variables and a class on the card under
// the mouse — no layout, content or event handling of the page is touched.
// Mouse/trackpad only; touch screens and reduced-motion users get none of it.
(function () {
  if (!window.matchMedia || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const SEL = ".admin__panel, .admin__stat, .admin__action, .admin__ocard, .admin__optCard, .an__panel, .an__kpi, .an__trioItem, .an__cartItem, .an__funnelStep";
  let current = null;
  let raf = 0;
  let lastEvt = null;

  function release(card) {
    if (!card) return;
    card.classList.remove("lx-hot");
    card.style.removeProperty("--lx-rx");
    card.style.removeProperty("--lx-ry");
  }

  function update() {
    raf = 0;
    const e = lastEvt;
    if (!e) return;
    // The innermost card wins (e.g. a stat card inside a panel).
    const card = e.target.closest && e.target.closest(SEL);
    if (card !== current) {
      release(current);
      current = card;
      if (card) card.classList.add("lx-hot");
    }
    if (!card) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;   // 0..1
    const py = (e.clientY - r.top) / r.height;
    // Big panels tilt less than small tiles so wide tables stay readable.
    const max = r.width > 520 ? 2.2 : r.width > 300 ? 5 : 9;
    card.style.setProperty("--lx-ry", ((px - 0.5) * 2 * max).toFixed(2) + "deg");
    card.style.setProperty("--lx-rx", ((0.5 - py) * 2 * max).toFixed(2) + "deg");
    card.style.setProperty("--lx-mx", (px * 100).toFixed(1) + "%");
    card.style.setProperty("--lx-my", (py * 100).toFixed(1) + "%");
  }

  document.addEventListener("pointermove", (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    lastEvt = e;
    if (!raf) raf = requestAnimationFrame(update);
  }, { passive: true });
  document.addEventListener("pointerleave", () => { release(current); current = null; });
  window.addEventListener("blur", () => { release(current); current = null; });
})();
