# Datakontrakt - LED-besparingskalkylator (Sverige)
## Forskningsdossier med kallor, datum och konservatismnoteringar

Sammanstalld av Data & Modelling lead, 2026-06-05. Alla varden ar adversariellt verifierade och konservativt valda. Konservativ riktning for en BESPARINGS-kalkylator = mindre besparing och langre payback (lagre elpris, hogre wattval pa LED-sidan, hogre kvarvarande drifttid efter styrning, hogre installationskostnad, inga avdrag som standard).

---

### 1. Elpris (kr/kWh inkl. moms)

| Zon | Default | Intervall |
|-----|---------|-----------|
| SE1 | 1,35 | 1,20-1,70 |
| SE2 | 1,40 | 1,25-1,75 |
| SE3 | 1,65 | 1,50-2,10 |
| SE4 | 1,85 | 1,70-2,40 |
| Nationellt default | 1,50 | 1,40-1,70 |

- **Energiskatt fr.o.m. 2026-01-01:** 36,0 ore/kWh exkl. moms (45,0 ore inkl. 25% moms). Reducerad skatt i vissa nordliga kommuner: 26,4 ore exkl. (33,0 inkl.), dvs -9,6 ore. *Kalla: Skatteverket, effektiv 2026-01-01, verifierad 2026-06-05 (HOG konfidens, exakt, direktverifierad).*
- **Spotpris 2026 YTD exkl. moms (Nord Pool):** SE1 59,16 / SE2 59,56 / SE3 82,40 / SE4 94,35 ore; nationellt snitt 73,87 ore. *Kalla: elpriser24.se/elbruk.se, verifierad 2026-06-05 (matchar oberoende kalla nara exakt).*
- **Elnat rorlig overforing:** ~20 ore/kWh exkl. moms (Ellevio faktisk 26 ore inkl. moms ~= 20,8 exkl. - genuint billigaste-operator-varde; typisk marknad 39-55 ore). *Kalla: Ellevio; marknadsspann elpriser24.se.*
- **Uppbyggnad:** spot ~50 + paslag ~3 + elnat ~20 + skatt 36 = ~109 ore exkl. × 1,25.

**Konservatismnot:** Alla zon-defaults ligger val UNDER det oberoende typiska marknadstotalet ~2,40 kr/kWh - kalkylatorn underskatar, inte overskatar, besparing. Nordliga uppbyggnader anvander spot ~50-53 (var/sommar) snarare an YTD-snittet 59-60, vilket sanker SE1/SE2 ytterligare (avsiktlig sasongslag-antagande). Elnatsavgiften ar storsta osakerheten - verktyget MASTE uppmana anvandaren att byta till sitt eget bolags rorliga overforingsavgift.

---

### 2. Watt-tabell (gammal -> LED)

| Ljuskalla | Gammal W | LED W (konservativ) | Lumen | Segment |
|-----------|----------|---------------------|-------|---------|
| Glodlampa 40W | 40 | 5 (4,5-6) | ~470 lm | Privat |
| Glodlampa 60W | 60 | 9 (8-9) | ~800 lm | Privat |
| Glodlampa 75W | 75 | **12** (ej 11) | ~1100 lm | Privat |
| Glodlampa 100W | 100 | **16** (14-17, ej 13) | ~1500-1600 lm | Privat |
| Halogenspot GU10 35W | 35 | 4 (3-5) | ~230-300 lm | Privat |
| Halogenspot GU10 50W | 50 | 6 (5-7) | ~380-450 lm | Privat |
| Lagenergi/CFL 15W | 15 | 9 (8-10) | ~800 lm | Privat |
| **Lysror T8 36W (karnfall)** | 36 | **17** (16-18) | LED ~1800-2200 lm | Foretag/BRF |

*Kallor: VOLT Lighting; LEDVANCE; Sylvania/GE; LE; lamps-on-line; BLT Direct; Philips CorePro; Luminate; bulbbasics; Premier Lighting; BulbAmerica/USAI. 2024-2025, accessed 2026-06.*

