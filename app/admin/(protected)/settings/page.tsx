import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsForm from "@/app/components/admin/SettingsForm";

export const metadata = { title: "Settings — Antique Home Admin" };

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="admin__panel">
      <div className="admin__panel-head">
        <h2 className="admin__panel-title">Account Settings</h2>
      </div>
      <p style={{ fontSize: 12, color: "var(--a-text-dim)", marginBottom: 18 }}>
        Update your admin login username and password.
      </p>
      <SettingsForm currentUsername={session.email} />
    </div>
  );
}
