"use client";

import { useEffect } from "react";

export default function AboutStats() {
  useEffect(() => {
    const stats = document.querySelectorAll(".about__stats strong[data-count]");
    if (!stats.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DURATION = 2000;

    function animateCount(el: Element) {
      const target = parseFloat(el.getAttribute("data-count") || "0") || 0;
      const suffix = el.getAttribute("data-suffix") || "";
      if (reduced) {
        el.textContent = target + suffix;
        return;
      }
      let start: number | null = null;
      const ease = (t: number) => 1 - Math.pow(1 - t, 3);
      function step(ts: number) {
        if (start === null) start = ts;
        const progress = Math.min(1, (ts - start) / DURATION);
        const value = Math.round(target * ease(progress));
        el.textContent = value + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      }
      requestAnimationFrame(step);
    }

    let done = false;
    function trigger() {
      if (done) return;
      done = true;
      stats.forEach((el) => animateCount(el));
    }

    if ("IntersectionObserver" in window) {
      const wrap = document.querySelector(".about__stats");
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              trigger();
              io.disconnect();
            }
          });
        },
        { threshold: 0.4 }
      );
      if (wrap) io.observe(wrap);
      else trigger();
      return () => io.disconnect();
    } else {
      trigger();
    }
  }, []);

  return null;
}
