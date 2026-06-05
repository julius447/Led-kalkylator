# QA & Red-Team — Invariant-grind (Agent 7)

> Underkänt på en **enda** punkt = inte redo. Status nedan är efter prototyp-bygget; punkter som väntar på sakkunnig-signering är markerade ⏳.

## Del 7 — Invariant-checklista (16 punkter)

| # | Invariant | Status | Bevis / not |
|---|-----------|--------|-------------|
| 1 | Löser **en** namngiven ångest-/intäktsfråga | ✅ | "Era lysrör är förbjudna — vad kostar bytet, vad sparar ni?" är förvald framing (Företag/BRF). |
| 2 | Arketyp A medvetet vald | ✅ | Matematik in → hjälte-siffra ut → payback. |
| 3 | Fullt värde gratis, **ingen vägg före svaret** | ✅ | Resultat renderas på load, ingen e-postvägg. |
| 4 | Lead-fångst *efter* värdet | ✅ | CTA-zon ligger under hjälte-siffran; värdet kan tas med utan att lämna något. |
| 5 | Kärnresultat skärmdumpbart/citerbart | ✅ | Delningskort + citatrad per segment. |
| 6 | Räknar för hela landet; lead-CTA bara i servicezon | ✅ | `geo` i data; utanför zon byts CTA mot ärlig hänvisning (testat). |
| 7 | All data i datafil, aldrig hårdkodat | ✅ | `engine.js` har noll affärstal; allt i `data.js`. |
| 8 | Källor citerade, priser/regler daterade | ✅ | `data.js` + `research-dossier.md` har källa + datum (2026-06-05) per värde. |
| 9 | Förenklingar erkända i texten | ✅ | "Uppskattning baserad på dina värden" + justerbara antaganden synliga. |
| 10 | Inbäddad på fem sidor + korslänk behörighetskollen | ✅ (mekanik) | `data-sida` + `embed_preset` klara; faktisk inbäddning sker i Bricks. |
| 11 | Vanilla JS + plugin, driftsäkert | ✅ | Ren funktion, inga ramverk, ingen runtime-fetch. |
| 12 | Instant value; avrundning bara i display; tal konsistenta | ✅ | Motor i full precision; hjälte-siffra och payback ur samma värde. |
| 13 | Hjälte-siffran dominerar (squint-test); hierarki desktop + 360 px | ✅ | Verifierat i preview desktop + 360 px. |
| 14 | **Inga falska avdrag; CO2 konservativ/metod-angiven (eller utelämnad Privat); besparing ej överdriven** | ✅ | Privat-copy = *inget* avdrag (grön teknik täcker ej LED); CO2 dold för Privat, märkt "nordisk residualmix (ESG)" för Företag/BRF; alla watt/pris/timmar konservativt valda (mindre besparing, längre payback). Två fabricerade case-citat ströks av red-team. |
| 15 | Segment-CTA mot offert för Företag/BRF; läcker aldrig i värdesegment | ✅ | Privat → "hjälp av elektriker"; Företag → genomgång; BRF → offert. |
| 16 | Siffrorna signerade av sakkunnig före lansering | ⏳ | **Blockerande för go-live.** Dossier måste signeras. |

## Red-team: jakt på överdrift (Del 6)

- ✅ **CFL-fallet visas ärligt** — byte från lågenergi ger liten besparing, döljs ej.
- ✅ **Payback inkluderar installation** för Företag/BRF (armaturbyte, inte bara rörbyte) — understryker inte kostnaden.
- ✅ **Privat avdrag = noll** hävdat i copy (grön teknik gäller ej belysning).
- ✅ **Elpris konservativt** — defaults i underkant (SE1–SE4 1,35–1,85); vol.2 låter användaren justera mot egen faktura (slidern höjer aldrig automatiskt).
- ✅ **CO2-faktor** — 464,79 g/kWh, nordisk residualmix (ESG), endast Företag/BRF, metod utskriven i etikett + data.

## Grind-utfall
**Status: 15 / 16 passerar.** Endast punkt **16 (mänsklig sakkunnig-signatur)** återstår och är blockerande för go-live. Datan är nu adversariellt verifierad, källad och daterad (Agent 1, 2026-06-05) och inlagd i `data.js`. Kvar: en energirådgivare + skatte-/elsäkerhetskunnig signerar `research-dossier.md`-checklistan (12 punkter) → grön → lansering.

### Sakkunnig-signatur — sammanfattning av vad som ska bekräftas (se dossier för fullständig lista)
1. Elnätsavgift-disclaimer tvingar användaren justera mot egen faktura.
2. Watt-golv (100W→16, 75W→12) ej underskridna.
3. T8: aldrig lika-lumen-påstående; rörbyte ≠ fullt armaturbyte.
4. CO2 464,79 g/kWh endast Företag/BRF, korrekt etikett, omverifieras juni 2026.
5. Avdrag: Privat 0 kr, Företag driftskostnad (ej rabatt), BRF neutralt.
6. Inga fabricerade case-siffror (BRF Tranan / Stockholm-citaten ströks).

## Vol.2-addendum (multi-agent-revision, 2026-06-05)
Vol.2 stärkte doktrinen ytterligare — inga invarianter försämrades:
- **Doktrin-brott lagat:** texten "Elpriser kan justeras ovan" var falsk i vol.1 (ingen kontroll fanns). Vol.2 gör den sann med en kr/kWh-slider och omformulerar till "justera mot din egen faktura — vi utgår från ett medvetet lågt pris, så din verkliga besparing blir högre".
- **Ingen vägg före svaret (inv. 3/4):** lead-formuläret visas FÖRST efter CTA-klick; hela siffran + breakdown syns på load och hela tiden. GDPR-samtycke obligatoriskt, omarkerat default.
- **Förbudsformulering korrigerad (inv. 9/14):** "nya lysrör säljs inte (EU-förbud 2023)" — aldrig att befintliga rör är olagliga.
- **Konsistens (inv. 12):** elpris-overriden flödar genom samma värde till hjälte-siffra, payback OCH formel — granskarens omräkning stämmer på öret (2,40 → 5 825 kr/år).
- **Robusthet (inv. 12/13):** felgräns + antal-clamp ⇒ ingen rå krasch, blank "—" eller 9-siffrig skräp-hjälte; tomt läge säger "ange dina värden" istället för att pitcha 0 kr.
- **A11y:** AA-kontrast, aria-valuetext, sr-only H1, 44px-mål, reduced-motion — embed-redo.
- **Tester:** `node engine.test.js` → 25/25 (inkl. valideringsgrindens felfall, override, kantfall).

Status oförändrad: **15/16 passerar; punkt 16 (mänsklig sakkunnig-signatur) är den enda kvarvarande grinden.**
