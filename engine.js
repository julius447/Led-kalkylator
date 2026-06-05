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

  function lookup(list, key, val) {
    for (var i = 0; i < list.length; i++) if (list[i][key] === val) return list[i];
    return null;
  }

  /**
   * @param {Object} inputs { segment, typ_id, antal, timmar_dag, elprisomrade }
   * @param {Object} data    window.AMPY_LED_DATA
   * @returns {Object} resultat med full precision + spårbara mellanled
   */
  function calculate(inputs, data) {
    if (!data || data.schema_version !== "1.0.0") {
      throw new Error("Okänt dataschema — motorn vägrar köra.");
    }

    var typ = lookup(data.watt_tabell, "id", inputs.typ_id);
    if (!typ) throw new Error("Okänd ljuskälla: " + inputs.typ_id);

    var antal = Math.max(0, Number(inputs.antal) || 0);
    var hDag = Math.max(0, Number(inputs.timmar_dag) || 0);

    // Elpris: valt område, annars nationell default
    var krKwh = data.elpris[inputs.elprisomrade];
    if (typeof krKwh !== "number") krKwh = data.elpris.nationellt_default;

    // --- Energi ---
    var wSparad = Math.max(0, typ.w_gammal - typ.w_led);          // W per enhet
    var kwhPerEnhetAr = (wSparad / 1000) * hDag * DAGAR;          // kWh/år per enhet
    var kwhArTotal = kwhPerEnhetAr * antal;                       // kWh/år totalt

    var kwhGammalTotal = (typ.w_gammal / 1000) * hDag * DAGAR * antal;
    var kwhLedTotal = (typ.w_led / 1000) * hDag * DAGAR * antal;

    // --- Kronor ---
    var arligBesparing = kwhArTotal * krKwh;                      // kr/år
    var besparing10ar = arligBesparing * 10;

    // --- Payback (material + ev. installation för Företag/BRF) ---
    var kostnad = lookup(data.led_kostnad, "id", typ.kostnad_id) ||
                  lookup(data.led_kostnad, "id", "e27");
    var betalarInstallation = (inputs.segment === "foretag" || inputs.segment === "brf");
    var perEnhetKostnad = kostnad.material_kr + (betalarInstallation ? kostnad.installation_kr : 0);
    var totalLedKostnad = perEnhetKostnad * antal;
    var paybackAr = arligBesparing > 0 ? (totalLedKostnad / arligBesparing) : null;

    // --- CO2 (endast Företag/BRF) ---
    var visaCo2 = inputs.segment !== "privat";
    var co2KgAr = visaCo2 ? (kwhArTotal * data.co2_faktor.g_per_kwh) / 1000 : null;

    return {
      inputs: { segment: inputs.segment, typ_id: typ.id, antal: antal, timmar_dag: hDag, elprisomrade: inputs.elprisomrade, kr_kwh: krKwh },
      // Hjälte + stödtrio (full precision; renderaren avrundar)
      arlig_besparing: arligBesparing,
      kwh_ar: kwhArTotal,
      payback_ar: paybackAr,
      besparing_10ar: besparing10ar,
      co2_kg_ar: co2KgAr,
      visa_co2: visaCo2,
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
        total_led_kostnad: totalLedKostnad,
        betalar_installation: betalarInstallation
      }
    };
  }

  global.AmpyLED = { calculate: calculate };
})(window);
