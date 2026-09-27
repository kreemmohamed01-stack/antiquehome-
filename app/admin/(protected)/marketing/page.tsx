import { sql } from "@/lib/db";

export const revalidate = 0;
export const metadata = { title: "Marketing — Antique Home Admin" };

async function getContacts() {
  try {
    return (await sql`
      SELECT email, MAX(customer_name) AS name, MAX(phone) AS phone, COUNT(*)::int AS orders
      FROM orders GROUP BY email ORDER BY orders DESC
    `) as { email: string; name: string; phone: string; orders: number }[];
  } catch {
    return [];
  }
}

export default async function AdminMarketingPage() {
  const contacts = await getContacts();
  const csv = ["Name,Email,Phone,Orders", ...contacts.map((c) => `${c.name},${c.email},${c.phone},${c.orders}`)].join("\n");
  const csvHref = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);

  return (
    <div className="admin__panel">
      <div className="admin__panel-head">
        <h2 className="admin__panel-title">Marketing Contacts</h2>
        {contacts.length > 0 ? (
          <a href={csvHref} download="antique-home-contacts.csv" className="admin__btn admin__btn--gold">
            Export CSV
          </a>
        ) : null}
      </div>
      <p style={{ fontSize: 12, color: "var(--a-text-dim)", marginBottom: 18 }}>
        Every customer who has placed an order, ready to reach out to for campaigns and offers.
      </p>
      {contacts.length > 0 ? (
        <table className="admin__table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th></tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.email}>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
                <td>{c.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ textAlign: "center", color: "var(--a-text-dim)", fontSize: 12, padding: "20px 0" }}>
          No customer contacts yet — they&rsquo;ll appear here once orders come in.
        </p>
      )}
    </div>
  );
}
