/* =============================================================================
   LED-kalkylatorn — RENDERARE + INTERAKTION (Lager 5)
   Avrundning sker BARA här. Motorn levererar full precision.
   Instant value: körs en gång vid init, noll interaktion krävd.
   Värde först, lead som konsekvens. Ingen vägg före svaret.
   ============================================================================= */
(function () {
  "use strict";

  var DATA = window.AMPY_LED_DATA;
  var calc = window.AmpyLED.calculate;

  // --- Formattering (avrundning lever bara här) ---------------------------
  var nf0 = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 });
  var nf1 = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 1 });
  // kr/kWh visas med 2 decimaler så den uppställda formeln rekoncilierar exakt.
  var nf2 = new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function kr(n) { return nf0.format(Math.round(n)) + " kr"; }
  function kwh(n) { return nf0.format(Math.round(n)) + " kWh"; }
  function ar(n) { return n == null ? "—" : nf1.format(n) + " år"; }
  function pris(n) { return nf2.format(n) + " kr/kWh"; }

  // --- Tillstånd ----------------------------------------------------------
  var state = {
    segment: "foretag", // verktyget öppnar i Företag/BRF-läge (fristående)
    typ_id: null, antal: null, timmar_dag: null, elprisomrade: "SE3",
    kr_kwh: null,       // användarens override; null = använd områdesdefault
    _kontext: null, _leadOpen: false, _leadDone: false
  };
  var lastResult = null;            // senaste beräkning (för lead/share)
  var meta = {};                    // utm/embed-proveniens, slås ihop i varje event
  var berakningTimer = null;

  // --- Init-hjälpare ------------------------------------------------------
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
    state._kontext = ctx;
    var brt = findBrinntid(ctx);
    state.timmar_dag = brt ? brt.timmar_dag : 9;
    state.kr_kwh = zonpris(state.elprisomrade); // område seedar priset
    validateState();
  }

  // Dela-länk: scenario i URL-hash vinner över embed-preset
  function hydrateFromHash() {
    var h = location.hash && location.hash.replace(/^#/, "");
    if (!h) return;
    var p = {};
    h.split("&").forEach(function (kv) { var x = kv.split("="); p[x[0]] = decodeURIComponent(x[1] || ""); });
    if (p.s && DATA.defaults[p.s]) state.segment = p.s;
    if (p.z && typeof DATA.elpris[p.z] === "number") state.elprisomrade = p.z;
    if (p.t && lookup(DATA.watt_tabell, "id", p.t)) state.typ_id = p.t;
    if (p.h != null && isFinite(parseFloat(p.h))) state.timmar_dag = clampNum(parseFloat(p.h), 0, 24);
    if (p.n != null && isFinite(parseInt(p.n, 10))) state.antal = clampNum(parseInt(p.n, 10), 0, DATA.limits.antal_max);
    var ctx = findKontextFor(state.segment, state._kontext);
    state._kontext = ctx;
    if (p.pris != null && isFinite(parseFloat(p.pris))) state.kr_kwh = clampNum(parseFloat(p.pris), DATA.elpris.min, DATA.elpris.max);
    else state.kr_kwh = zonpris(state.elprisomrade);
    validateState();
  }

  // Säkerställ att state pekar på giltiga poster (skyddar mot trasig preset/hash)
  function validateState() {
    if (!DATA.defaults[state.segment]) state.segment = "foretag";
    var typer = typerForSegment(state.segment);
    if (!typer.some(function (t) { return t.id === state.typ_id; })) state.typ_id = DATA.defaults[state.segment].typ_id;
    state._kontext = findKontextFor(state.segment, state._kontext);
    var brt = findBrinntid(state._kontext);
    if (state.timmar_dag == null && brt) state.timmar_dag = brt.timmar_dag;
    if (state.antal == null) state.antal = DATA.defaults[state.segment].antal;
    if (typeof state.kr_kwh !== "number" || state.kr_kwh <= 0) state.kr_kwh = zonpris(state.elprisomrade);
  }

  // --- Uppslag ------------------------------------------------------------
  function lookup(list, key, val) {
    for (var i = 0; i < list.length; i++) if (list[i][key] === val) return list[i];
    return null;
  }
  function findBrinntid(kontext) {
    return DATA.brinntid_default.filter(function (b) { return b.kontext === kontext; })[0];
  }
  function findKontextFor(seg, wanted) {
    var list = kontexterForSegment(seg);
    if (wanted && list.some(function (c) { return c.kontext === wanted; })) return wanted;
    var d = findBrinntid(DATA.defaults[seg].kontext);
    return (d && d.kontext) || (list[0] && list[0].kontext);
  }
  function typerForSegment(seg) {
    return DATA.watt_tabell.filter(function (t) {
      if (seg === "privat") return t.segment === "privat";
      return t.segment === "foretag" || t.id === "gu10_50";
    });
  }
  function kontexterForSegment(seg) {
    return DATA.brinntid_default.filter(function (b) { return b.segment === seg; });
  }
  function zonpris(zon) {
    return typeof DATA.elpris[zon] === "number" ? DATA.elpris[zon] : DATA.elpris.nationellt_default;
  }
  function clampNum(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
  function isServiceZone(omrade) {
    var f = DATA.geo.regioner[omrade];
    return (typeof f === "boolean") ? f : DATA.geo.default_servicezon;
  }

  // --- Rendrering (felgräns: ingen rå krasch syns) ------------------------
  function render() {
    try {
      var r = calc(state, DATA);
      lastResult = r;
      var tomt = !(r.arlig_besparing > 0);

      var d = DATA.defaults[state.segment];
      setText("framing", d.framing);

      var heroEl = document.getElementById("heroNumber");
      if (tomt) {
        setText("heroLabel", "Ange dina värden för att se besparingen");
        heroEl.textContent = "—";
      } else {
        setText("heroLabel", state.segment === "privat" ? "Du sparar ca" : "Lägre driftskostnad ca");
        heroEl.innerHTML = kr(r.arlig_besparing) + '<span class="hero-unit">/år</span>';
      }

      setText("statKwh", kwh(r.kwh_ar) + "/år");
      setText("statPayback", ar(r.payback_ar));
      setText("stat10ar", kr(r.besparing_10ar));

      var co2Wrap = document.getElementById("co2Stat");
      if (r.visa_co2 && r.co2_kg_ar != null && !tomt) {
        co2Wrap.classList.remove("is-hidden");
        setText("statCo2", nf0.format(Math.round(r.co2_kg_ar)) + " kg/år");
      } else {
        co2Wrap.classList.add("is-hidden");
      }

      renderBreakdown(r);
      renderHonesty();
      renderContext();
      renderCta(r, tomt);
      renderShareQuote(r, tomt);
      syncUrl();
      trackBerakning(r);
    } catch (e) {
      renderError(e);
    }
  }

  function renderError(e) {
    setText("framing", "");
    setText("heroLabel", "Kunde inte räkna just nu");
    var heroEl = document.getElementById("heroNumber");
    if (heroEl) heroEl.textContent = "—";
    ["statKwh", "statPayback", "stat10ar"].forEach(function (id) { setText(id, "—"); });
    var co2 = document.getElementById("co2Stat"); if (co2) co2.classList.add("is-hidden");
    var sub = document.getElementById("ctaSub");
    if (sub) sub.textContent = "Något gick fel i beräkningen — testa att ladda om sidan eller justera dina värden.";
    var btn = document.getElementById("ctaBtn"); if (btn) btn.classList.add("is-hidden");
    track("calc_error", { typ_id: state.typ_id, segment: state.segment });
  }

  function renderBreakdown(r) {
    var b = r.breakdown;
    document.getElementById("formula").innerHTML =
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
      ["Elpris (totalpris)", pris(b.kr_kwh)],
      ["Energi: före → efter", kwh(b.kwh_gammal_total) + " → " + kwh(b.kwh_led_total) + "/år"],
      ["LED-kostnad" + (b.betalar_installation ? " (material + installation)" : " (material)"),
        kr(b.total_led_kostnad) + " (" + kr(b.per_enhet_kostnad) + "/st)"]
    ];
    var html = "";
    rows.forEach(function (row) { html += "<tr><td>" + row[0] + "</td><td>" + row[1] + "</td></tr>"; });
    document.getElementById("breakdownRows").innerHTML = html;
  }

  function renderHonesty() {
    document.getElementById("avdragCopy").textContent = DATA.avdrag_copy[state.segment] || "";
  }

  function renderContext() {
    var el = document.getElementById("lysrorContext");
    if (state.segment === "privat") { el.classList.add("is-hidden"); return; }
    var f = DATA.lysror_fakta;
    el.textContent = "Lysrör fasas ut sedan 2023 (EU Ecodesign/RoHS) — " + f.antal_armaturer +
      ". Befintliga rör får brinna tills de går sönder.";
    el.setAttribute("title", "Källa: " + f.kalla);
    el.classList.remove("is-hidden");
  }

  function renderCta(r, tomt) {
    var d = DATA.defaults[state.segment];
    var zone = document.getElementById("ctaZone");
    var btn = document.getElementById("ctaBtn");
    var form = document.getElementById("leadForm");
    var done = document.getElementById("leadDone");
    var title = document.getElementById("ctaTitle");
    var sub = document.getElementById("ctaSub");
    var assur = document.getElementById("ctaAssurance");
    var inService = isServiceZone(state.elprisomrade);

    // Tom/0-state: ingen pitch på en 0 kr-siffra
    if (tomt) {
      zone.classList.remove("outside");
      title.textContent = "Fyll i dina värden";
      sub.textContent = "Lägg till minst en armatur och brinntid så räknar vi.";
      assur.textContent = "";
      hide(btn); hide(form); hide(done);
      return;
    }

    if (!inService) {
      // Geo-doktrin: full siffra ges ändå; CTA → ärlig hänvisning
      zone.classList.add("outside");
      title.textContent = "Vi finns inte i ditt elprisområde än";
      sub.textContent = DATA.geo.utanfor_text;
      assur.textContent = "";
      hide(btn); hide(form); hide(done);
      return;
    }

    zone.classList.remove("outside");
    var paybackTxt = r.payback_ar != null ? ar(r.payback_ar) : "—";
    if (state.segment === "privat") {
      title.textContent = "Vill du ha hjälp att byta?";
      sub.textContent = "En behörig elektriker gör bytet — du behåller besparingen på ca " + kr(r.arlig_besparing) + "/år.";
    } else if (state.segment === "brf") {
      title.textContent = "Vill ni gå vidare?";
      sub.textContent = "Vi tar fram en offert till styrelsen med besparingen verifierad — ca " + kr(r.arlig_besparing) + "/år lägre driftskostnad.";
    } else {
      title.textContent = "Vill ni gå vidare?";
      sub.textContent = "Vi går igenom era armaturer på plats och bekräftar siffran — payback ca " + paybackTxt + " utan gissningar.";
    }
    btn.textContent = d.cta_text;
    assur.textContent = d.cta_assurance || "";

    // Visa knapp / formulär / bekräftelse beroende på flödesläge
    toggle(btn, !(state._leadOpen || state._leadDone));
    toggle(form, state._leadOpen && !state._leadDone);
    toggle(done, state._leadDone);
    toggle(assur, !state._leadOpen && !state._leadDone);
  }

  function renderShareQuote(r, tomt) {
    document.getElementById("shareQuote").textContent = tomt ? "" : "”" + shareText(r) + "”";
  }

  function shareText(r) {
    var p = r.payback_ar != null ? " (payback ca " + ar(r.payback_ar) + ")" : "";
    var base;
    if (state.segment === "brf")
      base = "Vår BRF kan sänka driftskostnaden ca " + kr(r.arlig_besparing) + "/år" + p + " genom att byta till LED.";
    else if (state.segment === "foretag")
      base = "Vårt företag sänker driftskostnaden ca " + kr(r.arlig_besparing) + "/år" + p + " med LED.";
    else
      base = "Jag sparar ca " + kr(r.arlig_besparing) + "/år" + p + " genom att byta till LED.";
    return base + " — uträknat i Ampys LED-kalkylator.";
  }

  // --- Dela-kort (byggt med textContent — ingen innerHTML/XSS-väg) ---------
  function buildShareCard(r) {
    var card = document.getElementById("shareCard");
    card.textContent = "";
    var seglabel = state.segment === "brf" ? "BRF" : (state.segment === "foretag" ? "Företag" : "Privat");
    card.appendChild(el("div", "sc-eyebrow", seglabel + " · LED-besparing"));
    card.appendChild(el("div", "sc-number", kr(r.arlig_besparing) + "/år"));
    if (r.payback_ar != null) card.appendChild(el("div", "sc-sub", "Payback ca " + ar(r.payback_ar) + " · " + kwh(r.kwh_ar) + "/år"));
    card.appendChild(el("div", "sc-brand", "Ampys LED-kalkylator"));
    card.classList.remove("is-hidden");
  }

  // --- Kontroller (dynamiska selects byggs om vid segmentbyte) -------------
  function buildControls() {
    document.querySelectorAll(".seg-toggle button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.seg === state.segment));
      b.onclick = function () {
        state.segment = b.dataset.seg;
        var d = DATA.defaults[state.segment];
        state.typ_id = d.typ_id; state.antal = d.antal;
        state._kontext = d.kontext;
        var brt = findBrinntid(d.kontext);
        state.timmar_dag = brt ? brt.timmar_dag : 9;
        state._leadOpen = false; state._leadDone = false; // återställ lead-flöde
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
      state._kontext = this.value;
      var brt = findBrinntid(this.value);
      if (brt) { state.timmar_dag = brt.timmar_dag; syncBrinntid(); }
      render();
    };

    // Antal — synka värde (handlers binds en gång i wireStatic)
    document.getElementById("inAntal").value = state.antal;

    // Elprisområde — berika option-text med pris + synka
    var elSel = document.getElementById("inElomrade");
    Array.prototype.forEach.call(elSel.options, function (o) {
      var base = o.textContent.split(" · ")[0];
      o.textContent = base + " · " + pris(zonpris(o.value));
    });
    elSel.value = state.elprisomrade;

    syncBrinntid();
    syncElpris();
  }

  // Statiska handlers (binds en gång — läser state/lastResult vid event) -----
  function wireStatic() {
    // Antal: tillåt tom redigering, clampa på change/stepper
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
      var cur = isNaN(state.antal) ? 0 : state.antal;
      state.antal = Math.max(0, cur - 1); antalIn.value = state.antal; render();
    };
    document.getElementById("antalPlus").onclick = function () {
      var cur = isNaN(state.antal) ? 0 : state.antal;
      state.antal = Math.min(DATA.limits.antal_max, cur + 1); antalIn.value = state.antal; render();
    };

    // Brinntid-slider
    document.getElementById("inBrinntid").oninput = function () {
      state.timmar_dag = parseFloat(this.value); syncBrinntid(); render();
    };

    // Elprisområde seedar priset; slider överrider
    document.getElementById("inElomrade").onchange = function () {
      state.elprisomrade = this.value;
      state.kr_kwh = zonpris(this.value); // område → förvalt pris
      syncElpris(); render();
    };
    document.getElementById("inElpris").oninput = function () {
      state.kr_kwh = parseFloat(this.value); syncElpris();
      track("elpris_justerad", { segment: state.segment });
      render();
    };

    // Breakdown öppnas → event
    document.getElementById("breakdown").addEventListener("toggle", function () {
      if (this.open) track("breakdown_open", { segment: state.segment });
    });

    // CTA → visa lead-formulär (ersätter knappen; en primär kvar)
    document.getElementById("ctaBtn").onclick = function () {
      state._leadOpen = true;
      toggleLeadFields();
      render();
      var f = document.getElementById("leadNamn"); if (f) f.focus();
      track("cta_klick", {
        segment: state.segment,
        besparing: bucket((lastResult || {}).arlig_besparing || 0),
        in_service: isServiceZone(state.elprisomrade)
      });
    };

    // Lead-submit
    document.getElementById("leadForm").onsubmit = function (e) {
      e.preventDefault();
      if (document.getElementById("leadHp").value) return;            // honeypot
      if (!document.getElementById("leadConsent").checked) return;    // GDPR krävs
      submitLead();
    };

    // Dela
    document.getElementById("shareBtn").onclick = function () {
      var r = lastResult; if (!r || !(r.arlig_besparing > 0)) return;
      buildShareCard(r);
      var url = location.href;
      var txt = shareText(r);
      if (navigator.share) navigator.share({ title: "LED-besparing", text: txt, url: url }).catch(function () {});
      else if (navigator.clipboard) { navigator.clipboard.writeText(txt + " " + url); flash(this, "Kopierat!"); }
      track("share", { segment: state.segment, besparing: bucket(r.arlig_besparing) });
    };
  }

  function toggleLeadFields() {
    var foretag = state.segment === "foretag" || state.segment === "brf";
    toggle(document.getElementById("leadForetagField"), foretag);
    toggle(document.getElementById("leadPostnrField"), state.segment === "privat");
  }

  function submitLead() {
    var r = lastResult || {};
    var val = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ""; };
    var payload = {
      segment: state.segment, typ_id: state.typ_id, antal: state.antal,
      timmar_dag: state.timmar_dag, kr_kwh: state.kr_kwh, elprisomrade: state.elprisomrade,
      arlig_besparing: Math.round(r.arlig_besparing || 0), payback_ar: r.payback_ar,
      namn: val("leadNamn"), epost: val("leadEpost"), telefon: val("leadTel"),
      foretag: val("leadForetag"), postnummer: val("leadPostnr")
    };
    track("lead_submit", { segment: state.segment, besparing: bucket(r.arlig_besparing || 0), payback: r.payback_ar });

    var endpoint = DATA.lead && DATA.lead.endpoint;
    if (endpoint) {
      fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        .then(finishLead, finishLead);
    } else {
      // Fallback: mailto med scenariot, så embeds utan backend ändå fångar leadet
      window.location.href = buildMailto(payload);
      finishLead();
    }
  }

  function buildMailto(p) {
    var rad = function (k, v) { return v ? (k + ": " + v + "\n") : ""; };
    var body =
      "Ny LED-förfrågan\n\n" +
      rad("Segment", p.segment) + rad("Namn", p.namn) + rad("Företag/förening", p.foretag) +
      rad("E-post", p.epost) + rad("Telefon", p.telefon) + rad("Postnummer", p.postnummer) +
      "\nScenario (användarens egen uträkning):\n" +
      rad("Årlig besparing", nf0.format(p.arlig_besparing) + " kr/år") +
      rad("Payback", p.payback_ar != null ? nf1.format(p.payback_ar) + " år" : "—") +
      rad("Ljuskälla", p.typ_id) + rad("Antal", p.antal) +
      rad("Brinntid", p.timmar_dag + " h/dag") + rad("Elpris", nf2.format(p.kr_kwh) + " kr/kWh") +
      rad("Elprisområde", p.elprisomrade);
    return "mailto:" + (DATA.lead.fallback_mailto || "") +
      "?subject=" + encodeURIComponent("LED-förfrågan — " + p.segment + " — " + nf0.format(p.arlig_besparing) + " kr/år") +
      "&body=" + encodeURIComponent(body);
  }

  function finishLead() {
    state._leadDone = true; state._leadOpen = false;
    var done = document.getElementById("leadDone");
    done.textContent = state.segment === "privat"
      ? "Tack — vi matchar dig med en behörig elektriker."
      : "Tack — vi hör av oss inom 1 arbetsdag med en genomgång.";
    render();
  }

  // --- Synk slider-värden + a11y ------------------------------------------
  function syncBrinntid() {
    var s = document.getElementById("inBrinntid");
    s.value = state.timmar_dag;
    s.setAttribute("aria-valuetext", nf1.format(state.timmar_dag) + " timmar per dag");
    document.getElementById("brinntidVal").textContent = nf1.format(state.timmar_dag) + " h/dag";
  }
  function syncElpris() {
    var s = document.getElementById("inElpris");
    s.min = DATA.elpris.min; s.max = DATA.elpris.max;
    s.value = state.kr_kwh;
    s.setAttribute("aria-valuetext", nf2.format(state.kr_kwh) + " kronor per kilowattimme");
    document.getElementById("elprisVal").textContent = pris(state.kr_kwh);
  }

  // --- URL-synk (dela-länk bär scenariot) ---------------------------------
  function syncUrl() {
    try {
      var h = "#s=" + state.segment + "&t=" + state.typ_id + "&n=" + state.antal +
        "&h=" + state.timmar_dag + "&z=" + state.elprisomrade + "&pris=" + state.kr_kwh;
      history.replaceState(null, "", location.pathname + location.search + h);
    } catch (e) {}
  }

  // --- Telemetri ----------------------------------------------------------
  function captureMeta() {
    try {
      var stored = sessionStorage.getItem("ampy_led_meta");
      if (stored) { meta = JSON.parse(stored); return; }
    } catch (e) {}
    try {
      var q = new URLSearchParams(location.search);
      var root = document.querySelector(".ampy-led");
      meta = {
        utm_source: q.get("utm_source") || "", utm_medium: q.get("utm_medium") || "",
        utm_campaign: q.get("utm_campaign") || "", utm_content: q.get("utm_content") || "",
        embed_sida: (root && root.getAttribute("data-sida")) || "", referrer: document.referrer || "",
        sid: "s" + Math.abs((Date.now ? Date.now() : 0)).toString(36) + Math.floor(performance.now())
      };
      sessionStorage.setItem("ampy_led_meta", JSON.stringify(meta));
    } catch (e) { meta = {}; }
  }
  function bucket(n) {
    n = Math.round(n) || 0;
    if (n < 10000) return "<10k";
    if (n < 50000) return "10-50k";
    if (n < 150000) return "50-150k";
    return "150k+";
  }
  function trackBerakning(r) {
    if (berakningTimer) clearTimeout(berakningTimer);
    berakningTimer = setTimeout(function () {
      track("berakning", { segment: state.segment, besparing_spann: bucket(r.arlig_besparing), payback_ar: r.payback_ar != null ? Math.round(r.payback_ar) : null });
    }, 600);
  }
  function track(name, props) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: "led_" + name }, meta, props || {}));
    } catch (e) {}
  }

  // --- Små hjälpare -------------------------------------------------------
  function setText(id, t) { var el = document.getElementById(id); if (el) el.textContent = t; }
  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function hide(node) { if (node) node.classList.add("is-hidden"); }
  function toggle(node, on) { if (node) node.classList.toggle("is-hidden", !on); }
  function flash(node, msg) { var o = node.textContent; node.textContent = msg; setTimeout(function () { node.textContent = o; }, 1500); }

  // --- Init: instant value vid laddning -----------------------------------
  function init() {
    captureMeta();
    applyPreset();
    hydrateFromHash();
    wireStatic();
    buildControls();
    render();
    track("calc_view", { segment: state.segment, elprisomrade: state.elprisomrade });
  }
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
