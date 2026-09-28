// Admin Analytics page. Every number here is read live from /api/analytics,
// which in turn reads real tables (orders, order_items, visits, cart_events)
// — nothing on this page is hardcoded demo data. If the store is brand new
// and those tables are still empty, the widgets simply show zeros / empty
// states rather than inventing numbers.
(function () {
  const RED = "#8E2A20";
  const GREEN = "#1E5C3A";
  const GOLD_DEEP = "#000000";
  const GRAY = "#4A463F";
  const BLUE = "#1B3F73";
  const AMBER = "#9A5B00";
  const PALETTE = [RED, GOLD_DEEP, AMBER, BLUE, GREEN, GRAY];

  function fmt(n) { return "EGP " + Math.round(n || 0).toLocaleString("en-US"); }
  function num(n) { return Math.round(n || 0).toLocaleString("en-US"); }
  function pct(n) { return (n >= 0 ? "+" : "") + n.toFixed(1) + "%"; }

  let state = { range: "30d", metric: "revenue", data: null };

  function deltaHtml(d) {
    const up = d >= 0;
    return `<span class="an__kpiDelta ${up ? "up" : "down"}">${up ? "↑" : "↓"} ${Math.abs(d).toFixed(1)}%</span>`;
  }

  function sparkline(values, color) {
    if (!values.length) return "";
    const w = 100, h = 30;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const pts = values.map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const path = "M" + pts.join(" L");
    const areaPath = `${path} L${w},${h} L0,${h} Z`;
    const id = "spark" + Math.random().toString(36).slice(2, 8);
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity=".25"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient></defs>
      <path d="${areaPath}" fill="url(#${id})" stroke="none"/>
      <path d="${path}" fill="none" stroke="${color}" stroke-width="1.6" vector-effect="non-scaling-stroke"/>
    </svg>`;
  }

  function renderKpis(k, daily) {
    const revSeries = daily.map((d) => d.revenue);
    const orderSeries = daily.map((d) => d.orders);
    const custSeries = daily.map((d) => d.customers);
    const cards = [
      {
        label: "Total Revenue", value: fmt(k.revenue), delta: k.revenueDelta, spark: revSeries, color: RED,
        icon: `<path d="M4 4h16M4 10h16M4 16h10"></path>`,
      },
      {
        label: "Orders", value: num(k.orders), delta: k.ordersDelta, spark: orderSeries, color: GOLD_DEEP,
        icon: `<path d="M4 7h16l-1.5 11a1 1 0 0 1-1 1H6.5a1 1 0 0 1-1-1Z"></path><path d="M9 7V5a3 3 0 0 1 6 0v2"></path>`,
      },
      {
        label: "Average Order Value", value: fmt(k.aov), delta: k.aovDelta, spark: revSeries, color: AMBER,
        icon: `<circle cx="12" cy="12" r="9"></circle><path d="M9 12h6M12 9v6"></path>`,
      },
      {
        label: "Conversion Rate", value: k.conversion.toFixed(2) + "%", delta: k.conversionDelta, spark: orderSeries, color: BLUE,
        icon: `<path d="M4 20 10 8l4 6 6-10"></path>`,
      },
      {
        label: "Total Customers", value: num(k.customers), delta: k.customersDelta, spark: custSeries, color: GREEN,
        icon: `<circle cx="9" cy="8" r="3"></circle><path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1"></path><circle cx="18" cy="9" r="2.4"></circle>`,
      },
      {
        label: "New Customers", value: num(k.newCustomers), delta: null, spark: null, color: GREEN,
        icon: `<circle cx="10" cy="8" r="3"></circle><path d="M4 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1"></path><path d="M18 8v4M16 10h4"></path>`,
      },
      {
        label: "Returning Customers", value: num(k.returningCustomers), delta: null, spark: null, color: GRAY,
        icon: `<path d="M4 4v5h5M20 20v-5h-5"></path><path d="M20 9A8 8 0 0 0 6 5.3M4 15a8 8 0 0 0 14 3.7"></path>`,
      },
      {
        label: "Refunds", value: fmt(k.refunds), delta: null, spark: null, color: RED,
        icon: `<path d="M4 4v5h5"></path><path d="M20 9A8 8 0 0 0 4.6 8"></path>`,
      },
    ];
    document.getElementById("kpiGrid").innerHTML = cards.map((c) => `
      <div class="an__kpi">
        <div class="an__kpiTop">
          <div class="an__kpiIcon"><svg viewBox="0 0 24 24">${c.icon}</svg></div>
          <span class="an__kpiLabel">${c.label}</span>
        </div>
        <div class="an__kpiValue">${c.value}</div>
        ${c.delta !== null ? deltaHtml(c.delta) : `<span class="an__kpiDelta" style="color:var(--a-text-dim)">vs last period</span>`}
        ${c.spark && c.spark.length > 1 ? `<div class="an__kpiSpark">${sparkline(c.spark, c.color)}</div>` : ""}
      </div>
    `).join("");
  }

  // ---- Revenue & Orders line/area chart ----
  function renderChart() {
    const daily = state.data.daily;
    const wrap = document.getElementById("chartWrap");
    const tooltip = document.getElementById("chartTooltip");
    if (!daily.length) {
      wrap.innerHTML = `<p class="an__empty">No data in this period yet.</p>`;
      document.getElementById("chartLegend").innerHTML = "";
      return;
    }
    const metric = state.metric;
    const labelMap = { revenue: "Revenue (EGP)", orders: "Orders", customers: "Customers", aov: "AOV (EGP)" };
    const values = daily.map((d) => metric === "aov" ? (d.orders > 0 ? d.revenue / d.orders : 0) : d[metric]);

    const w = 900, h = 260, padL = 46, padB = 26, padT = 10, padR = 10;
    const max = Math.max(...values, 1) * 1.12;
    const min = 0;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    function xAt(i) { return padL + (i / (values.length - 1 || 1)) * plotW; }
    function yAt(v) { return padT + plotH - ((v - min) / (max - min || 1)) * plotH; }

    const linePts = values.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`);
    const linePath = "M" + linePts.join(" L");
    const areaPath = `${linePath} L${xAt(values.length - 1).toFixed(1)},${(h - padB).toFixed(1)} L${xAt(0).toFixed(1)},${(h - padB).toFixed(1)} Z`;

    // gridlines + y labels (4 bands)
    let grid = "";
    for (let i = 0; i <= 4; i++) {
      const v = (max / 4) * i;
      const y = yAt(v);
      grid += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${w - padR}" y2="${y.toFixed(1)}" stroke="var(--a-border)" stroke-width="1"/>`;
      grid += `<text x="${padL - 8}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--a-text-dim)" font-family="var(--mono)">${metric === "revenue" || metric === "aov" ? (v >= 1000 ? Math.round(v / 1000) + "K" : Math.round(v)) : Math.round(v)}</text>`;
    }
    // x labels: ~6 evenly spaced dates
    let xlabels = "";
    const step = Math.max(1, Math.floor(values.length / 6));
    daily.forEach((d, i) => {
      if (i % step !== 0 && i !== values.length - 1) return;
      const date = new Date(d.day + "T00:00:00");
      const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      xlabels += `<text x="${xAt(i).toFixed(1)}" y="${h - 6}" text-anchor="middle" font-size="10" fill="var(--a-text-dim)" font-family="var(--sans)">${label}</text>`;
    });

    const dotId = "chartDots";
    const dots = values.map((v, i) => `<circle class="chart-dot" data-i="${i}" cx="${xAt(i).toFixed(1)}" cy="${yAt(v).toFixed(1)}" r="9" fill="transparent"/>`).join("");
    const visDot = `<circle id="chartHoverDot" cx="0" cy="0" r="4" fill="${RED}" stroke="#fff" stroke-width="2" style="display:none"/>`;

    wrap.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" id="${dotId}">
        <defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${RED}" stop-opacity=".22"/>
          <stop offset="100%" stop-color="${RED}" stop-opacity="0"/>
        </linearGradient></defs>
        ${grid}
        <path d="${areaPath}" fill="url(#chartFill)" stroke="none"/>
        <path d="${linePath}" fill="none" stroke="${RED}" stroke-width="2.4"/>
        ${xlabels}
        ${dots}
        ${visDot}
      </svg>
      <div class="an__chartTooltip" id="chartTooltip"></div>
    `;

    const svgEl = document.getElementById(dotId);
    const tip = document.getElementById("chartTooltip");
    const hoverDot = document.getElementById("chartHoverDot");
    svgEl.querySelectorAll(".chart-dot").forEach((dot) => {
      dot.addEventListener("mouseenter", () => {
        const i = Number(dot.dataset.i);
        const d = daily[i];
        const v = values[i];
        const date = new Date(d.day + "T00:00:00");
        tip.innerHTML = `${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}<br><b>${labelMap[metric]}: ${metric === "revenue" || metric === "aov" ? fmt(v) : Math.round(v)}</b>`;
        const rect = svgEl.getBoundingClientRect();
        const px = (Number(dot.getAttribute("cx")) / w) * rect.width;
        const py = (Number(dot.getAttribute("cy")) / h) * rect.height;
        tip.style.left = px + "px";
        tip.style.top = py + "px";
        tip.classList.add("is-visible");
        hoverDot.setAttribute("cx", dot.getAttribute("cx"));
        hoverDot.setAttribute("cy", dot.getAttribute("cy"));
        hoverDot.style.display = "block";
      });
      dot.addEventListener("mouseleave", () => {
        tip.classList.remove("is-visible");
        hoverDot.style.display = "none";
      });
    });

    document.getElementById("chartLegend").innerHTML = `
      <span><i style="background:${RED}"></i>${labelMap[metric]}</span>
    `;
  }

  function renderLiveAndPages() {
    document.getElementById("liveNum").textContent = state.data.live;
    document.getElementById("liveDot").innerHTML = `${state.data.live} live`;
    const pages = state.data.pageCounts;
    const max = Math.max(...Object.values(pages), 1);
    const order = ["Homepage", "Shop", "Product Pages", "Checkout", "Other"];
    document.getElementById("pageRows").innerHTML = order.map((name) => `
      <div class="an__pageRow">
        <span class="an__pageRow-name">${name}</span>
        <div class="an__pageRow-bar"><i style="width:${Math.round((pages[name] / max) * 100)}%"></i></div>
        <span class="an__pageRow-val">${pages[name]}</span>
      </div>
    `).join("");
  }

  function renderGeo() {
    const rows = state.data.visitorsByLocation;
    const el = document.getElementById("geoRows");
    if (!rows.length) { el.innerHTML = `<p class="an__empty">No resolved visitor locations yet.</p>`; return; }
    el.innerHTML = rows.map((r, i) => `
      <div class="an__geoRow">
        <span class="an__geoDot" style="background:${PALETTE[i % PALETTE.length]}"></span>
        <span class="an__geoName">${r.country}</span>
        <span class="an__geoPct">${r.pct}%</span>
      </div>
    `).join("");
  }

  function renderTrio() {
    const d = state.data;
    const el = document.getElementById("trio");
    el.innerHTML = `
      <div class="an__trioItem">
        <div class="an__trioTop"><svg viewBox="0 0 24 24"><path d="M12 2 15 9l7 1-5 5 1.5 7-6.5-3.5L5 22l1.5-7-5-5 7-1Z"></path></svg>Best Sales Day</div>
        <div class="an__trioMain">${d.bestDay ? d.bestDay.day : "—"}</div>
        <div class="an__trioSub">${d.bestDay ? fmt(d.bestDay.total) : "No orders yet"}</div>
      </div>
      <div class="an__trioItem">
        <div class="an__trioTop"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 3"></path></svg>Best Sales Hour</div>
        <div class="an__trioMain">${d.bestHour ? d.bestHour.hour : "—"}</div>
        <div class="an__trioSub">${d.bestHour ? d.bestHour.orders + " orders" : "No orders yet"}</div>
      </div>
      <div class="an__trioItem">
        <div class="an__trioTop"><svg viewBox="0 0 24 24"><path d="M4 20 10 8l4 6 6-10"></path></svg>Growth</div>
        <div class="an__trioMain">${pct(d.kpis.revenueDelta)}</div>
        <div class="an__trioSub up">vs last period</div>
      </div>
    `;
  }

  function renderFunnel() {
    document.getElementById("funnel").innerHTML = state.data.funnel.map((s) => `
      <div class="an__funnelStep">
        <div class="an__funnelLabel">${s.label}</div>
        <div class="an__funnelValue">${num(s.value)}</div>
        <div class="an__funnelPct">${s.pct.toFixed(1)}%</div>
      </div>
    `).join("");
  }

  function renderTopProducts() {
    const rows = state.data.topProducts;
    const body = document.getElementById("topProductsBody");
    if (!rows.length) { body.innerHTML = `<tr><td colspan="6" class="an__empty">No product activity yet.</td></tr>`; return; }
    body.innerHTML = rows.map((p) => {
      const img = (p.image_urls || [])[0] || "/logo hero.png";
      const src = cldUrl(img, 80);
      return `
        <tr>
          <td><div class="an__ptRow"><img src="${src}" alt=""><span class="an__ptName">${p.name}</span></div></td>
          <td>${num(p.views)}</td>
          <td>${num(p.adds)}</td>
          <td>${num(p.orders)}</td>
          <td>${fmt(p.revenue)}</td>
          <td class="${p.conversion >= 4 ? "an__convUp" : "an__convDown"}">${p.conversion.toFixed(2)}%</td>
        </tr>
      `;
    }).join("");
  }

  function donutSegments(rows, valueKey, labelKey) {
    const total = rows.reduce((s, r) => s + r[valueKey], 0) || 1;
    let offset = 0;
    const R = 15.9155;
    const circumference = 2 * Math.PI * R;
    return rows.map((r, i) => {
      const frac = r[valueKey] / total;
      const dash = frac * circumference;
      const seg = `<circle cx="21" cy="21" r="${R}" fill="transparent" stroke="${PALETTE[i % PALETTE.length]}" stroke-width="6"
        stroke-dasharray="${dash.toFixed(2)} ${(circumference - dash).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}"/>`;
      offset += dash;
      return seg;
    }).join("");
  }

  function renderTraffic() {
    const rows = state.data.trafficSources;
    if (!rows.length) {
      document.getElementById("trafficDonut").innerHTML = "";
      document.getElementById("trafficDonutPct").textContent = "—";
      document.getElementById("trafficLegend").innerHTML = `<p class="an__empty">No traffic yet.</p>`;
      return;
    }
    document.getElementById("trafficDonut").innerHTML = donutSegments(rows, "count", "name");
    document.getElementById("trafficDonutPct").textContent = rows[0].pct + "%";
    document.getElementById("trafficDonutLabel").textContent = rows[0].name;
    document.getElementById("trafficLegend").innerHTML = rows.map((r, i) => `
      <div class="an__donutLegend-row">
        <span class="an__donutLegend-dot" style="background:${PALETTE[i % PALETTE.length]}"></span>
        <span class="an__donutLegend-name">${r.name}</span>
        <span class="an__donutLegend-pct">${r.pct}%</span>
      </div>
    `).join("");
  }

  function renderCustomerAnalytics() {
    const rows = state.data.custByMonth;
    const chart = document.getElementById("custBarChart");
    if (!rows.length) {
      chart.innerHTML = `<p class="an__empty">No customer history yet.</p>`;
    } else {
      const max = Math.max(...rows.map((r) => Math.max(r.new_customers, r.returning_customers)), 1);
      chart.innerHTML = rows.map((r) => `
        <div class="an__barGroup">
          <div class="an__barPair">
            <div class="an__bar new" style="height:${Math.max(2, (r.new_customers / max) * 100)}%" title="New: ${r.new_customers}"></div>
            <div class="an__bar returning" style="height:${Math.max(2, (r.returning_customers / max) * 100)}%" title="Returning: ${r.returning_customers}"></div>
          </div>
          <span class="an__barGroupLabel">${r.month}</span>
        </div>
      `).join("");
    }
    document.getElementById("custMiniStats").innerHTML = `
      <div class="an__miniStat"><div class="an__miniStat-label">Repeat Purchase Rate</div><div class="an__miniStat-value">${state.data.repeatPurchaseRate.toFixed(1)}%</div></div>
      <div class="an__miniStat"><div class="an__miniStat-label">Customer Lifetime Value</div><div class="an__miniStat-value">${fmt(state.data.customerLifetimeValue)}</div></div>
    `;
  }

  function renderCartAnalytics() {
    const c = state.data.cartAnalytics;
    document.getElementById("cartGrid").innerHTML = `
      <div class="an__cartItem"><div class="an__cartLabel">Add to Cart</div><div class="an__cartValue">${num(c.adds)}</div></div>
      <div class="an__cartItem"><div class="an__cartLabel">Checkout Started</div><div class="an__cartValue">${num(c.checkoutStarted)}</div></div>
      <div class="an__cartItem"><div class="an__cartLabel">Abandoned Carts</div><div class="an__cartValue">${num(c.abandoned)}</div></div>
      <div class="an__cartItem"><div class="an__cartLabel">Recovered Carts</div><div class="an__cartValue">${num(c.recovered)}</div></div>
    `;
  }

  function renderOrdersOverview() {
    const rows = state.data.ordersByStatus;
    const total = rows.reduce((s, r) => s + r.c, 0);
    document.getElementById("ordersDonutPct").textContent = num(total);
    if (!rows.length) {
      document.getElementById("ordersDonut").innerHTML = "";
      document.getElementById("ordersLegend").innerHTML = `<p class="an__empty">No orders yet.</p>`;
      return;
    }
    const mapped = rows.map((r) => ({ name: r.status.charAt(0).toUpperCase() + r.status.slice(1), count: r.c }));
    document.getElementById("ordersDonut").innerHTML = donutSegments(mapped, "count", "name");
    document.getElementById("ordersLegend").innerHTML = mapped.map((r, i) => `
      <div class="an__donutLegend-row">
        <span class="an__donutLegend-dot" style="background:${PALETTE[i % PALETTE.length]}"></span>
        <span class="an__donutLegend-name">${r.name}</span>
        <span class="an__donutLegend-pct">${r.count} (${total > 0 ? Math.round((r.count / total) * 100) : 0}%)</span>
      </div>
    `).join("");
  }

  const DEVICE_ICON = {
    mobile: `<rect x="7" y="2" width="10" height="20" rx="2"></rect><path d="M11 18h2"></path>`,
    desktop: `<rect x="3" y="4" width="18" height="12" rx="1"></rect><path d="M8 20h8M12 16v4"></path>`,
    tablet: `<rect x="4" y="3" width="16" height="18" rx="2"></rect><path d="M11 18h2"></path>`,
  };

  function renderDevices() {
    const rows = state.data.deviceAnalytics;
    if (!rows.length) {
      document.getElementById("deviceDonut").innerHTML = "";
      document.getElementById("deviceDonutPct").textContent = "—";
      document.getElementById("deviceList").innerHTML = `<p class="an__empty">No device data yet.</p>`;
      return;
    }
    const mapped = rows.map((r) => ({ name: r.device.charAt(0).toUpperCase() + r.device.slice(1), count: r.count, pct: r.pct }));
    mapped.sort((a, b) => b.count - a.count);
    document.getElementById("deviceDonut").innerHTML = donutSegments(mapped, "count", "name");
    document.getElementById("deviceDonutPct").textContent = mapped[0].pct + "%";
    document.getElementById("deviceDonutLabel").textContent = mapped[0].name;
    document.getElementById("deviceList").innerHTML = mapped.map((r, i) => `
      <div class="an__deviceRow">
        <svg viewBox="0 0 24 24">${DEVICE_ICON[r.name.toLowerCase()] || DEVICE_ICON.desktop}</svg>
        <span class="an__deviceName">${r.name}</span>
        <span class="an__devicePct" style="color:${PALETTE[i % PALETTE.length]}">${r.pct}%</span>
      </div>
    `).join("");
  }

  function renderAll() {
    const d = state.data;
    renderKpis(d.kpis, d.daily);
    renderChart();
    renderLiveAndPages();
    renderGeo();
    renderTrio();
    renderFunnel();
    renderTopProducts();
    renderTraffic();
    renderCustomerAnalytics();
    renderCartAnalytics();
    renderOrdersOverview();
    renderDevices();
  }

  async function load() {
    try {
      state.data = await API.get(`/api/analytics?range=${state.range}`);
    } catch {
      state.data = null;
    }
    if (!state.data) {
      document.getElementById("kpiGrid").innerHTML = `<p class="an__empty" style="grid-column:1/-1">Couldn't load analytics right now.</p>`;
      return;
    }
    renderAll();
  }

  (async () => {
    const session = await AdminShell.init({ active: "analytics" });
    if (!session) return;

    document.getElementById("rangeBtns").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-range]");
      if (!btn) return;
      document.querySelectorAll("#rangeBtns button").forEach((b) => b.classList.toggle("is-active", b === btn));
      state.range = btn.dataset.range;
      load();
    });

    document.getElementById("chartTabs").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-metric]");
      if (!btn) return;
      document.querySelectorAll("#chartTabs button").forEach((b) => b.classList.toggle("is-active", b === btn));
      state.metric = btn.dataset.metric;
      renderChart();
    });

    await load();
    // Keep the live-visitor number and funnel roughly live without a full
    // page reload — same 30s cadence the rest of the admin uses elsewhere.
    setInterval(load, 30000);
  })();
})();
