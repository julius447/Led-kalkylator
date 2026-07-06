/* ==========================================================================
   AMPY LED-KALKYLATOR — SNIPPET 2 av 3: JAVASCRIPT
   Klistra in som en Fluent Snippets-snippet av typ 'JS' (laddas i sidfoten).
   Innehåller data.js + engine.js + app.js sammanfogade i EXAKT denna ordning.
   Genererad av build-snippets.js — REDIGERA INTE här; ändra källfilerna.

   ENDA sak att ev. ändra för skarp drift: sök 'endpoint: null' nedan och
   sätt den till din REST-URL (se snippet 3) om du vill fånga leads server-
   side i stället för mailto. Lämna null = mejlklient-fallback (inget lead tappas).
   ========================================================================== */


/* ==========================================================================
   DEL 1/3 — DATALAGER (data.js)
   ========================================================================== */
/* =============================================================================
   LED-kalkylatorn — DATALAGER (Lager 3) — vol.3
   -----------------------------------------------------------------------------
   ALL affärsdata bor här. Motorn (engine.js) har noll hårdkodade tal.
   Värden från Agent 1:s research-dossier (vol.1) + vol.3-research (2026-06-06):
   utökad ljuskällelista, korrigerade brinntider, antal-defaults. Konservativ
   riktning (mindre besparing, längre verklighet) — ärlighet = moat.
   Versionerat schema: motorn vägrar okänd struktur.
   ============================================================================= */