**Konservatismnoter / korrigeringar applicerade:**
- **100W: 13W FORKASTAT** - massmarknadsprodukter drar 14-17W (13W endast topptier). Default 16W satt for konservativ bias.
- **75W: 11W -> 12W** - 11W ar premium-bastafall (Feit 11,2W); dominerande massmarknad 12W.
- **GU10 50W:** manga '50W-ekv'-LED ger bara 350-450 lm - presentera som jamforbart-till-nagot-lagre, INTE ljusare.
- **CFL -> LED:** endast ~40% energiminskning (ej ~85-90% som glodlampa). UI far inte antyda glodlampsskala for CFL.
- **T8-karnfall:** REELL ljusflodesminskning (LED 1800-2200 lm vs original lysror 2800-3200 lm) - havda ALDRIG lika lumen. Rorbyte (TLED) ~30-40% besparing, kan krava ballast-bypass + elbehorighet; full armaturretrofit upp till ~75%. Blanda inte ihop.

---

### 3. Brinntid (timmar/dag, 365-dagars genomsnitt)

| Kontext | h/dag | Not |
|---------|-------|-----|
| Hem/vardagsrum | 2 (3 for primar armatur) | Energimyndigheten ~2 h/lampa; markning antar 3 |
| Kontor | 7 | 2500 h/ar lag ande; 4000 h/ar (~11) ovre |
| Butik | 10 | 12h × 6 dagar ~= 3744 h/ar |
| Lager (enkelskift) | 8 | ~3000 h/ar tumregel; 24/7 = upp till 24 |
| BRF trapphus utan styrning | 11 | ~4000 h/ar (lag ande) |
| **BRF trapphus med sensor** | **3** (ej 1,5) | konservativt = HOGRE kvarvarande drifttid |
| BRF garage utan styrning | 24 | med narvaro ~4 h/dag |

*Kallor: Energimyndigheten Belysningsutmaningen (2018-rapport + 2024-markning); energieffektivt.se; cardi.se (BRF Vita Hoja, direktverifierad).*

**Korrigeringar applicerade (adversariell verifiering):**
1. **STRUKNA ofverifierbara citat:** 'BRF Tranan -77% / ~2000 h/ar' (trapphusrenoveringar.se) och '24h->2-3 h/dag, -80-90%' (stockholm-fastighetsservice.se) - bada sidor direktfetchade, INGEN av siffrorna fanns. Far ej publiceras.
2. **Sensor-trapphus 1,5 -> 3 h/dag:** for ett efter/med-styrning-varde ar det konservativa valet den HOGRE kvarvarande drifttiden (1,5 overskatar sensorns nytta). Baslinje 11 -> 3 ger forsvarbar ~73% reduktion.
3. **Lager-kallattribut korrigerat:** energieffektivt.se anvander 4000 h/ar (kommersiellt) / 6000 h/ar (industri), INTE 3000. 3000 h/ar ar en allman tumregel.
4. **Verifierad ankare for narvarostyrning:** Vita Hoja garage -82,6%, 20 525 kr/ar (cardi.se, direktfetch).

**Konvention:** Alla h/dag ar 365-dagars-genomsnitt. Far INTE dubbelraknas mot en separat ×365-multiplikator.

---

### 4. LED-kostnad (material vs material+installation)

| Typ | Material (kr) | Installation (kr) | Segment |
|-----|---------------|-------------------|---------|
| E27 LED-lampa | 60 (39-90) | 0 | Privat DIY |
| GU10 LED-spot | 70 (39-130) | 0 | Privat DIY |
| T8 LED-ror 120-150cm | 110 | 0 | Privat DIY |
| T8 inkl. fullt armaturbyte | 350 | 2000 | Foretag/BRF |

*Kallor: IKEA/Hornbach; Lampornu.se (Osram T8 120cm 96,35 kr inkl. moms - verifierad); BAUHAUS Ledvance Batten 150cm 269 kr (verifierad); hantverkskollen.se; agitar.se; Skatteverket. 2026-06.*

