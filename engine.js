/* =============================================================================
   LED-kalkylatorn — ENGINE (Layer 4): pure function over the data layer
   -----------------------------------------------------------------------------
   calculate(inputs, data) → result in FULL precision. No rounding here
   (that happens only in the renderer). No hardcoded business figures — everything
   is looked up in `data`.
   Formula (Part 4):
     annual_saving = (W_old − W_LED)/1000 × h_day × 365 × kr_kWh × count
     payback_years = total_LED_cost ÷ annual_saving
   ============================================================================= */
(function (global) {
  "use strict";

  var DAGAR = 365;
  var _validated = false; // double validation gate runs once, then cached

  function lookup(list, key, val) {
    if (!Array.isArray(list)) return null;
    for (var i = 0; i < list.length; i++) if (list[i][key] === val) return list[i];
    return null;
  }

  /* Double validation gate (Part 3): gate 1 = schema, gate 2 = structure.
     Ensures a content editor who accidentally makes a mistake in data.js gets a clear
     error instead of a silent NaN hero figure. Runs once and is cached. */
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
   * @returns {Object} result with full precision + traceable intermediate steps
   */
  function calculate(inputs, data) {
    validateData(data);

    var typ = lookup(data.watt_tabell, "id", inputs.typ_id);
    if (!typ) throw new Error("Okänd ljuskälla: " + inputs.typ_id);

    var antal = Math.max(0, Number(inputs.antal) || 0);
    var hDag = Math.max(0, Number(inputs.timmar_dag) || 0);

    // Electricity price: user's own override (>0) wins; otherwise the selected area; otherwise national.
    var krKwh = (typeof inputs.kr_kwh === "number" && inputs.kr_kwh > 0)
      ? inputs.kr_kwh
      : (typeof data.elpris[inputs.elprisomrade] === "number"
          ? data.elpris[inputs.elprisomrade]
          : data.elpris.nationellt_default);

    // --- Energy ---
    var wSparad = Math.max(0, typ.w_gammal - typ.w_led);          // W per unit
    var kwhPerEnhetAr = (wSparad / 1000) * hDag * DAGAR;          // kWh/year per unit
    var kwhArTotal = kwhPerEnhetAr * antal;                       // kWh/year total

    var kwhGammalTotal = (typ.w_gammal / 1000) * hDag * DAGAR * antal;
    var kwhLedTotal = (typ.w_led / 1000) * hDag * DAGAR * antal;

    // --- Kronor (SEK) ---
    var arligBesparing = kwhArTotal * krKwh;                      // kr/year
    var besparing10ar = arligBesparing * 10;

    // --- Quote price: total cost per fixture (incl. installation) ---
    var segConf = data.segments[inputs.segment] || {};
    var perEnhetKostnad = typ.kostnad_kr;
    var totalLedKostnad = perEnhetKostnad * antal;
    var paybackAr = arligBesparing > 0 ? (totalLedKostnad / arligBesparing) : null;

    // --- CO2 (only segments with visa_co2 = Företag/BRF) ---
    var visaCo2 = !!segConf.visa_co2;
    var co2KgAr = visaCo2 ? (kwhArTotal * data.co2_faktor.g_per_kwh) / 1000 : null;

    // --- Cumulative cash-flow curve (year 0..H): saving × year − cost ---
    var HORISONT = (data.horisont_ar && data.horisont_ar > 0) ? data.horisont_ar : 15;
    var cumulative = [];
    for (var y = 0; y <= HORISONT; y++) cumulative.push(arligBesparing * y - totalLedKostnad);
    var nettoHorisont = cumulative[HORISONT];

    return {
      inputs: { segment: inputs.segment, typ_id: typ.id, antal: antal, timmar_dag: hDag, elprisomrade: inputs.elprisomrade, kr_kwh: krKwh },
      // Hero + supporting trio (full precision; the renderer rounds)
      arlig_besparing: arligBesparing,
      kwh_ar: kwhArTotal,
      payback_ar: paybackAr,
      besparing_10ar: besparing10ar,
      co2_kg_ar: co2KgAr,
      visa_co2: visaCo2,
      horisont_ar: HORISONT,
      cumulative: cumulative,            // [year0..H] net kr (for the payback curve)
      netto_horisont: nettoHorisont,     // net kr at the horizon (hero figure)
      // Traceable intermediate steps for a transparent breakdown ("Så har vi räknat")
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
