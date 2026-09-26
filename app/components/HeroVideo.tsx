"use client";

import { useEffect, useRef } from "react";

export default function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const SOURCES = { mobile: "/hero video mop.mp4", desktop: "/hero vedio lab.mp4" };
    const wide = window.matchMedia("(min-width: 900px)");
    let current: "mobile" | "desktop" = "mobile";

    function play() {
      const p = video!.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }

    function loadSource() {
      const key: "mobile" | "desktop" = wide.matches ? "desktop" : "mobile";
      if (key === current) return;
      current = key;
      video!.src = SOURCES[key];
      video!.load();
      play();
    }

    play();
    loadSource();

    wide.addEventListener?.("change", loadSource);

    const onVis = () => {
      if (!document.hidden && video!.paused) play();
    };
    document.addEventListener("visibilitychange", onVis);

    const onceHandlers: Array<() => void> = [];
    ["touchstart", "click"].forEach((evt) => {
      const handler = () => {
        if (video!.paused) play();
        document.removeEventListener(evt, handler);
      };
      onceHandlers.push(handler);
      document.addEventListener(evt, handler, { passive: true });
    });

    return () => {
      wide.removeEventListener?.("change", loadSource);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div className="hero__media">
      <video
        ref={ref}
        className="hero__video"
        id="heroVideo"
        src="/hero video mop.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        aria-hidden="true"
        tabIndex={-1}
      ></video>
      <div className="hero__tint" aria-hidden="true"></div>
      <div className="hero__vignette" aria-hidden="true"></div>
    </div>
  );
}
