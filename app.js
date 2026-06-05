/* =============================================================================
   LED-kalkylatorn — RENDERARE + INTERAKTION (Lager 5)
   Avrundning sker BARA här. Motorn levererar full precision.
   Instant value: körs en gång vid init, noll interaktion krävd.
   ============================================================================= */
(function () {
  "use strict";

  var DATA = window.AMPY_LED_DATA;
  var calc = window.AmpyLED.calculate;

  // --- Formattering (avrundning lever bara här) ---------------------------
  var nf0 = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 });
  var nf1 = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 1 });
  // kr/kWh visas med 2 decimaler så den uppställda formeln rekoncilierar exakt
  // (annars skulle 1,65 visas som 1,7 och en granskares omräkning slå fel).
  var nf2 = new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function kr(n) { return nf0.format(Math.round(n)) + " kr"; }
  function kwh(n) { return nf0.format(Math.round(n)) + " kWh"; }
  function ar(n) { return n == null ? "—" : nf1.format(n) + " år"; }

  // --- Tillstånd ----------------------------------------------------------
  var state = {
    segment: "foretag", // verktyget öppnar i Företag/BRF-läge (fristående)
    typ_id: null, antal: null, timmar_dag: null, elprisomrade: "SE3"
  };

  // Läs embed-preset från data-attribut (sida → förvalt läge)
  function applyPreset() {
    var root = document.querySelector(".ampy-led");
    var sida = root && root.getAttribute("data-sida");
    var preset = sida && DATA.embed_preset[sida];
    var seg = (preset && preset.segment) || state.segment;
    var d = DATA.defaults[seg];
    state.segment = seg;
    state.typ_id = (preset && preset.typ_id) || d.typ_id;
    state.antal = d.antal;
    var ctx = (preset && preset.kontext) || d.kontext;
    var brt = findBrinntid(ctx);
    state.timmar_dag = brt ? brt.timmar_dag : 9;
    state._kontext = ctx;
  }

  function findBrinntid(kontext) {
    return DATA.brinntid_default.filter(function (b) { return b.kontext === kontext; })[0];
  }
  function typerForSegment(seg) {
    // Privat: privat-typer. Företag/BRF: kommersiell armatur (foretag-taggad)
    // + GU10-spots som också förekommer i lokaler.
    return DATA.watt_tabell.filter(function (t) {
      if (seg === "privat") return t.segment === "privat";
      return t.segment === "foretag" || t.id === "gu10_50";
    });
  }
  function kontexterForSegment(seg) {
    return DATA.brinntid_default.filter(function (b) { return b.segment === seg; });
  }

  // --- Rendrering ---------------------------------------------------------
  function render() {
    var r = calc(state, DATA);
    var d = DATA.defaults[state.segment];

    // Hjälte-siffra (dominant) + framing
    setText("framing", d.framing);
    setText("heroLabel", state.segment === "privat" ? "Du sparar ca" : "Lägre driftskostnad ca");
    var heroEl = document.getElementById("heroNumber");
    heroEl.innerHTML = kr(r.arlig_besparing) + '<span class="hero-unit">/år</span>';

    // Stödtrio
    setText("statKwh", kwh(r.kwh_ar) + "/år");
    setText("statPayback", ar(r.payback_ar));
    setText("stat10ar", kr(r.besparing_10ar));

    // CO2 (endast Företag/BRF)
    var co2Wrap = document.getElementById("co2Stat");
    if (r.visa_co2 && r.co2_kg_ar != null) {
      co2Wrap.style.display = "";
      setText("statCo2", nf0.format(Math.round(r.co2_kg_ar)) + " kg/år");
    } else {
      co2Wrap.style.display = "none";
    }

    renderBreakdown(r);
    renderHonesty();
    renderCta(r);
    renderShare(r);
  }

  function renderBreakdown(r) {
    var b = r.breakdown;
    var f = document.getElementById("formula");
    // Uppställd formel med användarens EGNA tal — aldrig en textblob
    f.innerHTML =
      '(' + b.w_gammal + ' W <span class="op">−</span> ' + b.w_led + ' W) ' +
      '<span class="op">×</span> ' + nf1.format(b.timmar_dag) + ' h/dag ' +
      '<span class="op">×</span> 365 ' +
      '<span class="op">×</span> ' + nf0.format(b.antal) + ' st ' +
      '<span class="op">×</span> ' + nf2.format(b.kr_kwh) + ' kr/kWh<br>' +
      '<span class="op">=</span> <span class="res">' + kr(r.arlig_besparing) + '/år</span>';

    var rows = [
      ["Effekt per ljuskälla", b.w_gammal + " W → " + b.w_led + " W (−" + b.w_sparad + " W)"],
      ["Brinntid", nf1.format(b.timmar_dag) + " h/dag × 365 dagar"],
      ["Antal", nf0.format(b.antal) + " st"],
      ["Elpris (totalpris)", nf2.format(b.kr_kwh) + " kr/kWh"],
      ["Energi: före → efter", kwh(b.kwh_gammal_total) + " → " + kwh(b.kwh_led_total) + "/år"],
      ["LED-kostnad" + (b.betalar_installation ? " (material + installation)" : " (material)"),
        kr(b.total_led_kostnad) + " (" + kr(b.per_enhet_kostnad) + "/st)"]
    ];
    var html = "";
    rows.forEach(function (row) { html += "<tr><td>" + row[0] + "</td><td>" + row[1] + "</td></tr>"; });
    document.getElementById("breakdownRows").innerHTML = html;
  }

  function renderHonesty() {
    var seg = state.segment;
    document.getElementById("avdragCopy").textContent = DATA.avdrag_copy[seg];
  }

  function renderCta(r) {
    var d = DATA.defaults[state.segment];
    var inService = isServiceZone(state.elprisomrade);
    var zone = document.getElementById("ctaZone");
    var btn = document.getElementById("ctaBtn");
    var title = document.getElementById("ctaTitle");
    var sub = document.getElementById("ctaSub");

    if (inService) {
      zone.classList.remove("outside");
      title.textContent = state.segment === "privat"
        ? "Vill du ha hjälp att byta?"
        : "Vill ni gå vidare?";
      sub.textContent = state.segment === "privat"
        ? "En behörig elektriker kan göra jobbet snabbt och säkert."
        : "Få en kostnadsfri genomgång baserad på just er belysning.";
      btn.style.display = "";
      btn.textContent = d.cta_text;
    } else {
      // Geo-doktrin: full siffra ges ändå; CTA byts mot ärlig hänvisning
      zone.classList.add("outside");
      title.textContent = "Vi finns inte i ditt elprisområde än";
      sub.textContent = DATA.geo.utanfor_text;
      btn.style.display = "none";
    }
  }

  function isServiceZone(omrade) {
    var f = DATA.geo.regioner[omrade];
    return (typeof f === "boolean") ? f : DATA.geo.default_servicezon;
  }

  function renderShare(r) {
    var t;
    if (state.segment === "brf") t = "Vår förening kan spara ca " + kr(r.arlig_besparing) + "/år med LED.";
    else if (state.segment === "foretag") t = "Vårt företag sänker driftskostnaden ca " + kr(r.arlig_besparing) + "/år med LED.";
    else t = "Jag sparar ca " + kr(r.arlig_besparing) + "/år genom att byta till LED.";
    document.getElementById("shareQuote").textContent = "”" + t + " — beräknat med Ampys LED-kalkylator.”";
    document.getElementById("shareBtn").onclick = function () {
      var url = location.href.split("#")[0];
      if (navigator.share) navigator.share({ title: "LED-besparing", text: t, url: url }).catch(function(){});
      else { navigator.clipboard && navigator.clipboard.writeText(t + " " + url); flash(this, "Kopierat!"); }
      track("share", { segment: state.segment, besparing: Math.round(r.arlig_besparing) });
    };
  }

  // --- Kontroller (bygg input-UI per segment) -----------------------------
  function buildControls() {
    // Segment-toggle
    document.querySelectorAll(".seg-toggle button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.seg === state.segment));
      b.onclick = function () {
        state.segment = b.dataset.seg;
        var d = DATA.defaults[state.segment];
        state.typ_id = d.typ_id; state.antal = d.antal;
        var ctx = d.kontext; var brt = findBrinntid(ctx);
        state.timmar_dag = brt ? brt.timmar_dag : 9; state._kontext = ctx;
        track("segment_byte", { segment: state.segment });
        buildControls(); render();
      };
    });

    // Ljuskälla
    var typSel = document.getElementById("inTyp");
    typSel.innerHTML = "";
    typerForSegment(state.segment).forEach(function (t) {
      var o = document.createElement("option");
      o.value = t.id; o.textContent = t.namn; if (t.id === state.typ_id) o.selected = true;
      typSel.appendChild(o);
    });
    if (!typerForSegment(state.segment).some(function (t) { return t.id === state.typ_id; })) {
      state.typ_id = typSel.value;
    }
    typSel.onchange = function () { state.typ_id = this.value; render(); };

    // Kontext (brinntid-preset)
    var ctxSel = document.getElementById("inKontext");
    ctxSel.innerHTML = "";
    kontexterForSegment(state.segment).forEach(function (c) {
      var o = document.createElement("option");
      o.value = c.kontext; o.textContent = c.kontext + " (" + nf1.format(c.timmar_dag) + " h/dag)";
      if (c.kontext === state._kontext) o.selected = true;
      ctxSel.appendChild(o);
    });
    ctxSel.onchange = function () {
      state._kontext = this.value; var brt = findBrinntid(this.value);
      if (brt) { state.timmar_dag = brt.timmar_dag; syncBrinntid(); } render();
    };

    // Antal (stepper)
    var antalIn = document.getElementById("inAntal");
    antalIn.value = state.antal;
    antalIn.oninput = function () { state.antal = Math.max(0, parseInt(this.value || "0", 10)); render(); };
    document.getElementById("antalMinus").onclick = function () { state.antal = Math.max(0, state.antal - 1); antalIn.value = state.antal; render(); };
    document.getElementById("antalPlus").onclick = function () { state.antal = state.antal + 1; antalIn.value = state.antal; render(); };

    // Brinntid (slider, justerar antagandet öppet)
    syncBrinntid();
    document.getElementById("inBrinntid").oninput = function () {
      state.timmar_dag = parseFloat(this.value); syncBrinntid(); render();
    };

    // Elprisområde
    var elSel = document.getElementById("inElomrade");
    elSel.value = state.elprisomrade;
    elSel.onchange = function () { state.elprisomrade = this.value; render(); };
  }

  function syncBrinntid() {
    var s = document.getElementById("inBrinntid");
    s.value = state.timmar_dag;
    document.getElementById("brinntidVal").textContent = nf1.format(state.timmar_dag) + " h/dag";
  }

  // --- Hjälpare -----------------------------------------------------------
  function setText(id, t) { var el = document.getElementById(id); if (el) el.textContent = t; }
  function flash(el, msg) { var o = el.textContent; el.textContent = msg; setTimeout(function () { el.textContent = o; }, 1500); }
  function track(name, props) {
    // Beteende-events → GA4/Meta (retargeting). Tyst om ej laddat.
    try { window.dataLayer && window.dataLayer.push(Object.assign({ event: "led_" + name }, props)); } catch (e) {}
  }

  // --- Init: instant value vid laddning -----------------------------------
  function init() {
    applyPreset();
    buildControls();
    render();
  }
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
