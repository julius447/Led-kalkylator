/* =============================================================================
   LED-kalkylatorn — RENDERARE + INTERAKTION (Lager 5) — vol.3
   Avrundning sker BARA här. Motorn levererar full precision.
   Instant value på load; ingen vägg före svaret. Ett tal, ett lugnt val.
   ============================================================================= */
(function () {
  "use strict";

  var DATA = window.AMPY_LED_DATA;
  var calc = window.AmpyLED.calculate;

  // --- Formattering (avrundning lever bara här) ---------------------------
  var nf0 = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 });
  var nf1 = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 1 });
  var nf2 = new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function kr(n) { return nf0.format(Math.round(n)) + " kr"; }
  function kwh(n) { return nf0.format(Math.round(n)) + " kWh"; }
  function pris(n) { return nf2.format(n) + " kr/kWh"; }
  function co2text(kg) { return kg >= 1000 ? nf1.format(kg / 1000) + " ton" : nf0.format(Math.round(kg)) + " kg"; }

  // --- Tillstånd ----------------------------------------------------------
  var state = {
    segment: "brf",            // öppnar på BRF
    typ_id: null, antal: null, timmar_dag: null, elprisomrade: "SE3", _kontext: null
  };
  var lastResult = null, meta = {}, berakningTimer = null;

  // --- Init / preset ------------------------------------------------------
  function applyPreset() {
    var root = document.querySelector(".ampy-led");
    var sida = root && root.getAttribute("data-sida");
    var preset = sida && DATA.embed_preset[sida];
    var seg = (preset && preset.segment) || state.segment;
    var d = DATA.defaults[seg];
    state.segment = seg;
    state.typ_id = (preset && preset.typ_id) || d.typ_id;
    state.antal = d.antal;
    state._kontext = (preset && preset.kontext) || d.kontext;
    var brt = findBrinntid(state._kontext);
    state.timmar_dag = brt ? brt.timmar_dag : 8;
    validateState();
  }
  function validateState() {
    if (!DATA.defaults[state.segment]) state.segment = "brf";
    if (!typerForSegment(state.segment).some(function (t) { return t.id === state.typ_id; })) {
      state.typ_id = DATA.defaults[state.segment].typ_id;
    }
    if (!kontexterForSegment(state.segment).some(function (c) { return c.kontext === state._kontext; })) {
      state._kontext = DATA.defaults[state.segment].kontext;
      var b = findBrinntid(state._kontext); state.timmar_dag = b ? b.timmar_dag : 8;
    }
  }

  // --- Uppslag ------------------------------------------------------------
  function findBrinntid(k) { return DATA.brinntid_default.filter(function (b) { return b.kontext === k; })[0]; }
  function typerForSegment(seg) {
    var kat = seg === "privat" ? "privat" : "kommersiell";
    return DATA.watt_tabell.filter(function (t) { return t.kat === kat; });
  }
  function kontexterForSegment(seg) {
    return DATA.brinntid_default.filter(function (b) { return b.segment === seg; });
  }
  function clampNum(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }

  // --- Rendrering (felgräns — ingen rå krasch syns) -----------------------
  function render() {
    try {
      var r = calc(state, DATA);
      lastResult = r;
      var d = DATA.defaults[state.segment];

      setText("heroLabel", d.hero_label);
      document.getElementById("heroNumber").innerHTML =
        nf0.format(Math.round(r.arlig_besparing)) + '<span class="hero-unit"> kr/år</span>';

      // Block A — energi/år (alla segment)
      setText("statKwh", kwh(r.kwh_ar));
      setText("statKwhKey", "energi per år");

      // Block B — CO2 (Företag/BRF) ELLER kr/månad (Privat, doktrin-swap)
      var statB = document.getElementById("statB");
      var statBKey = document.getElementById("statBKey");
      if (r.visa_co2 && r.co2_kg_ar != null) {
        statB.textContent = co2text(r.co2_kg_ar);
        statBKey.innerHTML = 'mindre CO₂ per år<span class="esg">nordisk residualmix (ESG)</span>';
      } else {
        statB.textContent = kr(r.arlig_besparing / 12);
        statBKey.textContent = "i månaden";
      }

      renderBreakdown(r);
      renderTransparency();
      track_berakning(r);
    } catch (e) {
      renderError();
    }
  }

  function renderError() {
    setText("heroLabel", "Kunde inte räkna just nu");
    var h = document.getElementById("heroNumber"); if (h) h.textContent = "—";
    setText("statKwh", "—"); setText("statB", "—");
    track("calc_error", { segment: state.segment, typ_id: state.typ_id });
  }

  function renderBreakdown(r) {
    var b = r.breakdown;
    // Uppställd formel med användarens EGNA tal
    document.getElementById("formula").innerHTML =
      nf0.format(b.antal) + ' st <span class="op">×</span> ' + b.w_sparad + ' W <span class="op">×</span> ' +
      nf1.format(b.timmar_dag) + ' h <span class="op">×</span> 365 <span class="op">÷</span> 1000 ' +
      '<span class="op">×</span> ' + nf2.format(b.kr_kwh) + ' kr<br>' +
      '<span class="op">=</span> <span class="res">' + kr(r.arlig_besparing) + '/år</span>';

    var rows = [
      ["Elprisområde", state.elprisomrade + " · " + pris(b.kr_kwh)],
      ["Watt före", b.w_gammal + " W"],
      ["Watt efter (LED)", b.w_led + " W"],
      ["Brinntid", nf1.format(b.timmar_dag) + " h/dygn"],
      ["Antal", nf0.format(b.antal) + " st"],
      ["Drifttid per år", nf0.format(b.timmar_dag * b.dagar) + " h"]
    ];
    var html = "";
    rows.forEach(function (row) { html += "<tr><td>" + row[0] + "</td><td>" + row[1] + "</td></tr>"; });
    document.getElementById("breakdownRows").innerHTML = html;

    document.getElementById("avdragCopy").textContent = DATA.avdrag_copy[state.segment] || "";
  }

  function renderTransparency() {
    var ctx = document.getElementById("lysrorContext");
    if (state.segment === "privat") { ctx.classList.add("is-hidden"); }
    else {
      ctx.textContent = DATA.lysror_fakta.text;
      ctx.setAttribute("title", "Källa: " + DATA.lysror_fakta.kalla);
      ctx.classList.remove("is-hidden");
    }
  }

  // --- Kontroller ---------------------------------------------------------
  function buildControls() {
    var d = DATA.defaults[state.segment];

    document.querySelectorAll(".seg-toggle button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.seg === state.segment));
      btn.onclick = function () {
        if (btn.dataset.seg === state.segment) return;
        state.segment = btn.dataset.seg;
        var nd = DATA.defaults[state.segment];
        state.typ_id = nd.typ_id; state.antal = nd.antal; state._kontext = nd.kontext;
        var brt = findBrinntid(nd.kontext); state.timmar_dag = brt ? brt.timmar_dag : 8;
        track("segment_byte", { segment: state.segment });
        buildControls(); render();
      };
    });
    setText("segCaption", d.seg_caption);
    setText("ctaBtn", d.cta_text);

    // Ljuskälla — segment-filtrerad, grupperad i optgroups
    var typSel = document.getElementById("inTyp");
    typSel.innerHTML = "";
    var typer = typerForSegment(state.segment);
    var grupper = [];
    typer.forEach(function (t) { if (grupper.indexOf(t.grupp) === -1) grupper.push(t.grupp); });
    grupper.forEach(function (g) {
      var og = document.createElement("optgroup"); og.label = g;
      typer.filter(function (t) { return t.grupp === g; }).forEach(function (t) {
        var o = document.createElement("option");
        o.value = t.id; o.textContent = t.namn; if (t.id === state.typ_id) o.selected = true;
        og.appendChild(o);
      });
      typSel.appendChild(og);
    });
    typSel.onchange = function () { state.typ_id = this.value; render(); };

    // Kontext
    var ctxSel = document.getElementById("inKontext");
    ctxSel.innerHTML = "";
    kontexterForSegment(state.segment).forEach(function (c) {
      var o = document.createElement("option");
      o.value = c.kontext; o.textContent = c.kontext + " (" + nf1.format(c.timmar_dag) + " h/dygn)";
      if (c.kontext === state._kontext) o.selected = true;
      ctxSel.appendChild(o);
    });
    ctxSel.onchange = function () {
      state._kontext = this.value;
      var brt = findBrinntid(this.value);
      if (brt) { state.timmar_dag = brt.timmar_dag; syncBrinntid(); }
      render();
    };

    document.getElementById("inAntal").value = state.antal;
    document.getElementById("inElomrade").value = state.elprisomrade;
    syncBrinntid();
    syncElprisHint();
  }

  // Statiska handlers (binds en gång) --------------------------------------
  function wireStatic() {
    var antalIn = document.getElementById("inAntal");
    antalIn.oninput = function () {
      var n = parseInt(this.value, 10);
      state.antal = isNaN(n) ? 0 : clampNum(n, 0, DATA.limits.antal_max);
      render();
    };
    antalIn.onchange = function () {
      var n = parseInt(this.value, 10);
      state.antal = isNaN(n) ? 0 : clampNum(n, 0, DATA.limits.antal_max);
      this.value = state.antal; render();
    };
    document.getElementById("antalMinus").onclick = function () {
      var c = isNaN(state.antal) ? 0 : state.antal;
      state.antal = Math.max(0, c - 1); antalIn.value = state.antal; render();
    };
    document.getElementById("antalPlus").onclick = function () {
      var c = isNaN(state.antal) ? 0 : state.antal;
      state.antal = Math.min(DATA.limits.antal_max, c + 1); antalIn.value = state.antal; render();
    };

    document.getElementById("inBrinntid").oninput = function () {
      state.timmar_dag = parseFloat(this.value); syncBrinntid(); render();
    };

    document.getElementById("inElomrade").onchange = function () {
      state.elprisomrade = this.value; syncElprisHint(); render();
    };

    document.getElementById("breakdown").addEventListener("toggle", function () {
      if (this.open) track("breakdown_open", { segment: state.segment });
    });

    document.getElementById("ctaBtn").onclick = function () {
      track("cta_klick", { segment: state.segment, besparing: bucket((lastResult || {}).arlig_besparing || 0) });
      var url = DATA.cta && DATA.cta.url;
      if (url) window.open(url, "_blank", "noopener");
    };
  }

  function syncBrinntid() {
    var s = document.getElementById("inBrinntid");
    s.value = state.timmar_dag;
    s.setAttribute("aria-valuetext", nf1.format(state.timmar_dag) + " timmar per dygn");
    setText("brinntidVal", nf1.format(state.timmar_dag) + " h/dygn");
  }
  function syncElprisHint() {
    setText("elprisHint", "Vi använder ett medvetet lågt schablonpris för " + state.elprisomrade +
      " (" + pris(DATA.elpris[state.elprisomrade]) + ") — din verkliga besparing blir snarare högre.");
  }

  // --- Telemetri ----------------------------------------------------------
  function captureMeta() {
    try { var s = sessionStorage.getItem("ampy_led_meta"); if (s) { meta = JSON.parse(s); return; } } catch (e) {}
    try {
      var q = new URLSearchParams(location.search);
      var root = document.querySelector(".ampy-led");
      meta = {
        utm_source: q.get("utm_source") || "", utm_medium: q.get("utm_medium") || "",
        utm_campaign: q.get("utm_campaign") || "", utm_content: q.get("utm_content") || "",
        embed_sida: (root && root.getAttribute("data-sida")) || "", referrer: document.referrer || ""
      };
      sessionStorage.setItem("ampy_led_meta", JSON.stringify(meta));
    } catch (e) { meta = {}; }
  }
  function bucket(n) { n = Math.round(n) || 0; return n < 10000 ? "<10k" : n < 50000 ? "10-50k" : n < 150000 ? "50-150k" : "150k+"; }
  function track_berakning(r) {
    if (berakningTimer) clearTimeout(berakningTimer);
    berakningTimer = setTimeout(function () {
      track("berakning", { segment: state.segment, besparing_spann: bucket(r.arlig_besparing) });
    }, 600);
  }
  function track(name, props) {
    try { window.dataLayer = window.dataLayer || []; window.dataLayer.push(Object.assign({ event: "led_" + name }, meta, props || {})); } catch (e) {}
  }

  // --- Hjälpare -----------------------------------------------------------
  function setText(id, t) { var el = document.getElementById(id); if (el) el.textContent = t; }

  // --- Init ---------------------------------------------------------------
  function init() {
    captureMeta();
    applyPreset();
    wireStatic();
    buildControls();
    render();
    track("calc_view", { segment: state.segment, elprisomrade: state.elprisomrade });
  }
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
