// Overrides the hardcoded body-copy paragraphs with admin-edited text
// from the Content page, when set — the site's own default text (in
// the markup above) stays otherwise.
(async () => {
  let content = null;
  try { content = await API.get("/api/settings?key=site_content"); } catch { content = null; }
  if (!content) return;
  const map = {
    aboutHeroText: "aboutHeroText",
    aboutJourneyText: "aboutJourneyText",
    aboutPhilosophyText: "aboutPhilosophyText",
    aboutCtaText: "aboutCtaText",
  };
  for (const [key, elId] of Object.entries(map)) {
    const val = content[key];
    const el = document.getElementById(elId);
    if (val && el) {
      el.textContent = val;
      // This element's text just got overwritten with the admin's
      // English copy — keep AH_I18N.applyLang()'s "original English"
      // cache in sync, and re-run it if Arabic is currently active, so
      // this doesn't silently stay in English while the rest of the
      // page is translated (the element still has no Arabic version
      // of this custom text, so it falls back to the new English copy).
      el.removeAttribute("data-i18n-en");
      if (window.AH_I18N && window.AH_I18N.getLang() === "ar") window.AH_I18N.setLang("ar");
    }
  }
})();