window.AMPY_LED_DATA = {
  schema_version: "1.0.0",
  _status: "Research-signerad (vol.1 + vol.3 2026-06-06). Kräver sakkunnig-signatur före lansering.",

  /* --- Elpris: TOTALPRIS kr/kWh inkl. moms per elprisområde (enda priskällan) */
  elpris: {
    SE1: 1.35, SE2: 1.40, SE3: 1.65, SE4: 1.85,
    nationellt_default: 1.50,
    enhet: "kr/kWh inkl. moms",
    datum: "2026 (verifierad 2026-06-06)",
    kalla: "Skatteverket; Nord Pool/elpriser24.se; Ellevio",
    not: "Medvetet lågt schablonpris per område — verklig besparing blir snarare högre."
  },

  /* --- Segment-konfiguration (affärsregler i data, ej i motorn) --------------
     OBS: visa_co2 styr om CO₂ visas (Företag/BRF) eller byts mot kr/månad (Privat).
     betalar_installation LÄSES INTE av motorn — installation ingår alltid i
     kostnad_kr i watt_tabell. Bygg ingen prislogik på flaggan; den är historisk. */
  segments: {
    brf:     { betalar_installation: true,  visa_co2: true },
    foretag: { betalar_installation: true,  visa_co2: true },
    privat:  { betalar_installation: false, visa_co2: false }
  },

  limits: { antal_max: 100000 },

  /* Horisont för kumulativ besparing + payback-kurva */
  horisont_ar: 10,

  /* CTA pekar mot offert-/hjälp-flöde på destinationssidan (värde först, ingen vägg) */
  cta: { url: null }, // sätts vid Bricks-transplant; null = spåra klick (prototyp)
  // Offertförfrågan: sätt endpoint till en riktig POST-URL före produktion.
  // Tills dess används mailto-fallback så inget lead tappas.
  lead: { endpoint: null, fallback_mailto: "offert@ampy.se" },

  /* --- Prissättning (offert) — kostnad_kr = total per armatur INKL installation ---
     Bekräftat av Ampys bokare/elektriker:
     Företag/BRF (lysrör): 1000–2000 kr/armatur inkl. installation, EX moms.
     Privat (mest halogenspot → LED-spot): 500–1000 kr/armatur inkl. installation,
       INKL moms, efter ROT. Privat installeras alltid av Ampy (ingen DIY).
     High-bay/utomhus ligger över lysrör-spannet (dyrare armaturer). */
  prissattning: { moms_not: "Företag/BRF ex moms · Privat inkl moms efter ROT" },

  /* --- Ljuskällor ("vad byter du från?") — kat styr segment, grupp = optgroup --- */
  watt_tabell: [
    // Privat — glödljus (LED-lampa E27)
    { id: "glod_40",  namn: "Glödlampa 40 W (E27/E14)", kat: "privat", grupp: "Glödljus", w_gammal: 40,  w_led: 5,  lumen: "~470 lm",  kostnad_kr: 550 },
    { id: "glod_60",  namn: "Glödlampa 60 W (E27)",     kat: "privat", grupp: "Glödljus", w_gammal: 60,  w_led: 9,  lumen: "~800 lm",  kostnad_kr: 550 },
    { id: "glod_75",  namn: "Glödlampa 75 W (E27)",     kat: "privat", grupp: "Glödljus", w_gammal: 75,  w_led: 12, lumen: "~1100 lm", kostnad_kr: 600 },
    { id: "glod_100", namn: "Glödlampa 100 W (E27)",    kat: "privat", grupp: "Glödljus", w_gammal: 100, w_led: 16, lumen: "~1500 lm", kostnad_kr: 650 },
    // Privat — halogen (kärnfall: halogenspot → LED-spot)
    { id: "gu10_35",      namn: "Halogenspot GU10 35 W",        kat: "privat", grupp: "Halogen", w_gammal: 35,  w_led: 4,  lumen: "~230–300 lm", kostnad_kr: 650 },
    { id: "gu10_50",      namn: "Halogenspot GU10 50 W",        kat: "privat", grupp: "Halogen", w_gammal: 50,  w_led: 6,  lumen: "~380–450 lm", kostnad_kr: 700 },
    { id: "halo_r7s_150", namn: "Halogen linjär R7s 150 W",     kat: "privat", grupp: "Halogen", w_gammal: 150, w_led: 18, lumen: "~2200 lm",    kostnad_kr: 850 },
    { id: "halo_r7s_300", namn: "Halogen linjär R7s 300 W",     kat: "privat", grupp: "Halogen", w_gammal: 300, w_led: 35, lumen: "~3200 lm",    kostnad_kr: 950 },
    // Privat — lågenergi/LED
    { id: "cfl_15",          namn: "Lågenergilampa (CFL) 15 W",      kat: "privat", grupp: "Lågenergi / LED", w_gammal: 15, w_led: 9,  lumen: "~800 lm",  kostnad_kr: 550 },
    { id: "cfl_23",          namn: "Lågenergilampa (CFL) 23 W",      kat: "privat", grupp: "Lågenergi / LED", w_gammal: 23, w_led: 14, lumen: "~1500 lm", kostnad_kr: 650 },
    { id: "led_spot_gammal", namn: "Äldre LED-spot (1:a gen, GU10)", kat: "privat", grupp: "Lågenergi / LED", w_gammal: 7,  w_led: 5,  lumen: "~350 lm",  kostnad_kr: 700 },
    // Kommersiell — lysrör (komplett LED-armatur, 1000–2000 kr ex moms)
    { id: "t8_1x18", namn: "Lysrörsarmatur 1×18 W T8 (60 cm)",  kat: "kommersiell", grupp: "Lysrör", w_gammal: 28,  w_led: 10, lumen: "~1000–1300 lm", kostnad_kr: 1000 },
    { id: "t8_2x18", namn: "Lysrörsarmatur 2×18 W T8 (60 cm)",  kat: "kommersiell", grupp: "Lysrör", w_gammal: 56,  w_led: 20, lumen: "~2000–2600 lm", kostnad_kr: 1200 },
    { id: "t8_1x36", namn: "Lysrörsarmatur 1×36 W T8 (120 cm)", kat: "kommersiell", grupp: "Lysrör", w_gammal: 41,  w_led: 18, lumen: "~1800–2200 lm", kostnad_kr: 1200 },
    { id: "t8_2x36", namn: "Lysrörsarmatur 2×36 W T8 (120 cm)", kat: "kommersiell", grupp: "Lysrör", w_gammal: 82,  w_led: 34, lumen: "~3600–4400 lm", kostnad_kr: 1500 },
    { id: "t8_1x58", namn: "Lysrörsarmatur 1×58 W T8 (150 cm)", kat: "kommersiell", grupp: "Lysrör", w_gammal: 65,  w_led: 25, lumen: "~2600–3300 lm", kostnad_kr: 1400 },
    { id: "t8_2x58", namn: "Lysrörsarmatur 2×58 W T8 (150 cm)", kat: "kommersiell", grupp: "Lysrör", w_gammal: 130, w_led: 48, lumen: "~5200–6600 lm", kostnad_kr: 1900 },
    { id: "t5_28",   namn: "Lysrörsarmatur T5 28 W (120 cm)",   kat: "kommersiell", grupp: "Lysrör", w_gammal: 32,  w_led: 16, lumen: "~2600 lm",      kostnad_kr: 1300 },
    { id: "pl_18",   namn: "Kompaktlysrör PL 18 W",             kat: "kommersiell", grupp: "Lysrör", w_gammal: 21,  w_led: 10, lumen: "~1200 lm",      kostnad_kr: 1000 },
    { id: "pl_26",   namn: "Kompaktlysrör PL 26 W",             kat: "kommersiell", grupp: "Lysrör", w_gammal: 29,  w_led: 12, lumen: "~1800 lm",      kostnad_kr: 1000 },
    // Kommersiell — LED (äldre)
    { id: "led_panel_gammal", namn: "Äldre LED-panel (1:a gen, ~45 W)", kat: "kommersiell", grupp: "LED", w_gammal: 45, w_led: 32, lumen: "~3600 lm", kostnad_kr: 1500 },
    // Kommersiell — utomhus/högtak (dyrare armaturer, över lysrör-spannet)
    { id: "mh_250_highbay", namn: "Metallhalogen high-bay 250 W", kat: "kommersiell", grupp: "Utomhus / högtak", w_gammal: 280, w_led: 100, lumen: "—", kostnad_kr: 2800 },
    { id: "mh_400_highbay", namn: "Metallhalogen high-bay 400 W", kat: "kommersiell", grupp: "Utomhus / högtak", w_gammal: 455, w_led: 150, lumen: "—", kostnad_kr: 3500 },
    { id: "hps_150", namn: "Högtrycksnatrium 150 W (utomhus)",    kat: "kommersiell", grupp: "Utomhus / högtak", w_gammal: 170, w_led: 60,  lumen: "—", kostnad_kr: 2400 },
    { id: "hps_250", namn: "Högtrycksnatrium 250 W (utomhus)",    kat: "kommersiell", grupp: "Utomhus / högtak", w_gammal: 280, w_led: 95,  lumen: "—", kostnad_kr: 2900 },
    { id: "merc_125", namn: "Kvicksilverlampa 125 W (äldre)",     kat: "kommersiell", grupp: "Utomhus / högtak", w_gammal: 137, w_led: 50,  lumen: "—", kostnad_kr: 2300 },
    { id: "merc_250", namn: "Kvicksilverlampa 250 W (äldre)",     kat: "kommersiell", grupp: "Utomhus / högtak", w_gammal: 272, w_led: 90,  lumen: "—", kostnad_kr: 2800 }
  ],

  /* --- Brinntid per kontext (timmar/dygn, 365-dagars genomsnitt) -------------
     "Snitt brinntid" = default per segment: ett genomsnitt över alla armaturer
     i olika utrymmen (då ett byte oftast omfattar flera områden). */
  brinntid_default: [
    // BRF
    { kontext: "Snitt brinntid",                    segment: "brf",     timmar_dag: 12 },
    { kontext: "Trapphus utan styrning",            segment: "brf",     timmar_dag: 24 },
    { kontext: "Trapphus med sensor",               segment: "brf",     timmar_dag: 4 },
    { kontext: "Garage / förråd — utan styrning",   segment: "brf",     timmar_dag: 24 },
    { kontext: "Tvättstuga / gemensamt",            segment: "brf",     timmar_dag: 6 },
    // Företag
    { kontext: "Snitt brinntid",                    segment: "foretag", timmar_dag: 9 },
    { kontext: "Kontor",                            segment: "foretag", timmar_dag: 9 },
    { kontext: "Butik",                             segment: "foretag", timmar_dag: 12 },
    { kontext: "Lager",                             segment: "foretag", timmar_dag: 14 },
    { kontext: "Verkstad / industri (2-skift)",     segment: "foretag", timmar_dag: 16 },
    // Privat
    { kontext: "Snitt brinntid",                    segment: "privat",  timmar_dag: 5 },
    { kontext: "Hem / vardagsrum (primär armatur)", segment: "privat",  timmar_dag: 5 },
    { kontext: "Hem / hela bostaden (per lampa)",   segment: "privat",  timmar_dag: 6 }
  ],

  /* --- CO2-faktor (ENDAST Företag/BRF, aldrig Privat) ------------------------ */
  co2_faktor: {
    g_per_kwh: 464.79,
    metod: "Nordisk residualmix tillämpad i Sverige, marknadsbaserad (Scope 2), rapportår 2024. Endast Företag/BRF ESG.",
    kalla: "Energimarknadsinspektionen (Ei), publ. 2025-06-12, beräknad av Grexel",
    datum: "Rapportår 2024 (verifierad 2026-06-06)."
  },

  /* --- Avdragsklausul per segment (försiktigt, inga falska avdrag) ----------- */
  avdrag_copy: {
    foretag: "Priser är ex moms och inkl. installation. Exakt pris får du i offerten.",
    brf:     "Priser är ex moms och inkl. installation. Exakt pris får du i offerten.",
    privat:  "Priser är inkl. moms och installation, efter ROT-avdrag (30 % på arbetet). Exakt pris får du i offerten."
  },

  /* --- Lysrörskrok (endast Företag/BRF) -------------------------------------- */
  lysror_fakta: {
    text: "Visste du? Nya lysrör säljs inte längre — EU förbjöd försäljning av T8- och T5-lysrör 2023. Att byta nu är ofta billigare än att vänta.",
    kalla: "EU Ecodesign/RoHS 2023; Belysningsbranschen (verifierad 2026-06-06)"
  },

  /* --- Segment-defaults ------------------------------------------------------ */
  defaults: {
    brf: {
      antal: 80, typ_id: "t8_2x36", kontext: "Snitt brinntid",
      antal_slider: { min: 1, max: 400, ticks: [40, 80, 160, 280, 400] },
      seg_caption: "Vi räknar för föreningens gemensamma belysning.",
      enhet_namn: "armaturer", cta_text: "Få en skräddarsydd offert"
    },
    foretag: {
      antal: 30, typ_id: "t8_2x36", kontext: "Snitt brinntid",
      antal_slider: { min: 1, max: 200, ticks: [10, 30, 75, 125, 200] },
      seg_caption: "Vi räknar för verksamhetens belysning.",
      enhet_namn: "armaturer", cta_text: "Få en skräddarsydd offert"
    },
    privat: {
      antal: 15, typ_id: "gu10_50", kontext: "Snitt brinntid",
      antal_slider: { min: 1, max: 60, ticks: [5, 15, 30, 45, 60] },
      seg_caption: "Vi räknar för belysningen i ditt hem — Ampy installerar.",
      enhet_namn: "ljuskällor", cta_text: "Få en skräddarsydd offert"
    }
  },

  /* --- Embed-preset per belysningssida (sida → förvalt läge) ----------------- */
  embed_preset: {
    "belysning":        { segment: "brf",     typ_id: "t8_2x36",  kontext: "Snitt brinntid" },
    "inomhusbelysning": { segment: "foretag", typ_id: "t8_2x36",  kontext: "Kontor" },
    "utomhusbelysning": { segment: "brf",     typ_id: "hps_150",  kontext: "Garage / förråd — utan styrning" },
    "spotlight":        { segment: "privat",  typ_id: "gu10_50",  kontext: "Snitt brinntid" },
    "armaturer":        { segment: "foretag", typ_id: "t8_2x36",  kontext: "Lager" }
  },

  /* --- Geo: region → serviceflagga (datadriven, ej hårdkodat) ---------------- */
  geo: {
    default_servicezon: true,
    regioner: { "SE1": true, "SE2": true, "SE3": true, "SE4": true }
  }
};


