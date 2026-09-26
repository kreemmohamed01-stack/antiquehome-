/* =========================================================
   ANTIQUE HOME — ABOUT PAGE
   Animated stat counters — count up over ~2s once the stats
   row scrolls into view, then hold at their final value.
   ========================================================= */

(function () {
  'use strict';

  var stats = document.querySelectorAll('.about__stats strong[data-count]');
  if (!stats.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DURATION = 2000; // ms

  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';

    if (reduced) {
      el.textContent = target + suffix;
      return;
    }

    var start = null;
    function ease(t) { return 1 - Math.pow(1 - t, 3); } // ease-out cubic

    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min(1, (ts - start) / DURATION);
      var value = Math.round(target * ease(progress));
      el.textContent = value + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target + suffix; // lock exact final value
      }
    }
    requestAnimationFrame(step);
  }

  var done = false;
  function trigger() {
    if (done) return;
    done = true;
    stats.forEach(function (el) { animateCount(el); });
  }

  if ('IntersectionObserver' in window) {
    var wrap = document.querySelector('.about__stats');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          trigger();
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });
    if (wrap) io.observe(wrap);
    else trigger();
  } else {
    trigger();
  }
})();
