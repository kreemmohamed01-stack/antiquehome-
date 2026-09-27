"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Full-page white loading screen with a 0→100% progress ring, shown for
 * ~1.5s on every route change so navigation always feels like it's doing
 * something real, even when the next page is already cached.
 */
export default function RouteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [pct, setPct] = useState(0);
  const firstRun = useRef(true);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Don't show it on the very first paint of the app — only on
    // subsequent navigations.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    const DURATION = 1500;
    const start = performance.now();
    setPct(0);
    setVisible(true);

    function tick(now: number) {
      const elapsed = now - start;
      const next = Math.min(100, Math.round((elapsed / DURATION) * 100));
      setPct(next);
      if (elapsed < DURATION) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setVisible(false);
      }
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div className="routeLoader" role="status" aria-live="polite">
      <div className="routeLoader__ring">
        <svg viewBox="0 0 80 80" width="80" height="80">
          <circle cx="40" cy="40" r="34" className="routeLoader__track" />
          <circle
            cx="40"
            cy="40"
            r="34"
            className="routeLoader__bar"
            style={{
              strokeDasharray: 2 * Math.PI * 34,
              strokeDashoffset: 2 * Math.PI * 34 * (1 - pct / 100),
            }}
          />
        </svg>
        <span className="routeLoader__pct">{pct}%</span>
      </div>
    </div>
  );
}
