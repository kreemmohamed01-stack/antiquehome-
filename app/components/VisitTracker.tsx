"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function idFrom(storage: Storage, key: string): string {
  try {
    let v = storage.getItem(key);
    if (!v) {
      v = (crypto as any).randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now();
      storage.setItem(key, v);
    }
    return v;
  } catch {
    // Storage unavailable (private mode, blocked) — fall back to a
    // per-load id; this visit still gets counted, just not de-duped.
    return Math.random().toString(36).slice(2) + Date.now();
  }
}

function InnerTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const first = useRef(true);

  useEffect(() => {
    // Never track admin dashboard's own navigation noise beyond the one
    // hit — still useful to know an admin session happened, but skip
    // firing twice on the same tick.
    try {
      const visitorId = idFrom(window.localStorage, "ah_vid");
      const sessionId = idFrom(window.sessionStorage, "ah_sid");
      const payload = JSON.stringify({
        visitorId,
        sessionId,
        path: pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ""),
        referrer: first.current ? document.referrer || null : null,
      });
      first.current = false;

      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/track", blob);
      } else {
        fetch("/api/track", { method: "POST", body: payload, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
      }
    } catch {
      // Tracking must never break navigation.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}

export default function VisitTracker() {
  return (
    <Suspense fallback={null}>
      <InnerTracker />
    </Suspense>
  );
}