/* ==========================================================================
   DEL 2/3 — MOTOR (engine.js)
   ========================================================================== */
/* =============================================================================
   LED-kalkylatorn — MOTOR (Lager 4): ren funktion över datalagret
   -----------------------------------------------------------------------------
   calculate(inputs, data) → resultat i FULL precision. Ingen avrundning här
   (sker bara i renderaren). Inga hårdkodade affärstal — allt slås upp i `data`.
   Formel (Del 4):
     årlig_besparing = (W_gammal − W_LED)/1000 × h_dag × 365 × kr_kWh × antal
     payback_år      = total_LED_kostnad ÷ årlig_besparing
   ============================================================================= */
(function (global) {
  "use strict";

  var DAGAR = 365;
  var _validated = false; // dubbel valideringsgrind körs en gång, cachas

  function lookup(list, key, val) {
    if (!Array.isArray(list)) return null;
    for (var i = 0; i < list.length; i++) if (list[i][key] === val) return list[i];
    return null;
  }

  /* Dubbel valideringsgrind (Del 3): grind 1 = schema, grind 2 = struktur.
     Gör att en innehållsredaktör som råkar skriva fel i data.js får ett tydligt
     fel istället för en tyst NaN-hjälte-siffra. Körs en gång och cachas. */
  function validateData(data) {
    if (_validated) return;
    if (!data || data.schema_version !== "1.0.0") {
      throw new Error("Dataschema underkänt: okänd eller saknad schema_version.");
    }
    if (!Array.isArray(data.watt_tabell) || !data.watt_tabell.length) {
      throw new Error("Dataschema underkänt: watt_tabell saknas eller är tom.");
    }
    data.watt_tabell.forEach(function (row) {
      if (typeof row.w_gammal !== "number" || typeof row.w_led !== "number") {
        throw new Error("Dataschema underkänt: w_gammal/w_led ej numeriskt för " + row.id);
      }
      if (row.w_led > row.w_gammal) {
        throw new Error("Dataschema underkänt: w_led > w_gammal för " + row.id);
      }
      if (typeof row.kostnad_kr !== "number") {
        throw new Error("Dataschema underkänt: kostnad_kr saknas för " + row.id);
      }
    });
    ["SE1", "SE2", "SE3", "SE4", "nationellt_default"].forEach(function (k) {
      if (typeof data.elpris[k] !== "number") {
        throw new Error("Dataschema underkänt: elpris." + k + " ej numeriskt.");
      }
    });
    if (typeof data.co2_faktor.g_per_kwh !== "number") {
      throw new Error("Dataschema underkänt: co2_faktor.g_per_kwh ej numeriskt.");
    }
    Object.keys(data.defaults).forEach(function (seg) {
      var d = data.defaults[seg];
      if (!lookup(data.watt_tabell, "id", d.typ_id)) {
        throw new Error("Dataschema underkänt: defaults." + seg + ".typ_id '" + d.typ_id + "' okänd.");
      }
      if (!lookup(data.brinntid_default, "kontext", d.kontext)) {
        throw new Error("Dataschema underkänt: defaults." + seg + ".kontext okänd.");
      }
      if (!data.segments || !data.segments[seg]) {
        throw new Error("Dataschema underkänt: segments." + seg + " saknas.");
      }
    });
    _validated = true;
  }

  /**
   * @param {Object} inputs { segment, typ_id, antal, timmar_dag, elprisomrade, kr_kwh? }
   * @param {Object} data    window.AMPY_LED_DATA
   * @returns {Object} resultat med full precision + spårbara mellanled
   */
  function calculate(inputs, data) {
    validateData(data);

    var typ = lookup(data.watt_tabell, "id", inputs.typ_id);
    if (!typ) throw new Error("Okänd ljuskälla: " + inputs.typ_id);

    var antal = Math.max(0, Number(inputs.antal) || 0);
    var hDag = Math.max(0, Number(inputs.timmar_dag) || 0);

    // Elpris: användarens egen override (>0) vinner; annars valt område; annars nationellt.
    var krKwh = (typeof inputs.kr_kwh === "number" && inputs.kr_kwh > 0)
      ? inputs.kr_kwh
      : (typeof data.elpris[inputs.elprisomrade] === "number"
          ? data.elpris[inputs.elprisomrade]
          : data.elpris.nationellt_default);

    // --- Energi ---
    var wSparad = Math.max(0, typ.w_gammal - typ.w_led);          // W per enhet
    var kwhPerEnhetAr = (wSparad / 1000) * hDag * DAGAR;          // kWh/år per enhet
    var kwhArTotal = kwhPerEnhetAr * antal;                       // kWh/år totalt

    var kwhGammalTotal = (typ.w_gammal / 1000) * hDag * DAGAR * antal;
    var kwhLedTotal = (typ.w_led / 1000) * hDag * DAGAR * antal;

    // --- Kronor ---
    var arligBesparing = kwhArTotal * krKwh;                      // kr/år
    var besparing10ar = arligBesparing * 10;

    // --- Offertpris: total kostnad per armatur (inkl. installation) ---
    var segConf = data.segments[inputs.segment] || {};
    var perEnhetKostnad = typ.kostnad_kr;
    var totalLedKostnad = perEnhetKostnad * antal;
    var paybackAr = arligBesparing > 0 ? (totalLedKostnad / arligBesparing) : null;

    // --- CO2 (endast segment med visa_co2 = Företag/BRF) ---
    var visaCo2 = !!segConf.visa_co2;
    var co2KgAr = visaCo2 ? (kwhArTotal * data.co2_faktor.g_per_kwh) / 1000 : null;

    // --- Kumulativ kassaflödeskurva (år 0..H): besparing × år − kostnad ---
    var HORISONT = (data.horisont_ar && data.horisont_ar > 0) ? data.horisont_ar : 15;
    var cumulative = [];
    for (var y = 0; y <= HORISONT; y++) cumulative.push(arligBesparing * y - totalLedKostnad);
    var nettoHorisont = cumulative[HORISONT];

    return {
      inputs: { segment: inputs.segment, typ_id: typ.id, antal: antal, timmar_dag: hDag, elprisomrade: inputs.elprisomrade, kr_kwh: krKwh },
      // Hjälte + stödtrio (full precision; renderaren avrundar)
      arlig_besparing: arligBesparing,
      kwh_ar: kwhArTotal,
      payback_ar: paybackAr,
      besparing_10ar: besparing10ar,
      co2_kg_ar: co2KgAr,
      visa_co2: visaCo2,
      horisont_ar: HORISONT,
      cumulative: cumulative,            // [år0..H] netto kr (för payback-kurvan)
      netto_horisont: nettoHorisont,     // netto kr vid horisonten (hjälte-siffra)
      // Spårbara mellanled för transparent breakdown ("Så har vi räknat")
      breakdown: {
        w_gammal: typ.w_gammal,
        w_led: typ.w_led,
        w_sparad: wSparad,
        timmar_dag: hDag,
        dagar: DAGAR,
        antal: antal,
        kr_kwh: krKwh,
        kwh_per_enhet_ar: kwhPerEnhetAr,
        kwh_gammal_total: kwhGammalTotal,
        kwh_led_total: kwhLedTotal,
        per_enhet_kostnad: perEnhetKostnad,
        total_led_kostnad: totalLedKostnad
      }
    };
  }

  global.AmpyLED = { calculate: calculate, validateData: validateData };
})(window);


