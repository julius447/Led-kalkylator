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
- ⏳ **Elpris konservativt** — provisoriska defaults i underkant; bekräftas av Agent 1.
- ⏳ **CO2-faktor** — provisorisk; exakt mix/metod måste skrivas ut.

## Grind-utfall
**Status: 15 / 16 passerar.** Endast punkt **16 (mänsklig sakkunnig-signatur)** återstår och är blockerande för go-live. Datan är nu adversariellt verifierad, källad och daterad (Agent 1, 2026-06-05) och inlagd i `data.js`. Kvar: en energirådgivare + skatte-/elsäkerhetskunnig signerar `research-dossier.md`-checklistan (12 punkter) → grön → lansering.

### Sakkunnig-signatur — sammanfattning av vad som ska bekräftas (se dossier för fullständig lista)
1. Elnätsavgift-disclaimer tvingar användaren justera mot egen faktura.
2. Watt-golv (100W→16, 75W→12) ej underskridna.
3. T8: aldrig lika-lumen-påstående; rörbyte ≠ fullt armaturbyte.
4. CO2 464,79 g/kWh endast Företag/BRF, korrekt etikett, omverifieras juni 2026.
5. Avdrag: Privat 0 kr, Företag driftskostnad (ej rabatt), BRF neutralt.
6. Inga fabricerade case-siffror (BRF Tranan / Stockholm-citaten ströks).
