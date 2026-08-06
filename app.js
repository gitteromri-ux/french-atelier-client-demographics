/* French Atelier — Audience Intelligence
   All figures render from the embedded data.json payload. No hardcoded numbers. */
(function () {
  "use strict";
  const D = JSON.parse(document.getElementById("fa-data").textContent);
  const M = D.meta;
  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- formatters ---------- */
  const money2 = n => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money0 = n => "$" + Math.round(Number(n)).toLocaleString("en-US");
  const int = n => Number(n).toLocaleString("en-US");
  const pct = n => Number(n).toFixed(1) + "%";
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h !== undefined) e.innerHTML = h; return e; };

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  function longDate(s) { const p = s.split("-"); return Number(p[2]) + " " + MONTHS[Number(p[1]) - 1] + " " + p[0]; }
  const PERIOD = longDate(M.from) + " — " + longDate(M.to);

  /* ---------- derived (all from data.json) ---------- */
  const regions = D.region.filter(r => r.leads > 0);
  const unknownRegion = D.region.find(r => r.k === "Unknown");
  const ages = D.age.filter(a => a.k !== "Unknown");
  const unknownAge = D.age.find(a => a.k === "Unknown");
  const gmap = {}; D.gender.forEach(g => gmap[g.k] = g);
  const top4 = regions.slice(0, 4);
  const top4Leads = top4.reduce((s, r) => s + r.leads, 0);
  const caRows = regions.filter(r => r.country === "CA");
  const caLeads = caRows.reduce((s, r) => s + r.leads, 0);
  const caShare = caLeads / M.leads * 100;
  const best = regions.find(r => r.k === M.bestCPL.k);
  const worst = regions.find(r => r.k === M.worstCPL.k);
  const bestAge = ages.find(a => a.k === M.bestAgeCPL.k);

  /* ---------- header / hero ---------- */
  document.getElementById("navPeriod").textContent = PERIOD;
  document.getElementById("heroPeriod").textContent = PERIOD;
  document.getElementById("heroMarkets").textContent = M.markets + " · " + M.campaigns + " campaigns · Meta Ads";
  document.getElementById("fPeriod").textContent = PERIOD;
  document.getElementById("fSource").textContent = M.source + " · " + M.brand + ", part of " + M.parent + ".";

  const KPIS = [
    { label: "Total spend", val: money2(M.spend), cls: "gold-text", foot: M.campaigns + " campaigns · " + M.markets },
    { label: "Leads", val: int(M.leads), cls: "", foot: "Meta lead-form completions" },
    { label: "Blended CPL", val: money2(M.cpl), cls: "grad-text", foot: money2(M.spend) + " ÷ " + int(M.leads) + " leads" },
    { label: "Markets", val: "US + Canada", cls: "", small: true, foot: pct(100 - caShare) + " United States · " + pct(caShare) + " Canada" }
  ];
  const kwrap = document.getElementById("kpis");
  KPIS.forEach(k => {
    const c = el("div", "card kpi");
    c.appendChild(el("div", "glow"));
    c.appendChild(el("div", "k-label", k.label));
    const v = el("div", "k-val num " + (k.small ? "small " : "") + k.cls);
    v.dataset.count = k.val; v.textContent = k.val;
    c.appendChild(v);
    c.appendChild(el("div", "k-foot", k.foot));
    kwrap.appendChild(c);
  });

  /* ---------- 2 · geography ---------- */
  document.getElementById("top4").textContent = pct(M.top4Share);
  document.getElementById("top4Copy").innerHTML =
    "of all leads come from <b>" + top4.map(r => r.k).join(", ").replace(/, ([^,]*)$/, " and $1") + "</b> — " +
    int(top4Leads) + " of " + int(M.leads) + " leads. The remaining " +
    (regions.length - 4) + " states and provinces split " + pct(100 - M.top4Share) + ".";

  const maxShare = Math.max.apply(null, regions.map(r => r.leadShare));
  const grid = document.getElementById("rankGrid");
  const half = Math.ceil(regions.length / 2);
  const HEAD = '<div class="rank-head"><div>#</div><div>State / Province</div><div style="text-align:right">Leads</div><div style="text-align:right">Share</div><div style="text-align:right" class="cplh">CPL</div></div>';

  function cplClass(cpl) {
    if (cpl >= M.cpl * 1.05) return "hot";
    if (cpl <= M.cpl * 0.95) return "cool";
    return "";
  }
  [0, 1].forEach(col => {
    const box = el("div", "rank-col", HEAD);
    regions.slice(col * half, col * half + half).forEach((r, i) => {
      const rank = col * half + i;
      const row = el("div", "rrow" + (rank < 4 ? " top4" : ""));
      row.innerHTML =
        '<div class="rk num">' + String(rank + 1).padStart(2, "0") + "</div>" +
        '<div class="nmwrap"><div class="nm"><i class="flagdot ' + r.country.toLowerCase() + '"></i><span>' + r.k + "</span></div>" +
        '<div class="track"><div class="fill ' + r.country.toLowerCase() + '" data-w="' + (r.leadShare / maxShare * 100) + '"></div></div></div>' +
        '<div class="v num">' + int(r.leads) + "</div>" +
        '<div class="v dim num">' + pct(r.leadShare) + "</div>" +
        '<div class="cpl num ' + cplClass(r.cpl) + '">' + money2(r.cpl) + "</div>";
      box.appendChild(row);
    });
    grid.appendChild(box);
  });
  document.getElementById("regionNote").innerHTML =
    "Share = share of the " + int(M.leads) + " leads in period. Blue = United States, red = Canada. " +
    "One further row, “" + unknownRegion.k + "”, is excluded: " + unknownRegion.leads +
    " leads on " + money2(unknownRegion.spend) + " spend.";

  /* ---------- 3 · age ---------- */
  const AGE_COLORS = [
    ["#2FD1C0", "#1FA79B"],
    ["#4BA4FF", "#2C7BF2"],
    ["#6E76F5", "#4B4FE0"],
    ["#A374FF", "#7B4BE8"],
    ["#F2679B", "#D63A78"],
    ["#F7DCA1", "#DFAE5C"]
  ];
  const maxAge = Math.max.apply(null, ages.map(a => a.leadShare));
  const ac = document.getElementById("ageCols");
  ages.forEach((a, i) => {
    const c = AGE_COLORS[i % AGE_COLORS.length];
    const hi = a.leadShare === maxAge;
    const d = el("div", "agecol" + (hi ? " hi" : ""));
    d.innerHTML =
      '<div class="pct num"' + (hi ? ' style="color:#F7DCA1"' : "") + ">" + pct(a.leadShare) + "</div>" +
      '<div class="col" data-h="' + (a.leadShare / maxAge * 100) + '" style="background:linear-gradient(180deg,' + c[0] + "," + c[1] + ');box-shadow:0 -1px 0 rgba(255,255,255,.35) inset,0 16px 38px -10px ' + c[1] + '99,0 40px 60px -30px rgba(0,0,0,.85)"></div>' +
      '<div class="lbl">' + a.k + "</div>" +
      '<div class="leads num">' + int(a.leads) + " leads</div>";
    ac.appendChild(d);
  });

  const cb = document.getElementById("concBar");
  ages.forEach((a, i) => {
    const c = AGE_COLORS[i % AGE_COLORS.length];
    const s = el("div", "conc-seg");
    s.dataset.w = a.leadShare;
    s.style.background = "linear-gradient(180deg," + c[0] + "," + c[1] + ")";
    s.innerHTML = a.leadShare >= 6 ? "<span>" + a.k + " · " + pct(a.leadShare) + "</span>" : (a.leadShare >= 3 ? "<span>" + pct(a.leadShare) + "</span>" : "");
    cb.appendChild(s);
  });

  function bracket(node, fromLabel, share) {
    const offset = 100 - share;
    node.innerHTML = '<div class="bracket" style="left:' + offset + "%;width:" + share + '%"><div class="bl">' + fromLabel + ' &nbsp;<b class="num">' + pct(share) + "</b></div></div>";
  }
  bracket(document.getElementById("brk45"), "45 and over", M.share45plus);
  bracket(document.getElementById("brk55"), "55 and over", M.share55plus);
  document.getElementById("ageNote").innerHTML =
    "45+ accounts for " + pct(M.share45plus) + " of leads and 55+ for " + pct(M.share55plus) + ". " +
    "Excludes “" + unknownAge.k + "” age: " + unknownAge.leads + " lead on " + money2(unknownAge.spend) + " spend.";

  /* ---------- 4 · gender ---------- */
  const G_COLORS = { female: ["#A374FF", "#6C4BF0"], male: ["#4BA4FF", "#2668E0"], unknown: ["#8A96BE", "#5C6790"] };
  const gOrder = ["female", "male", "unknown"];
  const donut = document.getElementById("donut");
  const R = 72, C = 2 * Math.PI * R;
  let defs = '<defs>';
  gOrder.forEach(k => {
    defs += '<linearGradient id="g-' + k + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + G_COLORS[k][0] + '"/><stop offset="1" stop-color="' + G_COLORS[k][1] + '"/></linearGradient>';
  });
  defs += '<filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5"/></filter></defs>';
  let arcs = '<circle cx="100" cy="100" r="' + R + '" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="26"/>';
  let acc = 0;
  gOrder.forEach(k => {
    const g = gmap[k];
    const len = g.leadShare / 100 * C;
    const gap = 3;
    arcs += '<circle class="arc" cx="100" cy="100" r="' + R + '" fill="none" stroke="url(#g-' + k + ')" stroke-width="' + (k === "unknown" ? 18 : 26) + '" stroke-linecap="butt"' +
      ' stroke-dasharray="0 ' + C + '" data-len="' + Math.max(len - gap, 1) + '" data-c="' + C + '"' +
      ' transform="rotate(' + (-90 + acc / 100 * 360) + ' 100 100)"/>';
    acc += g.leadShare;
  });
  donut.innerHTML = defs + arcs +
    '<text x="100" y="94" text-anchor="middle" fill="#EEF2FF" font-family="Bespoke Serif, Georgia, serif" font-size="34" letter-spacing="-1.5">' + pct(gmap.female.leadShare) + "</text>" +
    '<text x="100" y="116" text-anchor="middle" fill="#8A96BE" font-family="Satoshi, sans-serif" font-size="10.5" letter-spacing="3">FEMALE</text>';

  const lg = document.getElementById("genderLegend");
  gOrder.forEach(k => {
    const g = gmap[k];
    const item = el("div", "lg-item");
    item.innerHTML =
      '<div class="lg-swatch" style="background:linear-gradient(180deg,' + G_COLORS[k][0] + "," + G_COLORS[k][1] + ')"></div>' +
      "<div><div class='lg-k'>" + k + "</div><div class='lg-v num'>" + pct(g.leadShare) + "</div>" +
      "<div class='lg-m num'>" + int(g.leads) + " leads · " + money2(g.cpl) + " CPL · " + money0(g.spend) + " spend</div></div>";
    lg.appendChild(item);
  });

  const gc = document.getElementById("genderCpl");
  const maxGC = Math.max.apply(null, D.gender.map(g => g.cpl));
  gOrder.forEach(k => {
    const g = gmap[k];
    const row = el("div", "mini");
    row.innerHTML =
      "<div class='mk'>" + k.charAt(0).toUpperCase() + k.slice(1) + " · " + int(g.leads) + " leads</div>" +
      "<div class='mv num'>" + money2(g.cpl) + "</div>" +
      "<div class='mt'><div class='mf' data-w='" + (g.cpl / maxGC * 100) + "' style='background:linear-gradient(90deg," + G_COLORS[k][1] + "," + G_COLORS[k][0] + ")'></div></div>";
    gc.appendChild(row);
  });
  document.getElementById("genderNote").innerHTML =
    "Blended average " + money2(M.cpl) + ". Women cost " + money2(gmap.female.cpl) + " per lead, men " +
    money2(gmap.male.cpl) + " — a " + money2(gmap.female.cpl - gmap.male.cpl) + " gap on " + pct(gmap.female.leadShare) + " of volume.";

  /* ---------- 5 · efficiency ---------- */
  function lolli(container, scaleEl, rows, dmin, dmax, ticks) {
    const pos = v => (v - dmin) / (dmax - dmin) * 100;
    rows.forEach(r => {
      const hot = r.cpl > M.cpl;
      const col = hot ? ["#FF9A7A", "#FF5A46"] : ["#5AE0CE", "#26B4C9"];
      const row = el("div", "lrow");
      row.innerHTML =
        "<div class='lk'>" + r.k + "</div>" +
        "<div class='lt'><div class='refline' style='left:" + pos(M.cpl) + "%'></div>" +
        "<div class='lbar' data-w='" + pos(r.cpl) + "' style='background:linear-gradient(90deg," + col[1] + "33," + col[0] + ")'></div>" +
        "<div class='ldot' data-x='" + pos(r.cpl) + "' style='background:radial-gradient(circle at 35% 30%,#fff," + col[0] + " 45%," + col[1] + ")'></div></div>" +
        "<div class='lv num' style='color:" + (hot ? "#FF8E78" : "#6FE6D6") + "'>" + money2(r.cpl) + "</div>";
      container.appendChild(row);
    });
    let s = "";
    ticks.forEach(t => { s += "<div class='tick num' style='left:" + pos(t) + "%'>" + money2(t) + "</div>"; });
    s += "<div class='tick num' style='left:" + pos(M.cpl) + "%;color:#F2D08B'>" + money2(M.cpl) + "</div>";
    scaleEl.innerHTML = "<div style='position:absolute;left:0;right:0;top:0'></div>" + s;
  }
  const refTxt = "<i></i>Dashed line = blended average " + money2(M.cpl);
  document.getElementById("refTagA").innerHTML = refTxt;
  document.getElementById("refTagB").innerHTML = refTxt;

  lolli(document.getElementById("cplAge"), document.getElementById("scaleAge"), ages, 20.5, 23.0, [21.0, 22.5]);
  const topRegions = regions.slice(0, 10);
  const rMin = Math.floor(Math.min.apply(null, topRegions.map(r => r.cpl)) - 1);
  const rMax = Math.ceil(Math.max.apply(null, topRegions.map(r => r.cpl)) + 1);
  lolli(document.getElementById("cplRegion"), document.getElementById("scaleRegion"), topRegions, rMin, rMax, [rMin + 1, rMax - 1]);

  const CALL = [
    { k: "Best at scale", v: money2(best.cpl), m: best.k + " · " + int(best.leads) + " leads · " + money0(best.spend) + " spend", c: "#6FE6D6" },
    { k: "Most expensive at scale", v: money2(worst.cpl), m: worst.k + " · " + int(worst.leads) + " leads · " + money0(worst.spend) + " spend", c: "#FF8E78" },
    { k: "Best age band on cost", v: money2(bestAge.cpl), m: bestAge.k + " · " + int(bestAge.leads) + " leads · largest segment at " + pct(bestAge.leadShare), c: "#F2D08B" }
  ];
  const eco = document.getElementById("effCallouts");
  CALL.forEach(c => {
    const d = el("div", "card card-pad callout");
    d.innerHTML = "<div class='co-k'>" + c.k + "</div><div class='co-v num' style='color:" + c.c + "'>" + c.v + "</div><div class='co-m'>" + c.m + "</div>";
    eco.appendChild(d);
  });

  /* ---------- 6 · takeaways ---------- */
  const TAKE = [
    {
      t: "<b>" + pct(M.top4Share) + "</b> of leads come from four states — concentration risk, and the fastest place to add budget.",
      g: int(top4Leads) + " leads"
    },
    {
      t: "The <b>" + bestAge.k + "</b> band is the largest segment at " + pct(bestAge.leadShare) + " and the cheapest at <b>" + money2(bestAge.cpl) + "</b> CPL — spend is following performance.",
      g: int(bestAge.leads) + " leads"
    },
    {
      t: "<b>" + pct(gmap.female.leadShare) + "</b> of leads are women, at " + money2(gmap.female.cpl) + " CPL versus " + money2(gmap.male.cpl) + " for men.",
      g: int(gmap.female.leads) + " leads"
    },
    {
      t: "Canada is only " + pct(caShare) + " of leads, yet " + best.k + " is the most efficient market at <b>" + money2(best.cpl) + "</b> CPL.",
      g: int(caLeads) + " leads"
    }
  ];
  const tl = document.getElementById("takeaways");
  TAKE.forEach((t, i) => {
    const d = el("div", "card take");
    d.innerHTML = "<div class='tn num'>" + String(i + 1).padStart(2, "0") + "</div><div class='tt'>" + t.t + "</div><div class='tg gold-text num'>" + t.g + "</div>";
    tl.appendChild(d);
  });

  /* ---------- motion ---------- */
  function countUp(node) {
    const target = node.dataset.count;
    if (RM || !/\d/.test(target)) { node.textContent = target; return; }
    const m = target.match(/^(\$?)([\d,]+)(\.\d+)?$/);
    if (!m) { node.textContent = target; return; }
    const dec = m[3] ? m[3].length - 1 : 0;
    const end = parseFloat(m[2].replace(/,/g, "") + (m[3] || ""));
    const t0 = performance.now(), dur = 1500;
    function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      const v = end * e;
      node.textContent = m[1] + v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
      if (p < 1) requestAnimationFrame(step); else node.textContent = target;
    }
    requestAnimationFrame(step);
  }

  function activate(root) {
    root.querySelectorAll("[data-count]").forEach(countUp);
    root.querySelectorAll(".fill[data-w],.mf[data-w],.lbar[data-w]").forEach(n => { n.style.width = n.dataset.w + "%"; });
    root.querySelectorAll(".conc-seg[data-w]").forEach(n => { n.style.width = n.dataset.w + "%"; });
    root.querySelectorAll(".col[data-h]").forEach(n => { n.style.height = n.dataset.h + "%"; });
    root.querySelectorAll(".ldot[data-x]").forEach(n => { n.style.left = n.dataset.x + "%"; n.style.transform = "translateX(-50%) scale(1)"; });
    root.querySelectorAll(".arc").forEach(n => { n.setAttribute("stroke-dasharray", n.dataset.len + " " + n.dataset.c); });
  }

  const reveal = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window && !RM) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("rv-in"); activate(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveal.forEach(n => io.observe(n));
  } else {
    reveal.forEach(n => { n.classList.add("rv-in"); activate(n); });
  }
  // arcs live inside a .rv card; ensure donut animates even if observer fires early
  setTimeout(() => { document.querySelectorAll(".rv-in").forEach(activate); }, 60);

  if (!RM) {
    const orbs = document.querySelectorAll(".orb");
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        orbs.forEach(o => { o.style.transform = "translate3d(0," + (y * parseFloat(o.dataset.par)).toFixed(1) + "px,0)"; });
        ticking = false;
      });
    }, { passive: true });
  }

  // print: make sure everything is drawn before the dialog
  window.addEventListener("beforeprint", () => {
    reveal.forEach(n => { n.classList.add("rv-in"); activate(n); });
  });
})();
