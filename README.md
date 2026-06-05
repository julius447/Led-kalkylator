# LED-kalkylatorn — fristående prototyp & byggunderlag

Ampys roadmap-verktyg #2 (Arketyp A — besparingsprojektion). Batterikalkylatorns matematik-DNA på **oantastliga** siffror, med tyngdpunkten flyttad från den mättade privatmarknaden till **lysrörsutfasningens högvärdes-leads i Företag och BRF**.

## Vad detta är
En körbar, fristående **referensprototyp** (single-file-vänlig vanilla JS) som *är* 1:1-mockupen, levande. Engine + data + renderer är ramverksfria så de kan lyftas rakt in i WordPress/Bricks-pluginet av engineering-lagret.

## 5-lagersarkitekturen (Del 3)
| Lager | Fil | Ansvar |
|-------|-----|--------|
| 3 — Data | `data.js` | All affärsdata. Versionerat schema. Inget i kod. |
| 4 — Motor | `engine.js` | Ren `calculate(inputs, data)`, full precision, noll hårdkodade tal. |
| 5 — Renderare | `app.js` | Avrundning bara här. Instant value, real-time omräkning, CTA, delning, geo-grind. |
| — Skal | `index.html` | Inlinad JSON, ingen client-side fetch. |
| — Stil | `styles.css` | Endast `ampy-design-system`-tokens (semantiska, fluid clamp, spacing-skala). |

**Motor-formel:** `årlig_besparing = (W_gammal − W_LED)/1000 × h_dag × 365 × kr_kWh × antal`; `payback_år = total_LED_kostnad ÷ årlig_besparing` (material [+ installation för Företag/BRF]).

## Köra lokalt
```
cd led-kalkylatorn && python3 -m http.server 5177
# → http://localhost:5177
```

## Segment (affärslogiken, inte UX-kosmetik)
- **Privat** — trafik/SEO. Kvarvarande halogen/spots. CTA: hjälp av elektriker. **Ingen CO2, inget avdrag.**
- **Företag** — intäkt. Lysrörsarmaturer. CTA: kostnadsfri belysningsgenomgång. Avdragsgill driftskostnad.
- **BRF** — högst lead-värde. Trapphus/garage. CTA: offert på LED-konvertering. Sänk avgiftstrycket.

Verktyget **öppnar i Företag-läge** fristående; embed-preset (`data-sida`) styr läget per belysningssida.

## Ärlighet = moat (Del 6)
Transparent matematik med användarens egna tal, synlig osäkerhet, justerbara antaganden, **inga falska avdrag**, CO2 endast Företag/BRF med angiven metod. Hjälte-siffra och payback härleds ur *samma* värde.

## Vol.2 — vad som tillkom (multi-agent-revision, 2026-06-05)
13 expertlinser granskade vol.1; 11 must-ship-förbättringar byggdes (full plan i `VOL2-PLAN.md`):
1. **Justerbart elpris** — kr/kWh-slider; området seedar ett medvetet lågt default, användaren drar mot sin egen faktura. Stänger dossierns största osäkerhet och gör hjälte-siffran till *deras* tal.
2. **Lead-flöde** — värde först, formulär efter CTA-klick (ersätter knappen → en primär kvar). Honeypot + GDPR-samtycke + scenario-fält; POST till `data.lead.endpoint` annars mailto-fallback.
3. **Felgräns + input-härdning** — `render()` i try/catch → lugn fallback; antal clampas (0…100000), NaN-säkrade steppers.
4. **Strukturell datavalidator** — motorns dubbla valideringsgrind (schema + struktur), cachas.
5. **A11y** — egen aria-live runt resultatet, `aria-valuetext` på sliders, AA-kontrast (mörkare teal för text/CTA), 44px touch-mål, sr-only H1, reduced-motion.
6. **Skarpare squint-test** — 4xl hjälte-siffra, grön accent, trio i panel (payback grön), CO2 på egen rad, breakdown hopfälld.
7. **Dela-loop** — scenario i URL-hash (delning hydrerar mottagaren till avsändarens siffra), OG/Twitter-meta, visuellt dela-kort (byggt via `textContent`, ingen XSS-väg).
8. **Funnel-telemetri** — `calc_view`, `berakning` (besparing i spann), `cta_klick`, `lead_submit`, `elpris_justerad`, `breakdown_open` + UTM/embed-proveniens.
9. **Copy** — korrekt förbudsformulering (nya rör säljs inte; befintliga är lagliga), CTA ekar siffran, BRF-nytta först, lysrörsfakta-rad.
10. **Tomt/0-läge** + trygghetsmikrocopy under CTA.
11. **Mobil-tier (≤480px)** + token-/lager-städning (is-hidden-utility, rgba→tokens, formula på typskalan).

## Verifierat
- ✅ Instant value på load, noll konsolfel (vol.2 reverifierad).
- ✅ Squint-test (kr/år dominerar) desktop + mobil 360 px.
- ✅ Segmentbyte: framing, defaults, typer, CTA, CO2-synlighet, delningscitat.
- ✅ Elpris-slider räknar om hjälte-siffran; formeln rekoncilierar (2,40 → 5 825 kr/år).
- ✅ Lead-formulär öppnas efter värdet; rätt fält per segment; en primär knapp kvar.
- ✅ Dela-länk hydrerar mottagaren till avsändarens scenario (BRF-länk → 55 924 kr/år).
- ✅ Geo-grind: CTA byts mot ärlig hänvisning utanför servicezon.
- ✅ `node engine.test.js` → 25/25 gröna (valideringsgrind, override, kantfall).

## ⚠️ Blockerande före go-live
Värden i `data.js` är **adversariellt verifierade, källade och daterade** (Agent 1, 2026-06-05 — se `research-dossier.md`). Kvarstår: **en mänsklig sakkunnig** (energirådgivare + skatte-/elsäkerhetskunnig) signerar dossierns 12-punktschecklista. Det är den enda återstående grinden (`qa-invariant-checklista.md` punkt 16). 15/16 invarianter passerar redan.

## Filer
- `index.html`, `data.js`, `engine.js`, `app.js`, `styles.css` — verktyget.
- `research-dossier.md` — Agent 1 (genereras av research-workflow).
- `distribution-meta.md` — Agent 6 (Meta-krokar, målgrupp, embed/korslänk).
- `qa-invariant-checklista.md` — Agent 7 (16 invarianter + red-team).

## Transplant till Bricks (engineering-lagret, Del 4 Agent 5)
1. Inlinea `data.js`-objektet i sidans `<script>` (eller PHP-genererad JSON) — ingen fetch.
2. `engine.js` + `app.js` laddas som plugin-assets (ej tema).
3. Lead-endpoint: samma PHP-mönster som behörighetskollen (nonce, honeypot, GDPR).
4. Reservera resultatytans höjd i layouten (redan gjort: `.hero { min-height }`).
