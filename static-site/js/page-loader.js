// "Loading" screen: only appears if the page is still parsing 900ms after
// the click; the gold word fills as it loads and fades out on window "load"
// (5s cap). Inlined into each page at build time (data-inline) so it runs
// before the rest of the page parses.
(function () {
  var el = document.getElementById("pageLoader"), fill = document.getElementById("plFill"), line = document.getElementById("plLine");
  var shown = 0, target = 0, done = false;
  function paint() {
    fill.style.clipPath = "inset(0 " + (100 - shown) + "% 0 0)";
    line.style.transform = "scaleX(" + shown / 100 + ")";
    el.setAttribute("aria-valuenow", shown);
  }
  function tick() {
    if (!done) target = Math.min(90, target + (90 - target) * 0.06 + 0.4);
    if (shown < target) shown = Math.min(100, Math.ceil(shown + Math.max(1, (target - shown) * (done ? 0.35 : 0.15))));
    paint();
    if (shown >= 100) {
      setTimeout(function () { el.classList.add("is-done"); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 650); }, 250);
      return;
    }
    requestAnimationFrame(tick);
  }
  function finish() { done = true; target = 100; }
  document.addEventListener("readystatechange", function () { if (document.readyState === "interactive") target = Math.max(target, 70); });
  window.addEventListener("load", finish);
  window.addEventListener("pageshow", function (e) { if (e.persisted && el.parentNode) el.parentNode.removeChild(el); });
  setTimeout(function () {
    if (document.readyState !== "loading" || done) { el.parentNode && el.parentNode.removeChild(el); return; }
    el.hidden = false;
    requestAnimationFrame(function () { el.classList.add("is-on"); requestAnimationFrame(tick); });
    setTimeout(finish, 5000);
  }, 900);
})();
