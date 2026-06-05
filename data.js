/* =============================================================================
   LED-kalkylatorn — DATALAGER (Lager 3 i 5-lagersarkitekturen)
   -----------------------------------------------------------------------------
   ALL affärsdata bor här. Motorn (engine.js) innehåller noll hårdkodade tal.

   Värdena nedan kommer från Agent 1:s adversariellt verifierade research-dossier
   (2026-06-05, se research-dossier.md). De är källade, daterade och konservativt
   valda — men ska fortfarande SAKKUNNIG-SIGNERAS innan go-live (se dossierns
   checklista + qa-invariant-checklista.md punkt 16).

   Konservativ riktning för en BESPARINGS-kalkylator = mindre besparing och längre
   payback: lägre elpris, högre W på LED-sidan, högre kvarvarande drifttid efter
   styrning, högre installationskostnad, inga avdrag som standard.

   Versionerat schema: motorn vägrar okänd struktur.
   ============================================================================= */
window.AMPY_LED_DATA = {
  schema_version: "1.0.0",
  _status: "Research-signerad 2026-06-05 (Agent 1). Kräver sakkunnig-signatur före lansering.",

  /* --- Elpris: TOTALPRIS kr/kWh inkl. moms (spot + elnät + energiskatt) ------
     Konservativa (låga) defaults; under typiskt marknadstotal ~2,40 kr/kWh.
     Källa: Skatteverket (energiskatt 36 öre/kWh fr.o.m. 2026-01-01), Nord Pool
     spot 2026 YTD via elpriser24.se, Ellevio elnät (~20 öre, låg ände). */
  elpris: {
    SE1: 1.35,
    SE2: 1.40,
    SE3: 1.65,
    SE4: 1.85,
    nationellt_default: 1.50,
    min: 0.80,
    max: 3.50,
    enhet: "kr/kWh inkl. moms",
    datum: "2026 (verifierad 2026-06-05)",
    kalla: "Skatteverket; Nord Pool/elpriser24.se; Ellevio",
    not: "Konservativa uppskattningar — justera mot din egen faktura. Elnätsavgiften är största osäkerheten; ett dyrare nätbolag + vinterpris kan trycka SE4 över 2,40 kr/kWh."
  },

  /* --- Segment-konfiguration: affärsregler bor i data, ej i motorn ----------- */
  segments: {
    privat:  { betalar_installation: false, visa_co2: false },
    foretag: { betalar_installation: true,  visa_co2: true },
    brf:     { betalar_installation: true,  visa_co2: true }
  },

  /* --- Gränsvärden (motorn/renderaren clampar mot dessa) --------------------- */
  limits: { antal_max: 100000 },

  /* --- Lead-endpoint (sätts vid Bricks-transplant; mailto-fallback för embeds) */
  lead: { endpoint: null, fallback_mailto: "leads@ampy.se" },

  /* --- Watt-tabell: gammal typ → W_gammal, W_LED. kostnad_id → led_kostnad ----
     Privat per ljuskälla. Företag/BRF-kärnfallet modelleras som en STANDARD
     2×36 W T8-armatur (armaturbyte = brief-kravet), så watt och kostnad sitter
     på samma fysiska enhet. */
  watt_tabell: [
    { id: "glod_40",  namn: "Glödlampa 40 W",  segment: "privat",  kostnad_id: "e27",  w_gammal: 40,  w_led: 5,  lumen: "~470 lm",  not: "LED ~4,5–6 W." },
    { id: "glod_60",  namn: "Glödlampa 60 W",  segment: "privat",  kostnad_id: "e27",  w_gammal: 60,  w_led: 9,  lumen: "~800 lm",  not: "LED ~8–9 W." },
    { id: "glod_75",  namn: "Glödlampa 75 W",  segment: "privat",  kostnad_id: "e27",  w_gammal: 75,  w_led: 12, lumen: "~1100 lm", not: "Konservativt 12 W (ej 11 W premium)." },
    { id: "glod_100", namn: "Glödlampa 100 W", segment: "privat",  kostnad_id: "e27",  w_gammal: 100, w_led: 16, lumen: "~1500 lm", not: "Konservativt 16 W (massmarknad 14–17 W, ej 13 W)." },
    { id: "gu10_35",  namn: "Halogenspot GU10 35 W", segment: "privat", kostnad_id: "gu10", w_gammal: 35, w_led: 4, lumen: "~230–300 lm", not: "LED ~3–5 W." },
    { id: "gu10_50",  namn: "Halogenspot GU10 50 W", segment: "privat", kostnad_id: "gu10", w_gammal: 50, w_led: 6, lumen: "~380–450 lm", not: "LED ~5–7 W; jämförbart ljus, ej ljusare." },
    { id: "cfl_15",   namn: "Lågenergi/CFL 15 W", segment: "privat", kostnad_id: "e27", w_gammal: 15, w_led: 9, lumen: "~800 lm", not: "Endast ~40 % lägre energi vs CFL — liten besparing, visas ärligt." },
    { id: "t8_arm",   namn: "Lysrörsarmatur 2×36 W T8", segment: "foretag", kostnad_id: "t8_armatur", w_gammal: 72, w_led: 34, lumen: "LED ~3600–4400 lm (vs lysrör ~5600–6400 lm)", not: "Kommersiellt kärnfall — fullt armaturbyte (2 rör). Hävda aldrig lika lumen. Rörbyte ensamt sparar mindre än fullt armaturbyte — blanda ej ihop." }
  ],

  /* --- Brinntid per kontext (timmar/dag, 365-dagars genomsnitt) -------------- */
  brinntid_default: [
    { kontext: "Hem / vardagsrum",                   timmar_dag: 2,  segment: "privat",  not: "Energimyndigheten ~2 h/lampa. 3 h endast för primär armatur." },
    { kontext: "Kontor",                             timmar_dag: 7,  segment: "foretag", not: "Konservativt (2500 h/år låg ände)." },
    { kontext: "Butik",                              timmar_dag: 10, segment: "foretag", not: "~12 h öppet × 6 dagar ≈ 3744 h/år." },
    { kontext: "Lager (enkelskift)",                 timmar_dag: 8,  segment: "foretag", not: "~3000 h/år enkelskift. 24/7-logistik upp till 24 h." },
    { kontext: "BRF trapphus — alltid på",           timmar_dag: 11, segment: "brf",     not: "~4000 h/år (låg ände)." },
    { kontext: "BRF trapphus — med sensor",          timmar_dag: 3,  segment: "brf",     not: "Konservativt = högre kvarvarande drifttid. Ger ~73 % reduktion mot 11 h." },
    { kontext: "BRF garage — utan styrning",         timmar_dag: 24, segment: "brf",     not: "8760 h/år. Med närvarostyrning ~4 h." }
  ],

  /* --- LED-kostnad: material (Privat) + installation (Företag/BRF) ----------- */
  led_kostnad: [
    { id: "e27",         typ: "LED-lampa (E27)",            material_kr: 60,  installation_kr: 0,    not: "DIY. 39–90 kr." },
    { id: "gu10",        typ: "LED-spot (GU10)",            material_kr: 70,  installation_kr: 0,    not: "DIY. 39–130 kr." },
    { id: "t8_armatur",  typ: "LED-armatur (ersätter 2×36 W T8)", material_kr: 350, installation_kr: 2000, not: "Fullt armaturbyte inkl. elektriker (900–1000 kr/h). 1800–2500 kr installerat/armatur. Inget ROT för företag." }
  ],

  /* --- CO2-faktor svensk el (ENDAST Företag/BRF, aldrig Privat) --------------
     Marknadsbaserad nordisk residualmix (ESG/Scope 2). Konservativt val: undviker
     att överkreditera Sveriges rena nät. Får ALDRIG visas som konsumentens
     fysiska undvikna utsläpp. */
  co2_faktor: {
    g_per_kwh: 464.79,
    metod: "Nordisk residualmix tillämpad i Sverige, marknadsbaserad (Scope 2), rapportår 2024. Endast Företag/BRF ESG.",
    kalla: "Energimarknadsinspektionen (Ei), publ. 2025-06-12, beräknad av Grexel",
    datum: "Rapportår 2024 (verifierad 2026-06-05). Omverifiera när Ei publicerar 2025 i juni 2026."
  },

  /* --- Avdrags-/skattecopy per segment (försiktigt, inga falska avdrag) ------ */
  avdrag_copy: {
    privat:  "LED-byte ger inget skatteavdrag: grön teknik gäller solceller, batteri och laddbox – inte belysning – och lampbyte ger inte rotavdrag. Räkna med 0 kr i avdrag.",
    foretag: "Belysning är en avdragsgill driftskostnad – den minskar skattepliktig vinst (inte en rabatt på priset). Stäm av med din redovisning.",
    brf:     "Lägre elkostnad sänker föreningens driftskostnad direkt – utrymme att hålla nere avgiftshöjningar. Inget statligt stöd räknas in (Boverkets energistöd är stängt sedan 2021), så siffran står på egna ben."
  },

  /* --- Lysrörsutfasningens fakta (Meta-/copy-krok, daterade källor) ---------- */
  lysror_fakta: {
    forbud_text: "Lysrör fasas ut: CFL och runda T5/T9 fick inte sättas på EU-marknaden från februari 2023, raka T5/T8 från augusti 2023 (RoHS + Ecodesign). Befintliga rör får brinna tills de går sönder.",
    antal_armaturer: "~17 miljoner armaturer i Sverige berörs (Belysningsbranschen via TT, 2022-11-15)",
    payback_text: "Ingen fast branschpayback hävdas. Besparing vid LED-konvertering ~50 %, upp till 75 % med styrning (övre gräns). Payback beräknas transparent från dina egna värden.",
    kalla: "Belysningsbranschen; Aura Light; Elektroskandia (verifierad 2026-06-05)"
  },

  /* --- Segment-defaults: antal, framing, CTA -------------------------------- */
  defaults: {
    privat: {
      antal: 12, typ_id: "gu10_50", kontext: "Hem / vardagsrum",
      rubrik: "Så mycket sparar du på att byta till LED",
      framing: "Spara på din kvarvarande halogen och spots.",
      cta_text: "Vill du ha hjälp av en behörig elektriker?",
      cta_assurance: "Vi matchar dig med en behörig elektriker — kostnadsfritt.",
      cta_typ: "hjalp", visa_co2: false
    },
    foretag: {
      antal: 25, typ_id: "t8_arm", kontext: "Kontor",
      rubrik: "Så mycket lägre driftskostnad med LED",
      framing: "Nya lysrör säljs inte längre (EU-förbud sedan 2023) — varje trasigt rör tvingar fram ett byte ändå. Räkna vad det sparar att byta nu.",
      cta_text: "Boka kostnadsfri belysningsgenomgång",
      cta_assurance: "Kostnadsfritt och utan förpliktelse · svar inom 1 arbetsdag · utförs av behörig elektriker",
      cta_typ: "offert", visa_co2: true
    },
    brf: {
      antal: 60, typ_id: "t8_arm", kontext: "BRF trapphus — alltid på",
      rubrik: "Så mycket kan föreningen spara med LED",
      framing: "Sänk driftskostnaden och avgiftstrycket — byt ut föreningens gamla lysrör.",
      cta_text: "Få offert på LED-konvertering",
      cta_assurance: "Kostnadsfritt och utan förpliktelse · svar inom 1 arbetsdag · utförs av behörig elektriker",
      cta_typ: "offert", visa_co2: true
    }
  },

  /* --- Embed-preset per belysningssida (sida → förvalt läge) ----------------- */
  embed_preset: {
    "belysning":        { segment: "foretag", typ_id: "t8_arm",  kontext: "Kontor" },
    "inomhusbelysning": { segment: "foretag", typ_id: "t8_arm",  kontext: "Kontor" },
    "utomhusbelysning": { segment: "brf",     typ_id: "t8_arm",  kontext: "BRF garage — utan styrning" },
    "spotlight":        { segment: "privat",  typ_id: "gu10_50", kontext: "Hem / vardagsrum" },
    "armaturer":        { segment: "foretag", typ_id: "t8_arm",  kontext: "Lager (enkelskift)" }
  },

  /* --- Geo: region → serviceflagga (lead-CTA bara i servicezon) -------------- */
  geo: {
    default_servicezon: true,
    regioner: { "SE1": false, "SE2": false, "SE3": true, "SE4": true },
    utanfor_text: "Vi finns inte här än — så hittar du en behörig elektriker via Installatörsföretagen."
  }
};
