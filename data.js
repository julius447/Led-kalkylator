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

  /* --- Segment-konfiguration (affärsregler i data, ej i motorn) -------------- */
  segments: {
    brf:     { betalar_installation: true,  visa_co2: true },
    foretag: { betalar_installation: true,  visa_co2: true },
    privat:  { betalar_installation: false, visa_co2: false }
  },

  limits: { antal_max: 100000 },

  /* Horisont för kumulativ besparing + payback-kurva (LED-armaturer håller länge) */
  horisont_ar: 15,

  /* CTA pekar mot offert-/hjälp-flöde på destinationssidan (värde först, ingen vägg) */
  cta: { url: null }, // sätts vid Bricks-transplant; null = spåra klick (prototyp)
  lankar: { las_mer: "https://ampy.se/led-konvertering/", maila_endpoint: null },

  /* --- Ljuskällor ("vad byter du från?") — kat styr segment, grupp = optgroup
     kat: "privat" (DIY, installation 0) | "kommersiell" (Företag + BRF, armaturbyte) */
  watt_tabell: [
    // Privat — glödljus
    { id: "glod_40",  namn: "Glödlampa 40 W (E27/E14)", kat: "privat", grupp: "Glödljus", w_gammal: 40,  w_led: 5,  lumen: "~470 lm",  material_kr: 50,  installation_kr: 0 },
    { id: "glod_60",  namn: "Glödlampa 60 W (E27)",     kat: "privat", grupp: "Glödljus", w_gammal: 60,  w_led: 9,  lumen: "~800 lm",  material_kr: 55,  installation_kr: 0 },
    { id: "glod_75",  namn: "Glödlampa 75 W (E27)",     kat: "privat", grupp: "Glödljus", w_gammal: 75,  w_led: 12, lumen: "~1100 lm", material_kr: 60,  installation_kr: 0 },
    { id: "glod_100", namn: "Glödlampa 100 W (E27)",    kat: "privat", grupp: "Glödljus", w_gammal: 100, w_led: 16, lumen: "~1500 lm", material_kr: 70,  installation_kr: 0 },
    // Privat — halogen
    { id: "gu10_35",      namn: "Halogenspot GU10 35 W",        kat: "privat", grupp: "Halogen", w_gammal: 35,  w_led: 4,  lumen: "~230–300 lm", material_kr: 60,  installation_kr: 0 },
    { id: "gu10_50",      namn: "Halogenspot GU10 50 W",        kat: "privat", grupp: "Halogen", w_gammal: 50,  w_led: 6,  lumen: "~380–450 lm", material_kr: 70,  installation_kr: 0 },
    { id: "halo_r7s_150", namn: "Halogen linjär R7s 150 W",     kat: "privat", grupp: "Halogen", w_gammal: 150, w_led: 18, lumen: "~2200 lm",    material_kr: 130, installation_kr: 0 },
    { id: "halo_r7s_300", namn: "Halogen linjär R7s 300 W",     kat: "privat", grupp: "Halogen", w_gammal: 300, w_led: 35, lumen: "~3200 lm",    material_kr: 160, installation_kr: 0 },
    // Privat — lågenergi/LED
    { id: "cfl_15",          namn: "Lågenergilampa (CFL) 15 W",      kat: "privat", grupp: "Lågenergi / LED", w_gammal: 15, w_led: 9,  lumen: "~800 lm",  material_kr: 55, installation_kr: 0 },
    { id: "cfl_23",          namn: "Lågenergilampa (CFL) 23 W",      kat: "privat", grupp: "Lågenergi / LED", w_gammal: 23, w_led: 14, lumen: "~1500 lm", material_kr: 65, installation_kr: 0 },
    { id: "led_spot_gammal", namn: "Äldre LED-spot (1:a gen, GU10)", kat: "privat", grupp: "Lågenergi / LED", w_gammal: 7,  w_led: 5,  lumen: "~350 lm",  material_kr: 70, installation_kr: 0 },
    // Kommersiell — lysrör
    { id: "t8_1x18", namn: "Lysrörsarmatur 1×18 W T8 (60 cm)",  kat: "kommersiell", grupp: "Lysrör", w_gammal: 28,  w_led: 10, lumen: "~1000–1300 lm", material_kr: 180, installation_kr: 1800 },
    { id: "t8_2x18", namn: "Lysrörsarmatur 2×18 W T8 (60 cm)",  kat: "kommersiell", grupp: "Lysrör", w_gammal: 56,  w_led: 20, lumen: "~2000–2600 lm", material_kr: 280, installation_kr: 2000 },
    { id: "t8_1x36", namn: "Lysrörsarmatur 1×36 W T8 (120 cm)", kat: "kommersiell", grupp: "Lysrör", w_gammal: 41,  w_led: 18, lumen: "~1800–2200 lm", material_kr: 200, installation_kr: 1800 },
    { id: "t8_2x36", namn: "Lysrörsarmatur 2×36 W T8 (120 cm)", kat: "kommersiell", grupp: "Lysrör", w_gammal: 82,  w_led: 34, lumen: "~3600–4400 lm", material_kr: 350, installation_kr: 2000 },
    { id: "t8_1x58", namn: "Lysrörsarmatur 1×58 W T8 (150 cm)", kat: "kommersiell", grupp: "Lysrör", w_gammal: 65,  w_led: 25, lumen: "~2600–3300 lm", material_kr: 230, installation_kr: 1900 },
    { id: "t8_2x58", namn: "Lysrörsarmatur 2×58 W T8 (150 cm)", kat: "kommersiell", grupp: "Lysrör", w_gammal: 130, w_led: 48, lumen: "~5200–6600 lm", material_kr: 400, installation_kr: 2200 },
    { id: "t5_28",   namn: "Lysrörsarmatur T5 28 W (120 cm)",   kat: "kommersiell", grupp: "Lysrör", w_gammal: 32,  w_led: 16, lumen: "~2600 lm",      material_kr: 210, installation_kr: 1900 },
    { id: "pl_18",   namn: "Kompaktlysrör PL 18 W",             kat: "kommersiell", grupp: "Lysrör", w_gammal: 21,  w_led: 10, lumen: "~1200 lm",      material_kr: 150, installation_kr: 1500 },
    { id: "pl_26",   namn: "Kompaktlysrör PL 26 W",             kat: "kommersiell", grupp: "Lysrör", w_gammal: 29,  w_led: 12, lumen: "~1800 lm",      material_kr: 160, installation_kr: 1500 },
    // Kommersiell — LED (äldre)
    { id: "led_panel_gammal", namn: "Äldre LED-panel (1:a gen, ~45 W)", kat: "kommersiell", grupp: "LED", w_gammal: 45, w_led: 32, lumen: "~3600 lm", material_kr: 300, installation_kr: 1500 },
    // Kommersiell — utomhus/högtak
    { id: "mh_250_highbay", namn: "Metallhalogen high-bay 250 W", kat: "kommersiell", grupp: "Utomhus / högtak", w_gammal: 280, w_led: 100, lumen: "—", material_kr: 1400, installation_kr: 2200 },
    { id: "mh_400_highbay", namn: "Metallhalogen high-bay 400 W", kat: "kommersiell", grupp: "Utomhus / högtak", w_gammal: 455, w_led: 150, lumen: "—", material_kr: 1800, installation_kr: 2600 },
    { id: "hps_150", namn: "Högtrycksnatrium 150 W (utomhus)",    kat: "kommersiell", grupp: "Utomhus / högtak", w_gammal: 170, w_led: 60,  lumen: "—", material_kr: 1100, installation_kr: 2000 },
    { id: "hps_250", namn: "Högtrycksnatrium 250 W (utomhus)",    kat: "kommersiell", grupp: "Utomhus / högtak", w_gammal: 280, w_led: 95,  lumen: "—", material_kr: 1400, installation_kr: 2300 },
    { id: "merc_125", namn: "Kvicksilverlampa 125 W (äldre)",     kat: "kommersiell", grupp: "Utomhus / högtak", w_gammal: 137, w_led: 50,  lumen: "—", material_kr: 1000, installation_kr: 2000 },
    { id: "merc_250", namn: "Kvicksilverlampa 250 W (äldre)",     kat: "kommersiell", grupp: "Utomhus / högtak", w_gammal: 272, w_led: 90,  lumen: "—", material_kr: 1300, installation_kr: 2300 }
  ],

  /* --- Brinntid per kontext (timmar/dag, 365-dagars genomsnitt) -------------- */
  brinntid_default: [
    { kontext: "Hem / vardagsrum (primär armatur)",   segment: "privat",  timmar_dag: 4 },
    { kontext: "Hem / hela bostaden (per lampa)",     segment: "privat",  timmar_dag: 2.5 },
    { kontext: "Kontor",                              segment: "foretag", timmar_dag: 7 },
    { kontext: "Butik",                               segment: "foretag", timmar_dag: 10 },
    { kontext: "Lager (enkelskift)",                  segment: "foretag", timmar_dag: 8 },
    { kontext: "Verkstad / industri (2-skift)",       segment: "foretag", timmar_dag: 14 },
    { kontext: "Trapphus — alltid på",                segment: "brf",     timmar_dag: 11 },
    { kontext: "Trapphus — med sensor",               segment: "brf",     timmar_dag: 3 },
    { kontext: "Garage / förråd — utan styrning",     segment: "brf",     timmar_dag: 24 },
    { kontext: "Tvättstuga / gemensamt",              segment: "brf",     timmar_dag: 6 }
  ],

  /* --- CO2-faktor (ENDAST Företag/BRF, aldrig Privat) ------------------------ */
  co2_faktor: {
    g_per_kwh: 464.79,
    metod: "Nordisk residualmix tillämpad i Sverige, marknadsbaserad (Scope 2), rapportår 2024. Endast Företag/BRF ESG.",
    kalla: "Energimarknadsinspektionen (Ei), publ. 2025-06-12, beräknad av Grexel",
    datum: "Rapportår 2024 (verifierad 2026-06-05)."
  },

  /* --- Avdragsklausul per segment (försiktigt, inga falska avdrag) ----------- */
  avdrag_copy: {
    foretag: "Inga avdrag eller bidrag är inräknade — din kostnad kan bli lägre.",
    brf:     "Inga avdrag eller bidrag är inräknade — föreningens kostnad kan bli lägre.",
    privat:  "Vi räknar inte med ROT eller andra avdrag — din kostnad kan bli lägre."
  },

  /* --- Lysrörskrok (endast Företag/BRF) -------------------------------------- */
  lysror_fakta: {
    text: "Visste du? Nya lysrör säljs inte längre — EU förbjöd försäljning av T8- och T5-lysrör 2023. Att byta nu är ofta billigare än att vänta.",
    kalla: "EU Ecodesign/RoHS 2023; Belysningsbranschen (verifierad 2026-06-06)"
  },

  /* --- Segment-defaults ------------------------------------------------------ */
  defaults: {
    brf: {
      antal: 80, typ_id: "t8_2x36", kontext: "Trapphus — alltid på",
      antal_slider: { min: 1, max: 400, ticks: [40, 80, 160, 280, 400] },
      seg_caption: "Vi räknar för föreningens gemensamma belysning.",
      enhet_namn: "armaturer", cta_text: "Få offert på LED-konvertering"
    },
    foretag: {
      antal: 30, typ_id: "t8_2x36", kontext: "Kontor",
      antal_slider: { min: 1, max: 200, ticks: [10, 30, 75, 125, 200] },
      seg_caption: "Vi räknar för verksamhetens belysning.",
      enhet_namn: "armaturer", cta_text: "Få offert på LED-konvertering"
    },
    privat: {
      antal: 15, typ_id: "gu10_50", kontext: "Hem / vardagsrum (primär armatur)",
      antal_slider: { min: 1, max: 60, ticks: [5, 15, 30, 45, 60] },
      seg_caption: "Vi räknar för belysningen i ditt hem.",
      enhet_namn: "ljuskällor", cta_text: "Få hjälp att byta till LED"
    }
  },

  /* --- Embed-preset per belysningssida (sida → förvalt läge) ----------------- */
  embed_preset: {
    "belysning":        { segment: "brf",     typ_id: "t8_2x36",  kontext: "Trapphus — alltid på" },
    "inomhusbelysning": { segment: "foretag", typ_id: "t8_2x36",  kontext: "Kontor" },
    "utomhusbelysning": { segment: "brf",     typ_id: "hps_150",  kontext: "Garage / förråd — utan styrning" },
    "spotlight":        { segment: "privat",  typ_id: "gu10_50",  kontext: "Hem / vardagsrum (primär armatur)" },
    "armaturer":        { segment: "foretag", typ_id: "t8_2x36",  kontext: "Lager (enkelskift)" }
  },

  /* --- Geo: region → serviceflagga (datadriven, ej hårdkodat) ---------------- */
  geo: {
    default_servicezon: true,
    regioner: { "SE1": true, "SE2": true, "SE3": true, "SE4": true }
  }
};
