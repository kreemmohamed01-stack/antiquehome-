"use client";

import { useEffect } from "react";

export default function MusicPlayer() {
  useEffect(() => {
    const STORAGE_KEY = "ah_music_on";
    const audio = document.getElementById("bgMusic") as HTMLAudioElement | null;
    const btn = document.getElementById("musicToggle");
    if (!audio || !btn) return;

    audio.volume = 0.35;

    function setPlaying(isPlaying: boolean) {
      btn!.setAttribute("aria-pressed", isPlaying ? "true" : "false");
      btn!.setAttribute("aria-label", isPlaying ? "Pause ambient music" : "Play ambient music");
    }

    function play() {
      audio!
        .play()
        .then(() => {
          setPlaying(true);
          try {
            localStorage.setItem(STORAGE_KEY, "1");
          } catch {}
        })
        .catch(() => setPlaying(false));
    }

    function pause() {
      audio!.pause();
      setPlaying(false);
      try {
        localStorage.setItem(STORAGE_KEY, "0");
      } catch {}
    }

    function onClick() {
      if (audio!.paused) play();
      else pause();
    }
    btn.addEventListener("click", onClick);

    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") play();
    } catch {}

    return () => btn.removeEventListener("click", onClick);
  }, []);

  return (
    <>
      <audio id="bgMusic" src="/audio/ambient.mp3" loop preload="none"></audio>
      <button className="music-toggle" type="button" id="musicToggle" aria-pressed="false" aria-label="Play ambient music">
        <svg className="music-toggle__off" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 6.6 15.2 3v18L9 17.4"></path>
          <path d="M9 6.6H4.4a1 1 0 0 0-1 1v8.8a1 1 0 0 0 1 1H9"></path>
          <line x1="18.6" y1="9" x2="22.2" y2="15"></line>
          <line x1="22.2" y1="9" x2="18.6" y2="15"></line>
        </svg>
        <svg className="music-toggle__on" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 6.6 15.2 3v18L9 17.4"></path>
          <path d="M9 6.6H4.4a1 1 0 0 0-1 1v8.8a1 1 0 0 0 1 1H9"></path>
          <path d="M18.4 8.4a5 5 0 0 1 0 7.2"></path>
          <path d="M20.8 6a8.4 8.4 0 0 1 0 12"></path>
        </svg>
      </button>
    </>
  );
}
