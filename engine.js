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
