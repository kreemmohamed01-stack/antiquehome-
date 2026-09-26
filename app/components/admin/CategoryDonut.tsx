"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const COLORS = ["#D9AE63", "#B98A3F", "#8A6E48", "#6F93C5", "#6FA36B", "#C5645A"];

export type Slice = { name: string; value: number; pct: number };

export default function CategoryDonut({ data, total }: { data: Slice[]; total: number }) {
  return (
    <div style={{ position: "relative" }}>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data.length ? data : [{ name: "No sales yet", value: 1, pct: 0 }]}
            dataKey="value"
            innerRadius={54}
            outerRadius={78}
            paddingAngle={data.length > 1 ? 2 : 0}
            stroke="none"
          >
            {(data.length ? data : [{ name: "empty", value: 1, pct: 0 }]).map((_, i) => (
              <Cell key={i} fill={data.length ? COLORS[i % COLORS.length] : "#2A2419"} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: 17, color: "var(--a-cream)" }}>
          {total > 0 ? "EGP " + Math.round(total).toLocaleString("en-US") : "—"}
        </div>
        <div style={{ fontSize: 9.5, color: "var(--a-text-dim)" }}>Total Sales</div>
      </div>
    </div>
  );
}
