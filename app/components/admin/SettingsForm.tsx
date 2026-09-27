"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsForm({ currentUsername }: { currentUsername: string }) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState(currentUsername);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);
    const res = await fetch("/api/admin/settings/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newUsername, newPassword }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Failed to save.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="admin__form" style={{ maxWidth: 440 }}>
      {error ? <div className="admin__loginError">{error}</div> : null}
      {success ? (
        <div style={{ background: "rgba(111,163,107,.12)", border: "1px solid rgba(111,163,107,.3)", color: "var(--a-green)", padding: "9px 12px", borderRadius: 8, fontSize: 11.5 }}>
          Credentials updated successfully.
        </div>
      ) : null}

      <div className="admin__field">
        <label>Username</label>
        <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required />
      </div>

      <div className="admin__field">
        <label>New Password (leave blank to keep current)</label>
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
      </div>

      <div className="admin__field">
        <label>Current Password (required to confirm)</label>
        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
      </div>

      <button type="submit" className="admin__btn admin__btn--gold" disabled={saving} style={{ alignSelf: "flex-start" }}>
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}