**Korrigering applicerad (krav):**
- **Arbetskraft 800 -> 900-1000 kr/h inkl. moms.** 800 var for LAGT mot 2026-kallor (mest citerat 900-1400 kr/h inkl. moms; billigaste kalla ~625-1060 inkl.). 800 underskatade payback (fel riktning).
- **Full installerad kostnad per armatur:** 1800-2500 kr typiskt (default mot 2200-2500 vid laga antal); 2500-3500 kr vid lift/hojd. Minimidebitering 1-3 h + startavgift 400-1500 kr gor sub-1h, sub-2000 kr enstaka-jobb orealistiska.
- **ROT for foretag = 0.** ROT endast privatperson i agd bostad, endast arbete, aldrig material (Skatteverket).
- **DIY-caveat:** per Elsakerhetsverket kan retrofit-T8-ror kraga omkoppling/markning av armaturen - ren material-payback forutsater kompetens.
- **Regional variation:** arbetskraftspriser varierar starkt (Stockholm/Goteborg/Malmo i topp, landsbygd 100-200 kr/h lagre) - overvag att exponera som input.

---

### 5. CO2-faktor

- **Headline: 464,79 g CO2/kWh** - nordisk residualmix tillampad i Sverige, marknadsbaserad (Scope 2), rapportar 2024.
- *Kalla: Energimarknadsinspektionen (Ei), publicerad 2025-06-12, beraknad av Grexel pa nordisk niva. Direktverifierad via WebFetch. Energimixsplit 68,21% fossilt / 21,61% karnkraft / 10,18% fornybart. Foregaende ar 524,10 g (2023).*
- Sekundar linje: svensk platsbaserad produktionsmix ~18 g CO2/kWh (Nowtricity/IEA/EEA, 2025-snitt).

**Korrigeringar applicerade:**
- Etikett ska saga **'nordisk residualmix tillampad i Sverige'**, INTE en svensk nationell produktionssiffra (det ar den inte - svensk produktionsmix ~18 g).
- Anvand **'g CO2/kWh'** (Ei:s ordval), ej 'CO2e' om ej Ei dokumenterar full GHG-ekvivalent.

**Konservatismnot:** Residualmix ar ~en storleksordning hogre an platsbaserad mix - att anvanda den som headline undviker att overkreditera Sveriges rena nat. **VIKTIGT:** Detta ar ESG/redovisning-only (marknadsbaserad Scope 2) - far ENDAST visas for Foretag/BRF, aldrig som fysiska utslapp undvikna for konsument, annars blir det en overclaim. Omverifiera nar Ei publicerar 2025 i juni 2026; nya ursprungsmarkningsforeskrifter trader i kraft 2026-02-01.

---

### 6. Avdrag (juridiskt forsiktig copy)

- **Privat: 0 kr.** Gron teknik tacker endast solceller (15% 2026), batterilager (50%), laddbox (50%) - LED/belysning INGAR INTE. Enkelt lampbyte ger ej ROT (Skatteverket listar uttryckligen 'byte av gloldlampor och sakringar' som icke-ROT-arbete). *Kalla: Skatteverket gron teknik + 'Ger arbetet ratt till rotavdrag?', verifierad 2026-06-05.*
- **Foretag: avdragsgill driftskostnad** (16 kap. 1 § IL). KOSTNADSAVDRAG som minskar vinst, INTE subvention/fast procent. Nettonytta ~= kostnad × marginalskatt (t.ex. 20,6% bolagsskatt) och endast vid vinst. Far INTE renderas som procentrabatt pa LED-priset.
- **BRF: neutral.** Boverkets stod till energieffektivisering i flerbostadshus ar STANGT (sista ansokan 2021-12-31; statusdokument 2026-03-01). Klimatklivet existerar men ar konkurrensutsatt, ej garanterat (medel konfidens, ej omfetchad). Rakna 0 kr. *Kalla: Boverket; Naturvardsverket.*

---

### 7. Lysrorsutfasning (fakta)

