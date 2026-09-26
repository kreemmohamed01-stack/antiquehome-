"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Point = { date: string; label: string; value: number };

export default function SalesChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D9AE63" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#D9AE63" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#9C9284", fontSize: 10 }}
          axisLine={{ stroke: "rgba(255,255,255,.08)" }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "#9C9284", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={40}
          tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}K` : String(v))}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as Point;
            return (
              <div className="admin-tooltip">
                <div>{p.date}</div>
                <div>EGP {p.value.toLocaleString("en-US")}</div>
              </div>
            );
          }}
        />
        <Area type="monotone" dataKey="value" stroke="#D9AE63" strokeWidth={2} fill="url(#salesFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
