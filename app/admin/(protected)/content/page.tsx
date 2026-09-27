import { getAboutContent } from "@/lib/db";
import ContentForm from "@/app/components/admin/ContentForm";

export const revalidate = 0;
export const metadata = { title: "Content — Antique Home Admin" };

export default async function AdminContentPage() {
  const content = await getAboutContent();

  return (
    <div className="admin__panel">
      <div className="admin__panel-head">
        <h2 className="admin__panel-title">About Page Content</h2>
      </div>
      <p style={{ fontSize: 12, color: "var(--a-text-dim)", marginBottom: 18 }}>
        Edit the hero headline and intro text on the public About page.
      </p>
      <ContentForm initial={content} />
    </div>
  );
}
