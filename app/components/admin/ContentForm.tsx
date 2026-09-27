"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AboutContent } from "@/lib/db";

export default function ContentForm({ initial }: { initial: AboutContent }) {
  const router = useRouter();
  const [heroTitle, setHeroTitle] = useState(initial.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(initial.heroSubtitle);
  const [heroText, setHeroText] = useState(initial.heroText);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ heroTitle, heroSubtitle, heroText }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      alert("Failed to save.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="admin__form" style={{ maxWidth: 560 }}>
      {saved ? (
        <div style={{ background: "rgba(111,163,107,.12)", border: "1px solid rgba(111,163,107,.3)", color: "var(--a-green)", padding: "9px 12px", borderRadius: 8, fontSize: 11.5 }}>
          Saved — live on the About page now.
        </div>
      ) : null}
      <div className="admin__field">
        <label>Hero Title (first line)</label>
        <input type="text" value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} />
      </div>
      <div className="admin__field">
        <label>Hero Subtitle (second line, italic)</label>
        <input type="text" value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} />
      </div>
      <div className="admin__field">
        <label>Hero Paragraph</label>
        <textarea rows={4} value={heroText} onChange={(e) => setHeroText(e.target.value)} />
      </div>
      <button type="submit" className="admin__btn admin__btn--gold" disabled={saving} style={{ alignSelf: "flex-start" }}>
        {saving ? "Saving…" : "Save Content"}
      </button>
    </form>
  );
}