- **Forbudsdatum:** CFL + runda T5/T9 fran februari 2023; raka T5/T8 fran augusti 2023. (Belysningsbranschen anger den 24:e; vissa tillverkare den 25:e - anvand 'februari 2023'/'augusti 2023' i publik copy.)
- **Regelgrund:** RoHS 2011/65/EU (kvicksilverundantag borttaget) + Ecodesign/SLR (EU) 2019/2020.
- **Befintliga lampor far anvandas tills de gar sonder; lager far saljas slut** (forbud galler endast placing on market).
- **~17 miljoner armaturer** berors over fem ar (Belysningsbranschen via TT, 2022-11-15). Femarsfonstret raknas fran slutet av 2022 - ~halften forflutet 2026.
- **Besparing:** bas ~50%; med styrning UPP TILL 75% (ovre grans); nationell potential upp emot 4,1 TWh (ovre grans).
- **Payback: INGEN specifik siffra far publiceras som branschpastaende** - enda kallordalydelse 'betalar sig ganska snart'. Visad payback maste beraknas transparent fran anvandarens egna data och markas som uppskattning.

*Kallor: Belysningsbranschen (artiklar + pressmeddelande via TT 2022-11-15); Aura Light; Elektroskandia. Verifierad 2026-06-05.*

---

## KRAVER SAKKUNNIG-SIGNERING (checklista innan go-live)

En sakkunnig (energiradgivare + skatte-/elsakerhetskunnig) MASTE signera foljande innan publik lansering:

1. **[ ] Elnatsavgift-disclaimer:** Bekrafta att verktyget tvingar/uppmanar anvandaren att ersatta ~20 ore/kWh med sitt eget bolags faktiska rorliga overforingsavgift (storsta osakerheten; kan trycka SE4 over 2,40 kr/kWh).
2. **[ ] Energiskatt 2026:** Verifiera 36,0 ore exkl. moms och reducerad 26,4 ore for nordliga kommuner mot Skatteverket vid go-live (gallande fr.o.m. 2026-01-01).
3. **[ ] Wattval ej under konservativt golv:** Bekrafta 100W->16W (aldrig 13), 75W->12W (aldrig 11) i den levererade tabellen.
4. **[ ] T8-lumen-pastaende:** Bekrafta att UI ALDRIG havdar lika lumen (LED 1800-2200 vs original 2800-3200) och att rorbyte- vs full-armatur-besparing inte sammanblandas.
5. **[ ] Ballast-bypass/elsakerhet:** Sakkunnig bekraftar formulering om att retrofit-T8 kan krava elbehorighet (Elsakerhetsverket).
6. **[ ] Sensor-trapphus 3 h/dag:** Bekrafta att efter-styrning-defaulten ar 3 (ej 1,5) och att de strukna citaten (BRF Tranan, stockholm-fastighetsservice) inte aterintroducerats.
7. **[ ] h/dag-konvention:** Bekrafta enhetlig 365-dagars-bas utan dubbelrakning mot ×365.
8. **[ ] Arbetskraftsrate:** Bekrafta 900-1000 kr/h inkl. moms och installerad 2200-2500 kr/armatur, samt minimidebitering/startavgift-antaganden; overvag regional input.
9. **[ ] ROT/avdrag:** Skattesakkunnig signerar: Privat 0 kr (ingen ROT/gron teknik), Foretag = driftskostnad presenterad som skatteeffekt med 'fraga din revisor', BRF neutral (Boverket stangt, Klimatklivet ej garanterat).
10. **[ ] CO2-faktor scope:** Bekrafta 464,79 g CO2/kWh visas ENDAST for Foretag/BRF ESG med korrekt etikett ('nordisk residualmix tillampad i Sverige', 'g CO2/kWh'), aldrig som konsumentens fysiska utslapp. Omverifiera nar Ei publicerar 2025 (juni 2026).
11. **[ ] Lysror-datum + payback:** Bekrafta 'februari/augusti 2023' i copy och att INGEN specifik branschpayback publiceras; 75%/4,1 TWh markta som 'upp till'.
12. **[ ] Genomgaende konservatism-disclaimer:** Bekrafta prominent text 'detta ar konservativa uppskattningar - justera mot din faktura/ditt avtal'.