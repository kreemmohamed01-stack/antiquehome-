"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function onLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button type="button" className={className} onClick={onLogout} aria-label="Sign out">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 4.6H6a2 2 0 0 0-2 2v10.8a2 2 0 0 0 2 2h3"></path>
        <path d="M15.4 16.4 20 12l-4.6-4.4"></path>
        <line x1="20" y1="12" x2="9" y2="12"></line>
      </svg>
    </button>
  );
}
