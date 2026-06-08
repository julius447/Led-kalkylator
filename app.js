/* =============================================================================
   LED-kalkylatorn — RENDERARE (Lager 5). Matchar batterikalkylatorns design.
   Avrundning bara här. Instant value på load. Ingen vägg före svaret.
   ============================================================================= */
(function () {
  "use strict";
  var DATA = window.AMPY_LED_DATA, calc = window.AmpyLED.calculate;
  var prefersReduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NBSP = " ";

  // --- format -------------------------------------------------------------
  function group(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP); }
  function fmtKr(v) { return (v == null || !isFinite(v)) ? "—" : (v < 0 ? "−" + group(-v) : group(v)); }
  function fmtInt(v) { return (v == null || !isFinite(v)) ? "—" : group(v); }
  function fmtYears(y) { return (y == null || !isFinite(y)) ? "—" : y.toFixed(1).replace(".", ","); }
  function fmtCo2(kg) { return kg >= 1000 ? (kg / 1000).toFixed(1).replace(".", ",") + " ton" : Math.round(kg) + " kg"; }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }

  // --- state --------------------------------------------------------------
  var state = { segment: "brf", typ_id: null, antal: null, timmar_dag: null, elprisomrade: "SE3", _kontext: null };
  var lastResult = null, prev = {}, firstPaint = true, meta = {};
  var antalSlider = null, brinntidSlider = null;

  // --- lookups ------------------------------------------------------------
  function lookup(list, k, v) { for (var i = 0; i < list.length; i++) if (list[i][k] === v) return list[i]; return null; }
  function findBrinntid(k) { return DATA.brinntid_default.filter(function (b) { return b.kontext === k; })[0]; }
  function typerForSegment(seg) { var kat = seg === "privat" ? "privat" : "kommersiell"; return DATA.watt_tabell.filter(function (t) { return t.kat === kat; }); }
  function kontexterForSegment(seg) { return DATA.brinntid_default.filter(function (b) { return b.segment === seg; }); }
  function zonpris(z) { return typeof DATA.elpris[z] === "number" ? DATA.elpris[z] : DATA.elpris.nationellt_default; }

  function applyPreset() {
    var root = $("ampyLed");
    var preset = DATA.embed_preset[root && root.getAttribute("data-sida")];
    var seg = (preset && preset.segment) || state.segment;
    var d = DATA.defaults[seg];
    state.segment = seg;
    state.typ_id = (preset && preset.typ_id) || d.typ_id;
    state.antal = d.antal;
    state._kontext = (preset && preset.kontext) || d.kontext;
    var b = findBrinntid(state._kontext); state.timmar_dag = b ? b.timmar_dag : 8;
  }
  function setSegmentDefaults() {
    var d = DATA.defaults[state.segment];
    state.typ_id = d.typ_id; state.antal = d.antal; state._kontext = d.kontext;
    var b = findBrinntid(d.kontext); state.timmar_dag = b ? b.timmar_dag : 8;
  }

  // --- generic custom slider ----------------------------------------------
  function buildSlider(containerId, o) {
    var container = $(containerId); container.textContent = "";
    var wrap = el("div", "ampy-calc__slider-wrap");
    var slider = el("div", "ampy-calc__slider"); slider.tabIndex = 0; slider.setAttribute("role", "slider");
    slider.setAttribute("aria-valuemin", o.min); slider.setAttribute("aria-valuemax", o.max);
    var track = el("div", "ampy-calc__slider-track"), fill = el("div", "ampy-calc__slider-fill"), thumb = el("div", "ampy-calc__slider-thumb");
    slider.appendChild(track); slider.appendChild(fill); slider.appendChild(thumb);
    var ticksEl = el("div", "ampy-calc__slider-ticks");
    (o.ticks || []).forEach(function (t) {
      var b = el("button", "ampy-calc__slider-tick", o.format(t)); b.type = "button"; b.dataset.val = t;
      b.onclick = function () { setVal(t, true); }; ticksEl.appendChild(b);
    });
    wrap.appendChild(slider); wrap.appendChild(ticksEl); container.appendChild(wrap);
    var step = o.step || 1, value = o.value;

    function position(v) {
      var p = (v - o.min) / (o.max - o.min);
      thumb.style.left = "calc(1.2rem + (100% - 2.4rem) * " + p + ")";
      fill.style.width = "calc((100% - 2.4rem) * " + p + ")";
      Array.prototype.forEach.call(ticksEl.children, function (b) { b.classList.toggle("ampy-calc__slider-tick--active", Number(b.dataset.val) === v); });
      slider.setAttribute("aria-valuenow", v);
      slider.setAttribute("aria-valuetext", o.aria ? o.aria(v) : o.format(v));
    }
    function setVal(v, fire) {
      v = clamp(Math.round(v / step) * step, o.min, o.max);
      v = Math.round(v * 1000) / 1000;
      value = v; position(v); if (fire) o.onInput(v);
    }
    function pickByX(cx) { var r = slider.getBoundingClientRect(); var usable = r.width - 24; var frac = clamp((cx - r.left - 12) / usable, 0, 1); return o.min + frac * (o.max - o.min); }
    var dragging = false;
    slider.addEventListener("pointerdown", function (e) { dragging = true; try { slider.setPointerCapture(e.pointerId); } catch (x) {} setVal(pickByX(e.clientX), true); });
    slider.addEventListener("pointermove", function (e) { if (dragging) setVal(pickByX(e.clientX), true); });
    slider.addEventListener("pointerup", function () { dragging = false; });
    slider.addEventListener("pointercancel", function () { dragging = false; });
    slider.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowUp") { setVal(value + step, true); e.preventDefault(); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") { setVal(value - step, true); e.preventDefault(); }
      else if (e.key === "Home") { setVal(o.min, true); } else if (e.key === "End") { setVal(o.max, true); }
    });
    position(value);
    return { set: function (v) { setVal(v, false); } };
  }

  // --- light-source selector (custom dropdown) ----------------------------
  function buildTypSelector() {
    var list = $("typList"); list.textContent = "";
    var typer = typerForSegment(state.segment), grupper = [];
    typer.forEach(function (t) { if (grupper.indexOf(t.grupp) < 0) grupper.push(t.grupp); });
    grupper.forEach(function (g) {
      var head = el("li", "ampy-calc__selector-group", g); head.setAttribute("role", "presentation"); list.appendChild(head);
      typer.filter(function (t) { return t.grupp === g; }).forEach(function (t) {
        var li = el("li"); var opt = el("button", "ampy-calc__selector-option"); opt.type = "button"; opt.setAttribute("role", "option");
        opt.appendChild(el("span", "name", t.namn));
        opt.appendChild(el("span", "meta", t.w_gammal + " → " + t.w_led + " W"));
        if (t.id === state.typ_id) { opt.classList.add("ampy-calc__selector-option--selected"); opt.setAttribute("aria-selected", "true"); }
        opt.onclick = function () { state.typ_id = t.id; closeSel(); updateTypButton(); render(); };
        li.appendChild(opt); list.appendChild(li);
      });
    });
    updateTypButton();
  }
  function updateTypButton() {
    var t = lookup(DATA.watt_tabell, "id", state.typ_id);
    $("typName").textContent = t ? t.namn : "—";
    $("typMeta").textContent = t ? (t.w_gammal + " → " + t.w_led + " W" + (t.lumen && t.lumen !== "—" ? " · " + t.lumen : "")) : "";
  }
  function closeSel() { $("typSelector").setAttribute("aria-expanded", "false"); }

  // --- controls -----------------------------------------------------------
  function buildControls() {
    var d = DATA.defaults[state.segment], plural = d.enhet_namn;

    // segment + region segmented (pressed states)
    document.querySelectorAll("#segSegment button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.seg === state.segment)); });
    document.querySelectorAll("#segRegion button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.region === state.elprisomrade)); });

    $("segCaption").textContent = d.seg_caption;
    $("antalLabel").textContent = "Antal " + plural;
    $("ctaLabel").textContent = d.cta_text;
    $("lasMer").href = DATA.lankar.las_mer;

    buildTypSelector();

    // kontext select
    var ctxSel = $("inKontext"); ctxSel.textContent = "";
    kontexterForSegment(state.segment).forEach(function (c) {
      var o = el("option", null, c.kontext + " (" + fmtYears(c.timmar_dag) + " h/dygn)"); o.value = c.kontext;
      if (c.kontext === state._kontext) o.selected = true; ctxSel.appendChild(o);
    });

    // antal slider
    var as = d.antal_slider;
    antalSlider = buildSlider("antalSlider", {
      min: as.min, max: as.max, value: state.antal, step: 1, ticks: as.ticks,
      format: function (v) { return fmtInt(v); },
      aria: function (v) { return v + " " + plural; },
      onInput: function (v) { state.antal = v; render(); }
    });

    // brinntid slider
    brinntidSlider = buildSlider("brinntidSlider", {
      min: 0, max: 24, value: state.timmar_dag, step: 0.5, ticks: [0, 6, 12, 18, 24],
      format: function (v) { return fmtYears(v) + " h"; },
      aria: function (v) { return fmtYears(v) + " timmar per dygn"; },
      onInput: function (v) { state.timmar_dag = v; render(); }
    });

    // tooltips → native title
    document.querySelectorAll(".ampy-calc__tip").forEach(function (b) { if (b.dataset.tip) b.title = b.dataset.tip; });
  }

  // --- render -------------------------------------------------------------
  function render() {
    try {
      var r = calc(state, DATA); lastResult = r;
      renderHero(r); renderTrio(r); renderEnergy(r); renderChart(r);
      $("antalValue").textContent = fmtInt(state.antal);
      $("brinntidValue").textContent = fmtYears(state.timmar_dag);
      $("chartEndAxis").textContent = r.horisont_ar + " år";
      $("heroEyebrow").textContent = "Sparar på " + r.horisont_ar + " år";
      $("heroSub").textContent = "Total besparing över " + r.horisont_ar + " år, minus vad bytet kostar.";
      renderMethodology(r);
      trackBerakning(r);
      firstPaint = false;
    } catch (e) { renderError(); }
  }
  function renderError() {
    $("heroValue").textContent = "—"; $("heroEyebrow").textContent = "Kunde inte räkna";
    ["statCost", "statAnnual", "statPayback"].forEach(function (id) { $(id).textContent = "—"; });
    track("calc_error", { segment: state.segment, typ_id: state.typ_id });
  }

  function animateNumber(key, target, fmt, id) {
    var node = $(id); if (!node) return;
    node.textContent = fmt(target);
    if (firstPaint || prefersReduced) { prev[key] = target; return; }
    var from = prev[key] != null ? prev[key] : target; prev[key] = target;
    if (from === target) return;
    var t0 = null, dur = 280;
    function step(ts) { if (!t0) t0 = ts; var t = Math.min((ts - t0) / dur, 1); var e = 1 - Math.pow(1 - t, 3); node.textContent = fmt(from + (target - from) * e); if (t < 1) requestAnimationFrame(step); else node.textContent = fmt(target); }
    requestAnimationFrame(step);
    // Skyddsnät: garantera slutvärdet även om rAF strypts (bakgrundsflik)
    setTimeout(function () { node.textContent = fmt(target); }, dur + 80);
  }

  function renderHero(r) { animateNumber("hero", r.netto_horisont, fmtKr, "heroValue"); }

  function renderTrio(r) {
    var b = r.breakdown, privat = state.segment === "privat";
    animateNumber("cost", b.total_led_kostnad, fmtKr, "statCost");
    $("statCostSub").textContent = "≈ " + fmtKr(b.per_enhet_kostnad) + " kr per " + (privat ? "lampa" : "armatur");
    animateNumber("annual", r.arlig_besparing, fmtKr, "statAnnual");
    $("statAnnualSub").textContent = "≈ " + fmtKr(r.arlig_besparing / 12) + " kr/mån";
    $("statPayback").textContent = fmtYears(r.payback_ar);
  }

  function renderEnergy(r) {
    var b = r.breakdown, before = b.kwh_gammal_total, saved = r.kwh_ar, after = b.kwh_led_total;
    var bar = $("energyBar"); bar.textContent = "";
    if (before > 0) {
      var s1 = el("div", "ampy-calc__streams-segment"); s1.style.background = "var(--state-success)"; s1.style.width = (saved / before * 100) + "%";
      var s2 = el("div", "ampy-calc__streams-segment"); s2.style.background = "var(--chart-stream-4)"; s2.style.width = (after / before * 100) + "%";
      bar.appendChild(s1); bar.appendChild(s2);
    }
    var pct = before > 0 ? Math.round(saved / before * 100) : 0;
    var cap = "Du kapar <strong>" + fmtInt(saved) + " kWh/år</strong> — " + pct + " % lägre.";
    if (r.visa_co2 && r.co2_kg_ar != null) cap += " ≈ " + fmtCo2(r.co2_kg_ar) + " CO₂/år (nordisk residualmix, ESG).";
    else cap += " ≈ " + fmtKr(r.arlig_besparing / 12) + " kr i månaden.";
    $("energyCaption").innerHTML = cap;
  }

  // --- payback-kurva (port från batterikalkylatorn) -----------------------
  function renderChart(r) {
    var chartEl = $("chart"), svg = $("chartSvg"), H = r.horisont_ar, cum = r.cumulative;
    var W = 1000, HH = 400, padT = 8, padB = 8, plotH = HH - padT - padB;
    var yMin = cum[0], yMax = cum[H];
    if (!(yMax > yMin)) { // platt/0 → ingen kurva
      svg.innerHTML = ""; chartEl.classList.add("is-no-payback"); $("chartEndValue").textContent = "—"; return;
    }
    chartEl.classList.remove("is-no-payback");
    function x(year) { return (year / H) * W; }
    function y(v) { return padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH; }
    var zeroY = y(0);
    var pb = (r.payback_ar && r.payback_ar > 0 && r.payback_ar <= H) ? r.payback_ar : null;
    var aStyle = function (d) { return prefersReduced ? "" : ' style="opacity:0;animation:ampy-zone-fade 300ms cubic-bezier(0.2,0,0.2,1) ' + d + 'ms forwards;"'; };
    var dStyle = function (d) { return prefersReduced ? "" : ' style="stroke-dasharray:1400;stroke-dashoffset:1400;animation:ampy-draw 300ms cubic-bezier(0.2,0,0.2,1) ' + d + 'ms forwards;"'; };
    var h = "";
    h += '<line x1="0" y1="' + zeroY + '" x2="' + W + '" y2="' + zeroY + '" stroke="rgba(255,255,255,0.32)" stroke-width="1" stroke-dasharray="3,5" vector-effect="non-scaling-stroke"/>';
    if (pb != null) {
      var lp = [x(0) + "," + zeroY];
      for (var i = 0; i <= Math.floor(pb); i++) lp.push(x(i) + "," + y(cum[i]));
      lp.push(x(pb) + "," + zeroY);
      h += '<polygon points="' + lp.join(" ") + '" fill="var(--chart-zone-loss)"' + aStyle(0) + '/>';
      var gp = [x(pb) + "," + zeroY];
      for (var j = Math.ceil(pb); j <= H; j++) gp.push(x(j) + "," + y(cum[j]));
      gp.push(x(H) + "," + zeroY);
      h += '<polygon points="' + gp.join(" ") + '" fill="var(--chart-zone-profit)"' + aStyle(80) + '/>';
      var a2 = [];
      for (var k = 0; k <= Math.floor(pb); k++) a2.push(x(k) + "," + y(cum[k]));
      a2.push(x(pb) + "," + zeroY);
      h += '<polyline points="' + a2.join(" ") + '" fill="none" stroke="var(--chart-line-loss)" stroke-width="2.75" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"' + dStyle(0) + '/>';
      var b2 = [x(pb) + "," + zeroY];
      for (var m = Math.ceil(pb); m <= H; m++) b2.push(x(m) + "," + y(cum[m]));
      h += '<polyline points="' + b2.join(" ") + '" fill="none" stroke="var(--chart-line-profit)" stroke-width="2.75" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"' + dStyle(60) + '/>';
    } else {
      var lp2 = [x(0) + "," + zeroY];
      cum.forEach(function (c, yr) { lp2.push(x(yr) + "," + y(c)); });
      lp2.push(x(H) + "," + zeroY);
      h += '<polygon points="' + lp2.join(" ") + '" fill="var(--chart-zone-profit)"' + aStyle(0) + '/>';
      var all = cum.map(function (c, yr) { return x(yr) + "," + y(c); }).join(" ");
      h += '<polyline points="' + all + '" fill="none" stroke="var(--chart-line-profit)" stroke-width="2.75" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"' + dStyle(0) + '/>';
    }
    h += '<circle cx="' + x(0) + '" cy="' + y(cum[0]) + '" r="5" fill="var(--chart-line-loss)"/>';
    var endVal = cum[H];
    h += '<circle cx="' + x(H) + '" cy="' + y(endVal) + '" r="6" fill="' + (endVal >= 0 ? "var(--chart-line-profit)" : "var(--chart-line-loss)") + '"/>';
    svg.innerHTML = h;

    var ev = $("chartEndValue"); ev.textContent = (endVal >= 0 ? "+" : "") + fmtKr(endVal) + " kr"; ev.classList.toggle("is-loss", endVal < 0);
    if (pb != null) {
      var beFrac = pb / H;
      chartEl.style.setProperty("--be-x", (beFrac * 100) + "%");
      chartEl.style.setProperty("--be-y-frac", String(beFrac));
      $("beTime").textContent = fmtYears(pb) + " år";
      chartEl.classList.remove("is-no-be");
      chartEl.classList.toggle("is-be-early", beFrac < 0.22);
    } else { chartEl.classList.add("is-no-be"); chartEl.classList.remove("is-be-early"); }

    if (!document.getElementById("ampyChartKeyframes")) {
      var st = document.createElement("style"); st.id = "ampyChartKeyframes";
      st.textContent = "@keyframes ampy-draw{to{stroke-dashoffset:0}}@keyframes ampy-zone-fade{to{opacity:1}}";
      document.head.appendChild(st);
    }
  }

  // --- methodology --------------------------------------------------------
  function renderMethodology(r) {
    var stack = $("methodologyStack");
    if (stack.dataset.seg === state.segment && stack.children.length) { return; } // statisk per segment
    stack.dataset.seg = state.segment; stack.textContent = "";
    var items = [
      ["Årlig besparing", "(W_före − W_efter) ÷ 1000 × h/dygn × 365 × antal × elpris", "Ren aritmetik på tal du själv ser och kan justera."],
      ["Energi", "sparad effekt × drifttimmar per år", "Skillnaden i förbrukning före och efter bytet."],
      ["Payback-tid", "kostnad ÷ årlig besparing", "Tid till break-even. Material" + (state.segment === "privat" ? " (gör-det-själv)" : " + installation av behörig elektriker") + "."],
      ["Besparing på " + r.horisont_ar + " år", "årlig besparing × " + r.horisont_ar + " − kostnad", "Vi antar oförändrat elpris — stiger priset blir besparingen större, inte mindre."]
    ];
    if (state.segment !== "privat") items.push(["CO₂", "sparad kWh × 464,79 g", "Nordisk residualmix (ESG, Energimarknadsinspektionen 2024). Visas aldrig för privatpersoner som fysiska utsläpp."]);
    items.forEach(function (it) {
      var box = el("div", "ampy-calc__methodology-item");
      box.appendChild(el("h3", null, it[0])); box.appendChild(el("code", null, it[1])); box.appendChild(el("p", null, it[2]));
      stack.appendChild(box);
    });
    var disc = $("disclaimers"); disc.textContent = "";
    disc.appendChild(el("p", null, "* Att betala = material" + (state.segment === "privat" ? " (gör-det-själv, ingen installation)" : " + installation. " ) + " " + (DATA.avdrag_copy[state.segment] || "")));
    disc.appendChild(el("p", null, "Elpris: medvetet lågt schablonpris per elprisområde (SE1–SE4). Watt-, kostnads- och timantaganden är konservativt valda. Källor: research-dossier (2026)."));
  }

  // --- statiska handlers --------------------------------------------------
  function wireStatic() {
    document.querySelectorAll("#segSegment button").forEach(function (btn) {
      btn.onclick = function () {
        if (btn.dataset.seg === state.segment) return;
        state.segment = btn.dataset.seg; setSegmentDefaults();
        track("segment_byte", { segment: state.segment });
        buildControls(); render();
      };
    });
    document.querySelectorAll("#segRegion button").forEach(function (btn) {
      btn.onclick = function () {
        state.elprisomrade = btn.dataset.region;
        document.querySelectorAll("#segRegion button").forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        render();
      };
    });
    $("inKontext").onchange = function () {
      state._kontext = this.value; var b = findBrinntid(this.value);
      if (b) { state.timmar_dag = b.timmar_dag; if (brinntidSlider) brinntidSlider.set(b.timmar_dag); }
      render();
    };
    // selector open/close
    $("typButton").onclick = function (e) { e.stopPropagation(); var s = $("typSelector"); s.setAttribute("aria-expanded", String(s.getAttribute("aria-expanded") !== "true")); };
    document.addEventListener("click", function (e) { if (!$("typSelector").contains(e.target)) closeSel(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSel(); });
    // CTA / email / läs mer
    $("ctaBtn").onclick = function () {
      track("cta_klick", { segment: state.segment, besparing: bucket((lastResult || {}).arlig_besparing || 0) });
      var url = DATA.cta && DATA.cta.url; if (url) window.open(url, "_blank", "noopener");
    };
    $("emailForm").onsubmit = function (e) {
      e.preventDefault();
      var v = $("emailInput").value.trim(); if (!v || v.indexOf("@") < 0) return;
      track("maila_kalkyl", { segment: state.segment, besparing: bucket((lastResult || {}).arlig_besparing || 0) });
      var ep = DATA.lankar.maila_endpoint;
      if (ep) { fetch(ep, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ epost: v, segment: state.segment, scenario: snapshot() }) }).catch(function () {}); }
      $("emailSubmit").textContent = "Skickat ✓"; $("emailInput").value = "";
      setTimeout(function () { $("emailSubmit").textContent = "Maila kalkylen"; }, 2500);
    };
  }
  function snapshot() { var r = lastResult || {}; return { typ_id: state.typ_id, antal: state.antal, timmar_dag: state.timmar_dag, elprisomrade: state.elprisomrade, arlig_besparing: Math.round(r.arlig_besparing || 0), payback_ar: r.payback_ar, netto: Math.round(r.netto_horisont || 0) }; }

  // --- telemetri ----------------------------------------------------------
  function captureMeta() {
    try { var s = sessionStorage.getItem("ampy_led_meta"); if (s) { meta = JSON.parse(s); return; } } catch (e) {}
    try {
      var q = new URLSearchParams(location.search), root = $("ampyLed");
      meta = { utm_source: q.get("utm_source") || "", utm_medium: q.get("utm_medium") || "", utm_campaign: q.get("utm_campaign") || "", utm_content: q.get("utm_content") || "", embed_sida: (root && root.getAttribute("data-sida")) || "", referrer: document.referrer || "" };
      sessionStorage.setItem("ampy_led_meta", JSON.stringify(meta));
    } catch (e) { meta = {}; }
  }
  function bucket(n) { n = Math.round(n) || 0; return n < 10000 ? "<10k" : n < 50000 ? "10-50k" : n < 150000 ? "50-150k" : "150k+"; }
  var berakningTimer = null;
  function trackBerakning(r) { if (berakningTimer) clearTimeout(berakningTimer); berakningTimer = setTimeout(function () { track("berakning", { segment: state.segment, besparing_spann: bucket(r.arlig_besparing) }); }, 600); }
  function track(name, props) { try { window.dataLayer = window.dataLayer || []; window.dataLayer.push(Object.assign({ event: "led_" + name }, meta, props || {})); } catch (e) {} }

  // --- init ---------------------------------------------------------------
  function init() {
    captureMeta(); applyPreset(); wireStatic(); buildControls(); render();
    track("calc_view", { segment: state.segment, elprisomrade: state.elprisomrade });
  }
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
