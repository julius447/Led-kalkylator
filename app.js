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
  var dragging = false, renderQueued = false;

  // Sammanför många slider-events till EN render per animationsruta (smooth drag)
  function scheduleRender() {
    if (renderQueued) return; renderQueued = true;
    requestAnimationFrame(function () { renderQueued = false; render(); });
  }

  // --- lookups ------------------------------------------------------------
  function lookup(list, k, v) { for (var i = 0; i < list.length; i++) if (list[i][k] === v) return list[i]; return null; }
  // Segment-medveten: "Snitt brinntid" finns per segment med olika timmar
  function findBrinntid(k) { return DATA.brinntid_default.filter(function (b) { return b.kontext === k && b.segment === state.segment; })[0]; }
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
    var drag = false;
    slider.addEventListener("pointerdown", function (e) { drag = true; dragging = true; try { slider.setPointerCapture(e.pointerId); } catch (x) {} setVal(pickByX(e.clientX), true); });
    slider.addEventListener("pointermove", function (e) { if (drag) setVal(pickByX(e.clientX), true); });
    slider.addEventListener("pointerup", function () { drag = false; dragging = false; scheduleRender(); });
    slider.addEventListener("pointercancel", function () { drag = false; dragging = false; scheduleRender(); });
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
    $("antalLabel").firstChild.nodeValue = "Antal " + plural + " ";
    $("antalUnit").textContent = plural === "armaturer" ? "st" : "st";
    $("ctaLabel").textContent = d.cta_text;

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
      onInput: function (v) { state.antal = v; $("antalValue").textContent = fmtInt(v); scheduleRender(); }
    });

    // brinntid slider
    brinntidSlider = buildSlider("brinntidSlider", {
      min: 0, max: 24, value: state.timmar_dag, step: 0.5, ticks: [0, 6, 12, 18, 24],
      format: function (v) { return fmtYears(v) + " h"; },
      aria: function (v) { return fmtYears(v) + " timmar per dygn"; },
      onInput: function (v) { state.timmar_dag = v; $("brinntidValue").textContent = fmtYears(v); scheduleRender(); }
    });
  }

  // --- render -------------------------------------------------------------
  function render() {
    try {
      var r = calc(state, DATA); lastResult = r;
      renderHero(r); renderStats(r); renderCompare(r);
      $("antalValue").textContent = fmtInt(state.antal);
      $("brinntidValue").textContent = fmtYears(state.timmar_dag);
      renderMethodology(r);
      trackBerakning(r);
      firstPaint = false;
    } catch (e) { renderError(); }
  }
  function renderError() {
    setText("heroValue", "—");
    ["statKwh", "statB", "statCost"].forEach(function (id) { setText(id, "—"); });
    track("calc_error", { segment: state.segment, typ_id: state.typ_id });
  }

  function animateNumber(key, target, fmt, id) {
    var node = $(id); if (!node) return;
    node.textContent = fmt(target);
    if (firstPaint || prefersReduced || dragging) { prev[key] = target; return; }
    var from = prev[key] != null ? prev[key] : target; prev[key] = target;
    if (from === target) return;
    var t0 = null, dur = 280;
    function step(ts) { if (!t0) t0 = ts; var t = Math.min((ts - t0) / dur, 1); var e = 1 - Math.pow(1 - t, 3); node.textContent = fmt(from + (target - from) * e); if (t < 1) requestAnimationFrame(step); else node.textContent = fmt(target); }
    requestAnimationFrame(step);
    // Skyddsnät: garantera slutvärdet även om rAF strypts (bakgrundsflik)
    setTimeout(function () { node.textContent = fmt(target); }, dur + 80);
  }

  // Hjälte = årlig besparing (siffran i fokus)
  function renderHero(r) { animateNumber("hero", r.arlig_besparing, fmtKr, "heroValue"); }

  // Tre poster: energi du kapar · CO2 du sparar (privat → kr/mån) · uppskattad kostnad
  function renderStats(r) {
    var b = r.breakdown, privat = state.segment === "privat";
    animateNumber("kwh", r.kwh_ar, fmtInt, "statKwh");
    var pct = b.kwh_gammal_total > 0 ? Math.round(r.kwh_ar / b.kwh_gammal_total * 100) : 0;
    $("statKwhSub").textContent = pct + " % lägre förbrukning";

    var statB = $("statB"), statBUnit = $("statBUnit"), statBLabel = $("statBLabel"), statBSub = $("statBSub");
    if (r.visa_co2 && r.co2_kg_ar != null) {
      var ton = r.co2_kg_ar >= 1000;
      statBLabel.textContent = "CO₂ du sparar";
      statB.textContent = ton ? (r.co2_kg_ar / 1000).toFixed(1).replace(".", ",") : fmtInt(r.co2_kg_ar);
      statBUnit.textContent = ton ? "ton/år" : "kg/år";
      statBSub.textContent = "nordisk residualmix (ESG)";
    } else {
      statBLabel.textContent = "Per månad";
      statB.textContent = fmtKr(r.arlig_besparing / 12);
      statBUnit.textContent = "kr/mån";
      statBSub.textContent = "lägre elkostnad";
    }

    animateNumber("cost", b.total_led_kostnad, fmtKr, "statCost");
    $("statCostSub").textContent = "≈ " + fmtKr(b.per_enhet_kostnad) + " kr/" + (privat ? "ljuskälla" : "armatur") +
      (privat ? " · inkl moms efter ROT" : " · ex moms");
  }

  // Före/efter — elkostnad per år (ersätter payback-kurvan)
  function renderCompare(r) {
    var b = r.breakdown, kr = b.kr_kwh;
    var costNow = b.kwh_gammal_total * kr, costLed = b.kwh_led_total * kr;
    $("costNow").textContent = fmtKr(costNow) + " kr";
    $("costLed").textContent = fmtKr(costLed) + " kr";
    var max = costNow > 0 ? costNow : 1;
    $("barNow").style.width = "100%";
    $("barLed").style.width = (costLed / max * 100) + "%";
    var pct = costNow > 0 ? Math.round((1 - costLed / costNow) * 100) : 0;
    $("compareCaption").innerHTML = "LED drar <strong>" + pct + " % mindre</strong> — skillnaden är din besparing.";
  }

  // --- methodology --------------------------------------------------------
  function renderMethodology(r) {
    var stack = $("methodologyStack");
    if (stack.dataset.seg === state.segment && stack.children.length) { return; } // statisk per segment
    stack.dataset.seg = state.segment; stack.textContent = "";
    var privat = state.segment === "privat";
    var unit = privat ? "ljuskälla" : "armatur";
    var items = [
      ["Årlig besparing", "(W_före − W_efter) ÷ 1000 × h/dygn × 365 × antal × elpris", "Ren aritmetik på tal du själv ser och kan justera."],
      ["Energi du kapar", "(W_före − W_efter) ÷ 1000 × h/dygn × 365 × antal", "Minskningen i elförbrukning (kWh/år) — samma procent som i före/efter-jämförelsen."]
    ];
    if (!privat) items.push(["CO₂ du sparar", "sparad kWh/år × 464,79 g ÷ 1000 → kg", "Nordisk residualmix (ESG, Energimarknadsinspektionen 2024). Visas aldrig för privatpersoner som fysiska utsläpp."]);
    items.push(["Uppskattad kostnad", "pris per " + unit + " × antal", "Material och installation ingår i priset."]);
    items.push(["Payback-tid", "kostnad ÷ årlig besparing", "Ungefärlig tid till break-even — exakt siffra i offerten."]);
    items.forEach(function (it) {
      var box = el("div", "ampy-calc__methodology-item");
      box.appendChild(el("h3", null, it[0])); box.appendChild(el("code", null, it[1])); box.appendChild(el("p", null, it[2]));
      stack.appendChild(box);
    });
    var disc = $("disclaimers"); disc.textContent = "";
    disc.appendChild(el("p", null, "* " + (DATA.avdrag_copy[state.segment] || "")));
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
    // CTA
    $("ctaBtn").onclick = function () {
      track("cta_klick", { segment: state.segment, besparing: bucket((lastResult || {}).arlig_besparing || 0) });
      var url = DATA.cta && DATA.cta.url; if (url) window.open(url, "_blank", "noopener");
    };
    wireTooltips();
  }

  // Flytande info-tooltip (visas vid hover/fokus/tap på "i"-knappar)
  function wireTooltips() {
    var tip = el("div", "ampy-calc__tooltip"); tip.style.display = "none";
    $("ampyLed").appendChild(tip); // inuti .ampy-calc så tokens (var) gäller
    var current = null;
    function show(btn) {
      current = btn; tip.textContent = btn.dataset.tip || "";
      var tw = Math.min(280, window.innerWidth - 24);
      tip.style.maxWidth = tw + "px"; tip.style.display = "block";
      var r = btn.getBoundingClientRect();
      var left = clamp(r.left + r.width / 2 - tw / 2, 12, window.innerWidth - tw - 12);
      tip.style.left = left + "px";
      tip.style.top = (r.top - 8) + "px";
      tip.style.transform = "translateY(-100%)";
    }
    function hide() { current = null; tip.style.display = "none"; }
    document.querySelectorAll(".ampy-calc__tip").forEach(function (btn) {
      btn.addEventListener("mouseenter", function () { show(btn); });
      btn.addEventListener("mouseleave", hide);
      btn.addEventListener("focus", function () { show(btn); });
      btn.addEventListener("blur", hide);
      btn.addEventListener("click", function (e) { e.preventDefault(); if (current === btn) hide(); else show(btn); });
    });
    window.addEventListener("scroll", hide, true);
  }

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
