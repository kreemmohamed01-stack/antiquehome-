"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Order } from "@/lib/db";

type Row = Order & { item_count: number; thumbs: string[] };

function fmt(n: string | number) {
  return "EGP " + Math.round(typeof n === "string" ? parseFloat(n) : n).toLocaleString("en-US");
}

function pill(status: string) {
  const cls =
    status === "delivered" ? "admin__pill admin__pill--delivered"
      : status === "shipped" ? "admin__pill admin__pill--shipped"
      : status === "processing" ? "admin__pill admin__pill--processing"
      : status === "cancelled" ? "admin__pill admin__pill--low"
      : "admin__pill admin__pill--pending";
  return <span className={cls}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

function dateLabel(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

const PAGE_SIZE = 10;
const TABS = ["all", "pending", "processing", "shipped", "delivered", "cancelled"] as const;

export default function OrdersManager({ orders }: { orders: Row[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    const by = (s: string) => orders.filter((o) => o.status === s).length;
    return {
      all: orders.length,
      pending: by("pending"),
      processing: by("processing"),
      shipped: by("shipped"),
      delivered: by("delivered"),
      cancelled: by("cancelled"),
    };
  }, [orders]);

  const filtered = useMemo(() => {
    let list = orders;
    if (tab !== "all") list = list.filter((o) => o.status === tab);
    const needle = q.trim().toLowerCase();
    if (needle) {
      list = list.filter(
        (o) =>
          o.order_number.toLowerCase().includes(needle) ||
          o.customer_name.toLowerCase().includes(needle) ||
          o.email.toLowerCase().includes(needle)
      );
    }
    return list;
  }, [orders, tab, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <>
      <div className="admin__pageHead">
        <img src="/sec 2/main sec 2.jpeg" alt="" />
        <div className="admin__pageHead-body">
          <p className="admin__crumb">
            <Link href="/admin">Dashboard</Link>
            <svg viewBox="0 0 12 8" aria-hidden="true"><polyline points="1,1.5 6,6.5 11,1.5" transform="rotate(-90 6 4)" fill="none" /></svg>
            <span>Orders</span>
          </p>
          <h1 className="admin__pageTitle">Orders</h1>
          <p className="admin__pageSub">Track, manage, and fulfill your customer orders.</p>
        </div>
        <p className="admin__pageQuote">&ldquo;Happy customers<br />build timeless brands.&rdquo;</p>
      </div>

      <div className="admin__statStrip admin__statStrip--6">
        {([
          ["Total Orders", counts.all, undefined],
          ["Pending", counts.pending, "var(--a-amber)"],
          ["Processing", counts.processing, "var(--a-blue)"],
          ["Shipped", counts.shipped, "var(--a-blue)"],
          ["Delivered", counts.delivered, "var(--a-green)"],
          ["Cancelled", counts.cancelled, "var(--a-red)"],
        ] as const).map(([label, value, color]) => (
          <div className="admin__stat" key={label}>
            <div className="admin__stat-top">
              <span className="admin__stat-label">{label}</span>
            </div>
            <div className="admin__stat-value" style={color ? { color } : undefined}>{value}</div>
          </div>
        ))}
      </div>

      <div className="admin__panel">
        <div className="admin__tabRow" style={{ marginBottom: 14 }}>
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={`admin__chip${tab === t ? " is-active" : ""}`}
              onClick={() => { setTab(t); setPage(1); }}
            >
              {t === "all" ? `All Orders (${counts.all})` : `${t.charAt(0).toUpperCase() + t.slice(1)} (${counts[t]})`}
            </button>
          ))}
        </div>

        <div className="admin__toolbar">
          <div className="admin__searchInline">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.4" /><line x1="15.7" y1="15.7" x2="20.2" y2="20.2" /></svg>
            <input
              type="text"
              placeholder="Search orders, customers…"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--a-text-dim)", fontSize: 12, padding: "40px 0" }}>
            No orders match this view.
          </p>
        ) : (
          <>
            {/* desktop table */}
            <div className="admin__ordersTable">
              <table className="admin__table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Products</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Delivery</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((o) => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600 }}>{o.order_number}</td>
                      <td>
                        <div className="admin__prow-name">{o.customer_name}</div>
                        <div className="admin__prow-sku">{o.email}</div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          {o.thumbs.slice(0, 2).map((t, i) => (
                            <img key={i} src={t} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }} />
                          ))}
                          {o.item_count > 2 ? <span style={{ fontSize: 10.5, color: "var(--a-text-dim)" }}>+{o.item_count - 2}</span> : null}
                        </div>
                        <div className="admin__prow-sku">{o.item_count} items</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{fmt(o.total)}</td>
                      <td>
                        <div style={{ fontSize: 11.5 }}>{o.payment_method}</div>
                        <div style={{ fontSize: 10, color: o.payment_status === "paid" ? "var(--a-green)" : "var(--a-amber)" }}>
                          {o.payment_status === "paid" ? "Paid" : "Pending"}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 11.5 }}>{o.courier || "—"}</div>
                        <div className="admin__prow-sku">{o.tracking_number || ""}</div>
                      </td>
                      <td>{pill(o.status)}</td>
                      <td style={{ fontSize: 11 }}>{dateLabel(o.created_at)}</td>
                      <td>
                        <Link href={`/admin/orders/${o.id}`} className="admin__iconAct" aria-label="View order">
                          <svg viewBox="0 0 24 24"><path d="M2.4 12S6 5.6 12 5.6 21.6 12 21.6 12 18 18.4 12 18.4 2.4 12 2.4 12Z" /><circle cx="12" cy="12" r="2.8" /></svg>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* mobile cards */}
            <div className="admin__ordersCards">
              {visible.map((o) => (
                <Link href={`/admin/orders/${o.id}`} key={o.id} className="admin__ocard" style={{ display: "block" }}>
                  <div className="admin__ocard-top">
                    <div>
                      <div className="admin__ocard-id">{o.order_number}</div>
                      <div className="admin__ocard-date">{dateLabel(o.created_at)}</div>
                    </div>
                    {pill(o.status)}
                  </div>
                  <div className="admin__ocard-cust">
                    <span className="admin__avatar" style={{ width: 28, height: 28, fontSize: 10 }}>
                      {o.customer_name.slice(0, 2).toUpperCase()}
                    </span>
                    <span style={{ flex: 1, fontSize: 12.5, color: "var(--a-cream)" }}>{o.customer_name}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--a-cream)" }}>{fmt(o.total)}</span>
                  </div>
                  {o.thumbs.length ? (
                    <div className="admin__ocard-thumbs">
                      {o.thumbs.slice(0, 3).map((t, i) => <img key={i} src={t} alt="" />)}
                      {o.item_count > 3 ? <span className="admin__ocard-more">+{o.item_count - 3}</span> : null}
                    </div>
                  ) : null}
                  <div className="admin__ocard-foot">
                    <span>{o.payment_method}</span>
                    <span>{o.courier || ""} {o.tracking_number || ""}</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {totalPages > 1 && (
          <div className="admin__pager">
            <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)}>‹</button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} type="button" className={current === i + 1 ? "is-active" : ""} onClick={() => setPage(i + 1)}>
                {i + 1}
              </button>
            ))}
            <button type="button" disabled={current === totalPages} onClick={() => setPage(current + 1)}>›</button>
          </div>
        )}
      </div>
    </>
  );
}
