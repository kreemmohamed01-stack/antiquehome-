/* =========================================================
   AMBIENT MUSIC TOGGLE
   Visitor-controlled — never autoplays with sound.
   Remembers on/off choice across pages via localStorage.
   ========================================================= */
(function () {
  "use strict";

  var STORAGE_KEY = "ah_music_on";

  var audio = document.getElementById("bgMusic");
  var btn   = document.getElementById("musicToggle");
  if (!audio || !btn) return;

  audio.volume = 0.35; // keep it ambient, not loud

  function setPlaying(isPlaying) {
    btn.setAttribute("aria-pressed", isPlaying ? "true" : "false");
    btn.setAttribute("aria-label", isPlaying ? "Pause ambient music" : "Play ambient music");
  }

  function play() {
    audio.play()
      .then(function () {
        setPlaying(true);
        localStorage.setItem(STORAGE_KEY, "1");
      })
      .catch(function () {
        // autoplay blocked or file missing — stay in "off" state
        setPlaying(false);
      });
  }

  function pause() {
    audio.pause();
    setPlaying(false);
    localStorage.setItem(STORAGE_KEY, "0");
  }

  btn.addEventListener("click", function () {
    if (audio.paused) play();
    else pause();
  });

  // If the visitor had it on (e.g. moved between pages), resume —
  // this still requires the click to have happened at least once per
  // browser session for autoplay policies, so failure here is silent.
  if (localStorage.getItem(STORAGE_KEY) === "1") {
    play();
  }
})();
