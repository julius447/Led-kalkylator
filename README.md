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

## Verifierat
- ✅ Instant value på load, noll konsolfel.
- ✅ Squint-test (kr/år dominerar) desktop + mobil 360 px.
- ✅ Segmentbyte: framing, defaults, typer, CTA, CO2-synlighet, delningscitat.
- ✅ Geo-grind: CTA byts mot ärlig hänvisning utanför servicezon.

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