/* ==========================================================================
   DEL 3/3 — RENDERARE (app.js)
   ========================================================================== */
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
  // Scopa ID-uppslag till widgeten → krockar inte med andra element/ID på en Bricks-sida
  var ROOT = null;
  function $(id) {
    if (ROOT) return ROOT.id === id ? ROOT : ROOT.querySelector('[id="' + id + '"]');
    return document.getElementById(id);
  }
  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function setText(id, t) { var n = $(id); if (n) n.textContent = t; }
  function $all(sel) { return (ROOT || document).querySelectorAll(sel); } // scopat → inga krockar med andra widgets
  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
  var endActiveDrag = null; // sätts under pågående slider-drag (för global avbrott)

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
    // Lita inte blint på preset: typ_id måste tillhöra segmentets kategori och
    // kontext måste finnas för segmentet — annars faller vi tillbaka på defaults
    // (en felaktig data-sida ska aldrig desynca UI och matematik tyst).
    var kat = seg === "privat" ? "privat" : "kommersiell";
    var pt = preset && lookup(DATA.watt_tabell, "id", preset.typ_id);
    state.typ_id = (pt && pt.kat === kat) ? preset.typ_id : d.typ_id;
    state.antal = d.antal;
    var ctxOk = preset && DATA.brinntid_default.some(function (b) { return b.kontext === preset.kontext && b.segment === seg; });
    state._kontext = ctxOk ? preset.kontext : d.kontext;
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
    if (o.ariaLabel) slider.setAttribute("aria-label", o.ariaLabel);
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
    // Mät thumben varje gång → finger-till-värde matchar exakt det som ritas,
    // även om host-sidan saknar 62.5%-basen eller ändrar root font-size (iOS Större text).
    function pickByX(cx) {
      var r = slider.getBoundingClientRect();
      var THUMB = thumb.getBoundingClientRect().width || 24, GUT = THUMB / 2;
      var usable = Math.max(1, r.width - THUMB);
      var frac = clamp((cx - r.left - GUT) / usable, 0, 1);
      return o.min + frac * (o.max - o.min);
    }
    var drag = false;
    function endDrag() {
      if (!drag) return; drag = false; dragging = false; endActiveDrag = null;
      // Ta bort skyddsnätet på window igen (läggs bara till under aktivt drag → ingen läcka)
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      slider.classList.remove("is-dragging"); scheduleRender();
    }
    slider.addEventListener("pointerdown", function (e) {
      drag = true; dragging = true; endActiveDrag = endDrag; slider.classList.add("is-dragging");
      try { slider.setPointerCapture(e.pointerId); } catch (x) {}
      // Skyddsnät: om setPointerCapture misslyckas och fingret släpps UTANFÖR reglaget
      // fångar vi släppet på window så draget aldrig fastnar. Tas bort i endDrag.
      window.addEventListener("pointerup", endDrag);
      window.addEventListener("pointercancel", endDrag);
      setVal(pickByX(e.clientX), true); e.preventDefault();
    });
    slider.addEventListener("blur", endDrag);
    slider.addEventListener("pointermove", function (e) { if (drag) setVal(pickByX(e.clientX), true); });
    slider.addEventListener("pointerup", endDrag);
    slider.addEventListener("pointercancel", endDrag);
    slider.addEventListener("lostpointercapture", endDrag);
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
        opt.setAttribute("aria-selected", t.id === state.typ_id ? "true" : "false");
        if (t.id === state.typ_id) opt.classList.add("ampy-calc__selector-option--selected");
        opt.onclick = function () { state.typ_id = t.id; closeSel(true); updateTypButton(); render(); };
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
  function openSel(open) {
    $("typSelector").setAttribute("aria-expanded", String(open));
    $("typButton").setAttribute("aria-expanded", String(open));
  }
  function closeSel(returnFocus) {
    var wasInside = $("typList").contains(document.activeElement);
    openSel(false);
    if ((returnFocus || wasInside) && $("typButton")) $("typButton").focus();
  }

  // --- controls -----------------------------------------------------------
  function buildControls() {
    var d = DATA.defaults[state.segment], plural = d.enhet_namn;

    // segment + region segmented (pressed states)
    $all('[id="segSegment"] button').forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.seg === state.segment)); });
    $all('[id="segRegion"] button').forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.region === state.elprisomrade)); });

    $("segCaption").textContent = d.seg_caption;
    $("antalLabel").firstChild.nodeValue = "Antal " + plural + " ";
    $("antalUnit").textContent = "st";
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
      ariaLabel: "Antal " + plural,
      format: function (v) { return fmtInt(v); },
      aria: function (v) { return v + " " + plural; },
      onInput: function (v) { state.antal = v; $("antalValue").textContent = fmtInt(v); scheduleRender(); }
    });

    // brinntid slider
    brinntidSlider = buildSlider("brinntidSlider", {
      min: 0, max: 24, value: state.timmar_dag, step: 0.5, ticks: [0, 6, 12, 18, 24],
      ariaLabel: "Brinntid, timmar per dygn",
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
    setText("heroSub", "Kunde inte räkna just nu — testa att ladda om eller justera dina värden.");
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
      statBSub.textContent = "jämfört med nordisk elmix";
    } else {
      statBLabel.textContent = "Per månad";
      statB.textContent = fmtKr(r.arlig_besparing / 12);
      statBUnit.textContent = "kr/mån";
      statBSub.textContent = "lägre elkostnad";
    }

    animateNumber("cost", b.total_led_kostnad, fmtKr, "statCost");
    $("statCostSub").textContent = "≈ " + fmtKr(b.per_enhet_kostnad) + " kr/" + (privat ? "ljuskälla" : "armatur") + " · inkl installation";
  }

  // Före/efter — elkostnad per år (ersätter payback-kurvan)
  function renderCompare(r) {
    var b = r.breakdown, kr = b.kr_kwh;
    var costNow = b.kwh_gammal_total * kr, costLed = b.kwh_led_total * kr;
    $("costNow").textContent = fmtKr(costNow) + " kr";
    $("costLed").textContent = fmtKr(costLed) + " kr";
    var max = costNow > 0 ? costNow : 1;
    $("barNow").style.width = "100%";
    $("barLed").style.width = Math.max(4, costLed / max * 100) + "%"; // syns även när besparingen är störst
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
    if (!privat) items.push(["CO₂ du sparar", "sparad kWh/år × 464,79 g ÷ 1000 → kg", "Faktorn 464,79 g/kWh är nordisk residualmix (marknadsbaserad, Scope 2 / ESG; Energimarknadsinspektionen 2024). Visas aldrig för privatpersoner som fysiska utsläpp."]);
    items.push(["Uppskattad kostnad", "pris per " + unit + " × antal", "Material och installation ingår i priset."]);
    items.forEach(function (it) {
      var box = el("div", "ampy-calc__methodology-item");
      box.appendChild(el("h3", null, it[0])); box.appendChild(el("code", null, it[1])); box.appendChild(el("p", null, it[2]));
      stack.appendChild(box);
    });
    var disc = $("disclaimers"); disc.textContent = "";
    disc.appendChild(el("p", null, DATA.avdrag_copy[state.segment] || ""));
    disc.appendChild(el("p", null, "Elpris: medvetet lågt schablonpris per elprisområde (SE1–SE4). Watt-, kostnads- och timantaganden är konservativt valda. Källor: research-dossier (2026)."));
  }

  // --- statiska handlers --------------------------------------------------
  function wireStatic() {
    $all('[id="segSegment"] button').forEach(function (btn) {
      btn.onclick = function () {
        if (btn.dataset.seg === state.segment) return;
        state.segment = btn.dataset.seg; setSegmentDefaults();
        track("segment_byte", { segment: state.segment });
        resetLead(); buildControls(); render();
      };
    });
    $all('[id="segRegion"] button').forEach(function (btn) {
      btn.onclick = function () {
        state.elprisomrade = btn.dataset.region;
        $all('[id="segRegion"] button').forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        render();
      };
    });
    $("inKontext").onchange = function () {
      state._kontext = this.value; var b = findBrinntid(this.value);
      if (b) { state.timmar_dag = b.timmar_dag; if (brinntidSlider) brinntidSlider.set(b.timmar_dag); }
      render();
    };
    // selector open/close
    $("typButton").setAttribute("aria-controls", "typList");
    $("typButton").setAttribute("aria-expanded", "false");
    $("typButton").onclick = function (e) { e.stopPropagation(); openSel($("typSelector").getAttribute("aria-expanded") !== "true"); };
    document.addEventListener("click", function (e) { if (!$("typSelector").contains(e.target)) closeSel(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && $("typSelector").getAttribute("aria-expanded") === "true") closeSel(true); });
    // CTA → fäll ut lead-formuläret (ersätter knappen; en primär kvar)
    $("ctaBtn").onclick = function () {
      track("cta_klick", { segment: state.segment, besparing: bucket((lastResult || {}).arlig_besparing || 0) });
      $("ctaBtn").classList.add("is-hidden");
      $("leadForm").classList.remove("is-hidden");
      var f = $("leadNamn"); if (f) f.focus({ preventScroll: true });
      $("leadForm").scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "nearest" });
    };
    $("leadForm").onsubmit = function (e) {
      e.preventDefault();
      var btn = $("leadSubmit");
      if (btn.disabled) return;             // dubbel-submit-skydd
      if ($("leadHp").value) return;        // honeypot
      ["leadNamn", "leadEpost", "leadTel", "leadPostnr", "leadConsent"].forEach(function (id) { var n = $(id); n.classList.remove("is-invalid"); n.removeAttribute("aria-invalid"); });
      var namn = $("leadNamn").value.trim(), epost = $("leadEpost").value.trim();
      function invalid(id, msg) { var n = $(id); n.classList.add("is-invalid"); n.setAttribute("aria-invalid", "true"); leadMsg(false, msg); n.focus(); }
      if (!namn) { invalid("leadNamn", "Fyll i ditt namn."); return; }
      if (epost.indexOf("@") < 1 || epost.indexOf(".") < 0) { invalid("leadEpost", "Fyll i en giltig e-postadress."); return; }
      var tel = $("leadTel").value.replace(/[^\d]/g, "");
      if (tel.length < 7) { invalid("leadTel", "Fyll i ett giltigt telefonnummer."); return; }
      var pnr = $("leadPostnr").value.trim().replace(/\s/g, "");
      if (!/^\d{5}$/.test(pnr)) { invalid("leadPostnr", "Ange postnummer med fem siffror."); return; }
      if (!$("leadConsent").checked) { $("leadConsent").classList.add("is-invalid"); leadMsg(false, "Du behöver godkänna att vi får kontakta dig."); $("leadConsent").focus(); return; }
      var payload = {
        segment: state.segment, namn: namn, epost: epost,
        telefon: $("leadTel").value.trim(), postnummer: $("leadPostnr").value.trim(),
        typ_id: state.typ_id, antal: state.antal, timmar_dag: state.timmar_dag, elprisomrade: state.elprisomrade,
        arlig_besparing: Math.round((lastResult || {}).arlig_besparing || 0),
        uppskattad_kostnad: Math.round(((lastResult || {}).breakdown || {}).total_led_kostnad || 0),
        company_url: $("leadHp").value, // honeypot — alltid tomt för riktiga användare; servern släpper bort ifyllda
        samtycke: true, samtycke_tid: nowIso()
      };
      track("lead_submit", { segment: state.segment, besparing: bucket(payload.arlig_besparing) });
      btn.disabled = true; btn.textContent = "Skickar…";
      var done = function () { leadMsg(true, "Tack " + namn.split(" ")[0] + "! Vår belysningsexpert hör av sig inom kort."); btn.textContent = "Skickat ✓"; };
      var fail = function () { leadMsg(false, "Kunde inte skicka just nu. Försök igen, eller mejla offert@ampy.se."); btn.disabled = false; btn.textContent = "Skicka offertförfrågan"; track("lead_error", { segment: state.segment }); };
      var ep = DATA.lead && DATA.lead.endpoint;
      if (ep) {
        fetch(ep, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
          .then(function (res) { if (!res.ok) { fail(); return; } done(); }).catch(fail);
      } else if (DATA.lead && DATA.lead.fallback_mailto) {
        // Öppna mejlklienten via en tillfällig länk — navigerar INTE bort värdsidan.
        // (window.location.href = mailto: river ner widgeten i en iframe/Bricks-embed.)
        try {
          var a = document.createElement("a");
          a.href = buildMailto(payload, DATA.lead.fallback_mailto);
          a.target = "_blank"; a.rel = "noopener";
          (ROOT || document.body).appendChild(a); a.click(); a.remove();
        } catch (x) {}
        // Ärlig text: utan backend kan vi inte bekräfta att mejlet faktiskt gick iväg.
        leadMsg(true, "Ett mejl öppnas i din e-postklient — skicka det så hör vår belysningsexpert av sig. Händer inget: mejla offert@ampy.se.");
        btn.textContent = "Öppnade mejl ✓";
      } else { fail(); }
    };
    ["leadNamn", "leadEpost", "leadTel", "leadPostnr"].forEach(function (id) { $(id).addEventListener("input", function () { this.classList.remove("is-invalid"); this.removeAttribute("aria-invalid"); }); });
    $("leadConsent").addEventListener("change", function () { this.classList.remove("is-invalid"); });
    // Avbryt → tillbaka till den enda CTA-knappen (formuläret kan annars knuffa svaret ur bild på mobil)
    $("leadCancel").onclick = function () { resetLead(); var c = $("ctaBtn"); if (c) c.focus(); };
    wireTooltips();
  }

  function nowIso() { try { return new Date().toISOString(); } catch (e) { return ""; } }
  function buildMailto(p, to) {
    var rad = function (k, v) { return (v || v === 0) ? (k + ": " + v + "\n") : ""; };
    var body = "Offertförfrågan – LED\n\n" +
      rad("Segment", p.segment) + rad("Namn", p.namn) + rad("E-post", p.epost) +
      rad("Telefon", p.telefon) + rad("Postnummer", p.postnummer) +
      "\nScenario:\n" + rad("Ljuskälla", p.typ_id) + rad("Antal", p.antal) +
      rad("Brinntid", p.timmar_dag + " h/dygn") + rad("Elprisområde", p.elprisomrade) +
      rad("Årlig besparing", group(p.arlig_besparing) + " kr/år") + rad("Uppskattad kostnad", group(p.uppskattad_kostnad) + " kr");
    return "mailto:" + to + "?subject=" + encodeURIComponent("Offertförfrågan LED – " + p.namn) + "&body=" + encodeURIComponent(body);
  }

  function leadMsg(ok, text) {
    var m = $("leadMsg"); m.textContent = text;
    m.setAttribute("role", ok ? "status" : "alert"); // ok = artig, fel = assertiv
    m.className = "ampy-calc__lead-msg " + (ok ? "ampy-calc__lead-msg--ok" : "ampy-calc__lead-msg--err");
  }
  function resetLead() {
    var f = $("leadForm"); if (!f) return;
    f.classList.add("is-hidden"); $("ctaBtn").classList.remove("is-hidden");
    $("leadSubmit").disabled = false; $("leadSubmit").textContent = "Skicka offertförfrågan";
    var m = $("leadMsg"); m.className = "ampy-calc__lead-msg is-hidden"; m.textContent = "";
    // Rensa felmarkeringar så ett tidigare fel inte hänger kvar rött efter segmentbyte
    ["leadNamn", "leadEpost", "leadTel", "leadPostnr", "leadConsent"].forEach(function (id) {
      var n = $(id); if (!n) return; n.classList.remove("is-invalid"); n.removeAttribute("aria-invalid");
    });
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
    $all(".ampy-calc__tip").forEach(function (btn) {
      btn.setAttribute("aria-label", btn.dataset.tip || "Mer info"); // hela texten är knappens namn för skärmläsare
      btn.addEventListener("mouseenter", function () { show(btn); });
      btn.addEventListener("mouseleave", hide);
      btn.addEventListener("focus", function () { show(btn); });
      btn.addEventListener("blur", hide);
      // Tap visar alltid (toggla inte) — annars dolde focus+click varandra (dubbeltryck på mobil)
      btn.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); show(btn); });
    });
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    window.addEventListener("orientationchange", hide);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && current) hide(); });
    document.addEventListener("click", function (e) { if (current && !(e.target.classList && e.target.classList.contains("ampy-calc__tip"))) hide(); });
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
  function trackBerakning(r) {
    if (berakningTimer) clearTimeout(berakningTimer);
    berakningTimer = setTimeout(function () {
      track("berakning", { segment: state.segment, besparing_spann: bucket(r.arlig_besparing) });
      // En lugn sammanfattning till skärmläsare (en gång per settle, ej per drag-frame)
      setText("resultSummary", "Årlig besparing " + fmtKr(r.arlig_besparing) + " kronor per år.");
    }, 600);
  }
  function track(name, props) { try { window.dataLayer = window.dataLayer || []; window.dataLayer.push(Object.assign({ event: "led_" + name }, meta, props || {})); } catch (e) {} }

  // --- init ---------------------------------------------------------------
  function init() {
    ROOT = document.querySelector(".ampy-calc");
    // Allt som läser DATA (applyPreset/buildControls) körs INNAN render()s try/catch.
    // Validera först + omslut hela kedjan → ett datafel visar vänliga felet, aldrig en vit widget.
    try {
      if (window.AmpyLED && AmpyLED.validateData) AmpyLED.validateData(DATA);
      captureMeta(); applyPreset(); wireStatic(); buildControls(); render();
    } catch (e) {
      renderError();
      return;
    }
    // Avbryt strandad slider-drag om sidan tappar fokus/döljs (iOS-avbrott)
    window.addEventListener("blur", function () { if (endActiveDrag) endActiveDrag(); });
    document.addEventListener("visibilitychange", function () { if (document.hidden && endActiveDrag) endActiveDrag(); });
    track("calc_view", { segment: state.segment, elprisomrade: state.elprisomrade });
  }
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();

