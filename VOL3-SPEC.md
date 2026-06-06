I now have the full real structure. The three directions are remarkably convergent on the big decisions, which makes my job about picking the strongest authorial frame and grafting the sharpest specifics. Let me note the key data points I'll lock in, then write the final spec. I don't need to consult the design skill further — the tokens are fully specified in the prompt and the CSS already declares them.

One important correction I'll bake in: the research data gives more nuanced brinntid defaults than any single direction used, and the segment-specific "byter från" option lists in the research are far richer than any direction's hand-written lists. I'll graft the real research data.

Here is the final spec.

---

# LED-kalkylatorn vol.3 — FINAL SPEC
## "Composed confidence" — one calm number, one quiet act, proof on demand

**Base chosen: Direction 1 (Swiss Editorial Restraint).** It has the most rigorous, defensible craft thesis (collapse the page to ~two type registers; reserve 700-weight and the largest scale token for the hero number *alone*; ration teal to ~3 placements), the cleanest no-nested-cards reasoning, and the most disciplined token discipline. It is the strongest single authorial vision and the most directly buildable against the real files.

**The 3 best grafts:**
1. **From Direction 2 — the teal `kr/år` suffix as the page's one purposeful color pop, plus tabular-nums on every recomputing number.** D1 deliberately kept the unit grey/recessive; that is *too* austere — the owner sells *money saved*, and one rationed teal "kr/år" reads "this is the saving" pre-literately without breaking the non-text-accent rule (teal on navy is decorative emphasis on a unit glyph, not body copy carrying meaning). Tabular-nums (D2/D3) is the concrete anti-jitter mechanism D1 only gestured at.
2. **From Direction 3 — the warm human microcopy register and the short segment caption under the toggle.** D1's strings are correct but cold; D3's sentence-case, plainspoken Swedish ("…så att siffran håller — inte för att den ska imponera") is what actually reads Jony-Ive-human rather than corporate, and the one-line segment caption restores the orientation the removed "Dina värden" eyebrow used to give — without being a label.
3. **From Direction 3 + the RESEARCH DATA — real segment-specific option lists and nuanced brinntid defaults via `<optgroup>`.** All three directions invented thinner "byter från" lists; the research dossier has a fully-sourced, segment-filtered catalog. We graft the actual data, segment-filtered, grouped with `<optgroup>` (D1/D3's scannability idea) — this is the most faithful-to-owner choice for requirement 8.

Everything below is final and buildable. No raw hex/px in UI; tokens only; all font sizes via the clamp scale.

---

## 0. GLOBAL DECISIONS (the authorial spine)

- **Type registers:** The working area uses exactly three sizes — `--fs-md` (titles, hero unit, stat values), `--fs-sm` (CTA button only), `--fs-xs` (everything else). `--fs-3xl` and weight 700 are reserved **exclusively** for the hero number. `--fs-4xl`, `--fs-2xl`, `--fs-xl`, `--fs-lg` are unused.
- **Weights:** 400 body/keys; 500 labels, hero label, hero unit, toggle resting; 600 titles, stat values, button, selected toggle, summaries; 700 hero number ONLY.
- **Color ration — teal appears in exactly these places:** (1) the hero `kr/år` suffix `--action-primary`; (2) the `<input type=range>` thumb `accent-color: --action-primary`; (3) focus rings `--border-focus`; (4) teal *text* `--action-primary-text` only on the live brinntid value and the formula result token; (5) the CTA fill `--action-primary-fill`. Nowhere else.
- **`--state-success`:** used once — a 2px inset hero accent tab (graft from D3, see §3). `--state-warning`: used once — the lysrör callout left-border. No green text anywhere.
- **`--bg-subtle`:** only the toggle track, formula block, stepper buttons, honesty box. **Navy `--bg-surface`:** the hero AND the selected toggle pill (graft from D3 — binds the toggle to the answer; chosen over D1's white pill because it is more coherent and more clearly "selected").
- **All recomputing numbers:** `font-variant-numeric: tabular-nums`.
- **No-nested-cards compliance:** Only the right column is a `.card`. The hero is a `.hero` panel (not `.card`); the CTA is a `.cta-card` panel (not `.card`); the two stat blocks are tiles inside the `.hero` panel; the transparency `<details>`, lysrör note, and honesty box live inside the right `.card` but are flat flow content, not cards. No card contains a card.

---

## 1. PAGE COMPOSITION & RESPONSIVE

```
.ampy-led (max-width 1100px, margin auto, bg --bg-primary)
  padding: --spacing-xl (desktop)  → --spacing-lg (≤760) → --spacing-md (≤480)
  h1.sr-only
  .led-grid
    └ section.results (LEFT)
        .hero            (navy panel)
        .cta-card        (white panel)   ← margin-top --spacing-lg
    └ section.card.controls (RIGHT)
        .seg-toggle
        .seg-caption
        h2.section-title
        [fields...]
        .transparency-group (rule + details + lysrör + honesty)
```

- `.led-grid`: `display:grid; grid-template-columns: 1.15fr 1fr; gap: var(--spacing-2xl); align-items:start;` (left results column dominant; the 3rem gutter is the editorial whitespace — no divider line).
- Left column inner stack: `display:flex; flex-direction:column; row-gap: var(--spacing-lg);`

**Responsive:**
- **≤760px:** one column, `row-gap: var(--spacing-xl)`. DOM order is answer-first and we keep it (results section before controls section). **Do not** reorder — arriving users want the number first; the toggle is reachable by a short scroll. (This resolves D2's reorder proposal against D1/D3; we side with answer-first per the owner's hero emphasis.)
- **≤480px (360px target):** `.ampy-led` padding `--spacing-md`; `.hero` padding `var(--spacing-lg) var(--spacing-md)`; toggle button padding `var(--spacing-xs) var(--spacing-sm)`. Hero number stays `--fs-3xl` (floors at 2.6rem — verified to fit the longest realistic string "184 000 kr" at 360px with `--spacing-md` side padding and tabular-nums). The two stat tiles remain a 2-up grid (`gap: var(--spacing-sm)`). CTA button `width:100%`.

---

## 2. SEGMENT TOGGLE (top of right card, smaller)

DOM: first child of `section.card.controls`.

```html
<div class="seg-toggle" role="group" aria-label="Välj segment">
  <button data-seg="brf" aria-pressed="true">BRF</button>
  <button data-seg="foretag" aria-pressed="false">Företag</button>
  <button data-seg="privat" aria-pressed="false">Privatperson</button>
</div>
<p class="seg-caption" id="segCaption">Vi räknar för föreningens gemensamma belysning.</p>
```

- **Order BRF · Företag · Privatperson; opens on BRF** (`aria-pressed="true"` on BRF at load; engine default segment `brf`). Remove the page-top toggle entirely.
- Track: `display:inline-flex; width:100%; background:var(--bg-subtle); padding:var(--spacing-xs); border-radius:var(--radius-full); gap:var(--spacing-xs); margin-bottom:var(--spacing-xs);` (remove the old `max-width:480px`).
- Buttons: `flex:1; border:0; background:transparent; font-family:"Plus Jakarta Sans"; font-weight:var(--fw-medium); font-size:var(--fs-xs); color:var(--text-secondary); padding:var(--spacing-xs) var(--spacing-sm); min-height:36px; border-radius:var(--radius-full); cursor:pointer; transition: background var(--motion-fast), color var(--motion-fast);`
- Hover (resting): `color:var(--text-primary);`
- Selected `[aria-pressed="true"]`: `background:var(--bg-surface); color:var(--text-inverse); font-weight:var(--fw-semibold);` hover keeps inverse.
- Focus-visible: `outline:2px solid var(--border-focus); outline-offset:2px;`
- **`.seg-caption`** (graft from D3): `font-size:var(--fs-xs); color:var(--text-secondary); margin:0 0 var(--spacing-lg);` Copy by segment (sentence case):
  - BRF: `Vi räknar för föreningens gemensamma belysning.`
  - Företag: `Vi räknar för verksamhetens belysning.`
  - Privat: `Vi räknar för belysningen i ditt hem.`
- Caption crossfades on segment switch (opacity, `--motion-fast`).

---

## 3. THE HERO (one big number + two small stat blocks)

Remove `#framing` entirely. Remove the old `.trio` (payback + 10-year are gone) and the separate `.co2-row`.

```html
<div class="hero">
  <div id="resultLive" role="status" aria-live="polite" aria-atomic="true">
    <div class="hero-label" id="heroLabel">Sänkt driftskostnad per år</div>
    <div class="hero-number" id="heroNumber">—<span class="hero-unit"> kr/år</span></div>
    <div class="hero-stats">
      <div class="stat-tile"><div class="v" id="statKwh">—</div><div class="k" id="statKwhKey">energi per år</div></div>
      <div class="stat-tile"><div class="v" id="statB">—</div><div class="k" id="statBKey">—</div></div>
    </div>
  </div>
</div>
```

- `.hero`: `position:relative; background:var(--bg-surface); color:var(--text-inverse); border-radius:var(--radius-lg); padding:var(--spacing-2xl); box-shadow:var(--shadow-lg); overflow:hidden;` Keep `min-height` reserved so recompute never reflows — set `min-height: 320px` (desktop) but rely primarily on fixed line-heights.
- **Accent tab** `.hero::before` (graft from D3, refined): `content:""; position:absolute; top:0; left:var(--spacing-2xl); width:48px; height:2px; background:var(--state-success);` (a short warm "saving" tab, not a full corporate stripe; reduced from 3px → 2px per D1 restraint).
- **`.hero-label`:** `font-size:var(--fs-xs); font-weight:var(--fw-medium); letter-spacing:0.04em; opacity:0.75; margin-bottom:var(--spacing-sm);` **sentence case, NOT uppercase.** Copy: BRF/Företag `Sänkt driftskostnad per år`; Privat `Sänkt elkostnad per år`.
- **`.hero-number`:** `font-family:"Plus Jakarta Sans"; font-weight:var(--fw-bold); font-size:var(--fs-3xl); line-height:1.0; letter-spacing:-0.02em; color:var(--text-inverse); font-variant-numeric:tabular-nums; transition:opacity var(--motion-fast);` Integer formatted with thin-space thousands separator (e.g. `18 400`).
  - **`.hero-unit`** (graft from D2 — the one teal pop): `color:var(--action-primary); font-size:var(--fs-md); font-weight:var(--fw-semibold); letter-spacing:0; margin-left:var(--spacing-xs);` baseline-aligned. The eye reads digits first, then a teal `kr/år`.
  - **≤400px fallback:** `.hero-unit{ display:block; margin-left:0; }` so the unit wraps to its own line and never clips.
- **`.hero-stats`:** `display:grid; grid-template-columns:1fr 1fr; gap:var(--spacing-md); margin-top:var(--spacing-xl);`
- **`.stat-tile`:** `background:var(--bg-trio-panel); border-radius:var(--radius-md); padding:var(--spacing-md);` (tiles inside the panel — not cards).
  - `.stat-tile .v`: `font-family:"Plus Jakarta Sans"; font-weight:var(--fw-semibold); font-size:var(--fs-md); line-height:1.1; font-variant-numeric:tabular-nums;`
  - `.stat-tile .k`: `font-size:var(--fs-xs); font-weight:var(--fw-regular); opacity:0.65; margin-top:var(--spacing-xs);` sentence case.

**Block content & the Privat swap (doctrine guardrail — engine-driven):**
- **Block A (all segments):** `#statKwh` = energi/år, e.g. `9 200 kWh`; key `energi per år`.
- **Block B — BRF & Företag:** `#statB` = CO₂/år, e.g. `1,1 ton`; `#statBKey` = `mindre CO₂ per år` with a second `--fs-xs` line at `opacity:0.55`: `nordisk residualmix (ESG)`. Framed strictly as ESG residual-mix, never physical avoided emissions.
- **Block B — Privat:** engine **swaps content** to `#statB` = kr/månad (annual ÷ 12), `#statBKey` = `i månaden`. CO₂ is **never** rendered for Privat. (Swap the node's text + key, not just hide.)

Recompute micro-interaction: number + stat values dip `opacity` 0.4→1 over `--motion-fast`; tabular-nums prevents width jump. No count-up, no slide.

---

## 4. THE CLEAN CTA CARD (one button, nothing else)

Delete from DOM: `#ctaTitle`, `#ctaSub`, `#ctaAssurance`, the entire `#leadForm`, `#leadDone`, `.share-row`, `.share-quote`, `#shareBtn`, `#shareCard`. (Lead capture lives on the destination page — value free, no email wall before the answer.)

```html
<div class="cta-card">
  <button class="btn-primary" id="ctaBtn">Få offert på LED-konvertering</button>
</div>
```

- `.cta-card`: `background:var(--bg-primary); border:1px solid var(--border-default); border-radius:var(--radius-lg); padding:var(--spacing-xl); box-shadow:var(--shadow-sm); display:flex; justify-content:center;` Contains exactly the one button. (No reassurance line — honor "just the clean button.")
- `.btn-primary`: `background:var(--action-primary-fill); color:var(--text-inverse); font-family:"Plus Jakarta Sans"; font-weight:var(--fw-semibold); font-size:var(--fs-sm); padding:var(--spacing-md) var(--spacing-xl); min-height:48px; border:0; border-radius:var(--radius-md); cursor:pointer; width:100%; max-width:360px; transition:filter var(--motion-fast);` No shadow on the button (the card holds shadow).
- **Hover:** `filter:brightness(0.94);` **Active:** `filter:brightness(0.88);` (D1's filter approach — chosen over opacity so white text never washes out). No transform. **Focus-visible:** `outline:2px solid var(--border-focus); outline-offset:2px;`
- **≤480px:** button `max-width:none` (full width).
- **Segment labels** (sentence case, engine-set):
  - BRF: `Få offert på LED-konvertering`
  - Företag: `Få offert på LED-konvertering`
  - Privat: `Få hjälp att byta till LED`

Remove `.btn-ghost` and all share/lead-form CSS.

---

## 5. INPUTS (right card)

Heading: remove `.eyebrow` "Dina värden". Keep only `<h2 class="section-title">Justera så räknar vi direkt</h2>` — `font-size:var(--fs-md); font-weight:var(--fw-semibold); margin-bottom:var(--spacing-lg);`

Field rhythm: `.field{ margin-bottom:var(--spacing-lg); }` (up from md). Labels: `display:block; font-size:var(--fs-xs); font-weight:var(--fw-medium); color:var(--text-primary); margin-bottom:var(--spacing-xs);` sentence case. All controls: `width:100%; font-family:"Outfit"; font-size:var(--fs-xs); padding:var(--spacing-sm) var(--spacing-md); border:1px solid var(--border-default); border-radius:var(--radius-md); min-height:44px; background:var(--bg-primary); color:var(--text-primary);` Focus on every control: `outline:2px solid var(--border-focus); outline-offset:1px; border-color:var(--border-focus);`

### 5.1 "Vad byter du från?" (`#inTyp`) — expanded, segment-filtered, grouped

Engine populates `<optgroup>`s from the research catalog, **filtered by active segment** (`foretag_brf` items appear in both Företag and BRF). Each option carries `data-wold`, `data-wled`, `data-material`, `data-install` from the dossier.

- **Privat** (install 0 kr, DIY):
  - *Glödljus:* Glödlampa 40 W, Glödlampa 60 W, Glödlampa 75 W, Glödlampa 100 W
  - *Halogen:* Halogenspot GU10 35 W, Halogenspot GU10 50 W, Halogen linjär R7s 150 W, Halogen linjär R7s 300 W
  - *Lågenergi / LED:* Lågenergilampa (CFL) 15 W, Lågenergilampa (CFL) 23 W, Äldre LED-spot (1:a gen)
  - Default: **Halogenspot GU10 50 W**
- **Företag:**
  - *Lysrör:* Lysrörsarmatur 1×18 W T8, 2×18 W T8, 1×36 W T8, 2×36 W T8, 1×58 W T8, 2×58 W T8, T5 28 W, Kompaktlysrör PL 18 W, Kompaktlysrör PL 26 W
  - *LED:* Äldre LED-panel (1:a gen)
  - *Utomhus / högtak:* Metallhalogen high-bay 250 W, 400 W; Högtrycksnatrium 150 W, 250 W; Kvicksilverlampa 125 W, 250 W
  - Default: **Lysrörsarmatur 2×36 W T8** (the commercial core case)
- **BRF:**
  - *Lysrör:* (same T8/T5/PL set as Företag)
  - *Utomhus / garage / högtak:* Metallhalogen high-bay 250 W, 400 W; Högtrycksnatrium 150 W, 250 W; Kvicksilverlampa 125 W, 250 W
  - Default: **Lysrörsarmatur 2×36 W T8**
- `<optgroup label>`: styled `font-weight:var(--fw-semibold); color:var(--text-secondary);` (native optgroup styling; no custom requirement).

### 5.2 "Var sitter belysningen?" (`#inKontext`) — KEEP as-is (req. 9), same control styling. (This drives the brinntid default — see §5.4.)

### 5.3 Antal (`.stepper`) — `−` / number / `+`

Buttons `min-width:44px; min-height:44px; border:1px solid var(--border-default); background:var(--bg-subtle); border-radius:var(--radius-md); font-weight:var(--fw-semibold); color:var(--text-primary);` input `text-align:center; font-variant-numeric:tabular-nums;` Hover `filter:brightness(0.97)`, active `filter:brightness(0.94)`. **Researched defaults (engine, on segment switch): Privat 15, Företag 30, BRF 80.** Hold-to-repeat on +/− after 300ms initial delay (within motion budget).

### 5.4 Brinntid (`#inBrinntid` range)

`accent-color:var(--action-primary); min-height:44px; step:0.5; min:0; max:24.` Live value in label: `Brinntid: <span class="range-val" id="brinntidVal">11 h/dygn</span>` where `.range-val{ font-weight:var(--fw-semibold); color:var(--action-primary-text); }`. Tiny scale under track: `0 h … 24 h` in `--fs-xs var(--text-secondary)`.

**Defaults driven by the kontext selection (graft the research data, not flat per-segment guesses):**
- Privat — Hem/vardagsrum (primär): **4 h**; Hem/hela bostaden (per lampa): **2,5 h**. Default kontext = vardagsrum → **4 h**. (Replaces the absurd 2 h.)
- Företag — Kontor **7 h**; Butik **10 h**; Lager (enkelskift) **8 h**; Verkstad/industri (2-skift) **14 h**. Default = Kontor → **7 h**.
- BRF — Trapphus alltid på **11 h**; Trapphus m. sensor **3 h**; Garage/förråd utan styrning **24 h**; Tvättstuga/gemensamt **6 h**. Default = Trapphus alltid på → **11 h**.

All h/dag are 365-day averages — engine must NOT double-count against ×365.

### 5.5 Elprisområde (`#inElomrade`) — KEEP (req. 11), now the SOLE price control

Options unchanged (`SE1 — Luleå (norra)` … `SE4 — Malmö (södra)`). Selecting a zone sets that zone's standard price internally. Helper micro-line below (replaces the deleted faktura hint), `.hint` `--fs-xs var(--text-secondary)`:
> `Vi använder ett medvetet lågt schablonpris för din elprisområde — din verkliga besparing blir snarare högre.`

### 5.6 REMOVE entirely (req. 12): the `#inElpris` slider, `#elprisVal`, and its `.hint`. Delete markup + wiring. Price derives solely from SE1–SE4.

---

## 6. TRANSPARENCY / HONESTY (redesigned — three distinct components)

Replace the vol.2 blob. Group sits at the bottom of the right card, separated by `border-top:1px solid var(--border-default); margin-top:var(--spacing-xl); padding-top:var(--spacing-lg);` Internal spacing between the three pieces: `var(--spacing-lg)`.

```html
<div class="transparency-group">
  <details class="breakdown" id="breakdown">
    <summary>Så har vi räknat<span class="chev" aria-hidden="true"></span></summary>
    <div class="formula" id="formula"></div>
    <table><tbody id="breakdownRows"></tbody></table>
    <p class="avdrag" id="avdragCopy"></p>
  </details>
  <p class="context is-hidden" id="lysrorContext"></p>
  <div class="honesty">
    <strong>Försiktig uppskattning.</strong>
    <span> Vi räknar med ett lågt elpris och konservativa antaganden, så att siffran håller — inte för att den ska imponera.</span>
  </div>
</div>
```

### 6.1 `<details>` "Så har vi räknat" (collapsed by default)
- `summary`: `cursor:pointer; font-weight:var(--fw-semibold); font-size:var(--fs-xs); padding:var(--spacing-sm) 0; list-style:none; display:flex; align-items:center; justify-content:space-between;` `.chev` is a small chevron rotating 90° on `[open]` via `transition:transform var(--motion-fast);`
- **Formula** (`.formula`): JetBrains Mono on `--bg-subtle`, `border-radius:var(--radius-md); padding:var(--spacing-md); font-size:var(--fs-xs); line-height:1.7; overflow-x:auto;` operators `.op{color:var(--text-secondary)}`, result `.res{color:var(--action-primary-text); font-weight:var(--fw-bold)}`. String:
  > `antal × W sparat × h/dygn × 365 ÷ 1000 × elpris = kr/år`
- **Table** (assumption → value, scannable ledger): `width:100%; border-collapse:collapse; margin-top:var(--spacing-sm);` rows `td{ padding:var(--spacing-xs) 0; border-bottom:1px solid var(--border-default); font-size:var(--fs-xs);}` left `color:var(--text-secondary)`, right `text-align:right; font-weight:var(--fw-medium); color:var(--text-primary); font-variant-numeric:tabular-nums;` Rows (engine fills resolved values): `Elprisområde`, `Watt före`, `Watt efter (LED)`, `Brinntid`, `Antal`, `Drifttid per år`. Generous row padding = not blurry.
- **Avdrag clause** (`.avdrag`, segment-aware, `--fs-xs var(--text-secondary)`, `margin-top:var(--spacing-sm)`):
  - Företag/BRF: `Inga avdrag eller bidrag är inräknade — din kostnad kan bli lägre.`
  - Privat: `Vi räknar inte med ROT eller andra avdrag — din kostnad kan bli lägre.`
  - (No false ROT/green deductions — doctrine.)

### 6.2 Lysrör callout (`.context`, Företag & BRF only; `is-hidden` for Privat)
`font-size:var(--fs-xs); color:var(--text-secondary); padding-left:var(--spacing-md); border-left:3px solid var(--state-warning);` dated source in `title` attr. Copy (human, dated):
> `Visste du? Nya lysrör säljs inte längre — EU förbjöd försäljning av T8- och T5-lysrör 2023. Att byta nu är ofta billigare än att vänta.`

### 6.3 Honesty line (`.honesty`, all segments)
`background:var(--bg-subtle); border-radius:var(--radius-md); padding:var(--spacing-sm) var(--spacing-md); font-size:var(--fs-xs); color:var(--text-secondary);` `strong{color:var(--text-primary); font-weight:var(--fw-medium);}` Final string (graft from D3, exact):
> **Försiktig uppskattning.** Vi räknar med ett lågt elpris och konservativa antaganden, så att siffran håller — inte för att den ska imponera.

---

## 7. STATES

- **Default (load):** segment BRF; kontext "Trapphus alltid på"; typ "Lysrörsarmatur 2×36 W T8"; antal 80; brinntid 11 h; elprisområde SE3. Hero shows a real computed number immediately (no empty state, no email wall).
- **Empty / antal = 0:** hero number renders `0 kr/år`, stat tiles `0 kWh` / `0 kg` (or `0 kr/mån` Privat); button stays enabled; no error. (Honesty: a zero is honest.)
- **"Out of zone" / no SE selected:** not possible — SE always has a value (defaults SE3); if engine ever receives an unknown zone, fall back to SE3 standard price and render normally (no error UI).
- **Loading:** none — data is inlined (`data.js`), no client fetch; first paint is the computed BRF result.
- **Recompute:** `#resultLive` is the single `aria-live="polite" aria-atomic="true"` region announcing the result once per change.
- **Reduced motion:** existing `prefers-reduced-motion` guard collapses all transitions to 0.01ms — keep it.

---

## 8. MICRO-INTERACTIONS (all ≤300ms)
- Hero number + stat value recompute: `opacity` 0.4→1 over `--motion-fast`; tabular-nums (no width jump). No count-up.
- Segment switch: pill `background`/`color` `--motion-fast`; caption + CTA label + hero label crossfade `--motion-fast`.
- CTA button: `filter:brightness()` `--motion-fast` (hover .94 / active .88).
- `<details>` chevron rotate 90° `--motion-fast`; panel height not animated (native disclosure — calm, no jank).
- Stepper hold-to-repeat: 300ms initial delay.
- Slider thumb: `accent-color` only.
- Focus rings: instant.

---

## What makes this world-class, not Pols

A Pols-verktyg shows *everything it computed*; this shows *one number and proves it on request*. The craft is in subtraction with intent: one 700-weight figure, one teal glyph, one button, one warning accent, one success tab — each scarce mark earns its place, so the page reads in a single squint. Honesty is built into the form, not bolted on: conservative defaults sourced from real research, a scannable ledger instead of a blurry blob, the avdrag truth stated plainly, CO₂ scoped to ESG residual-mix and structurally swapped to kr/månad for households so the doctrine can't be violated by accident. The warmth (sentence-case, plainspoken Swedish, the segment caption, navy-bound toggle) keeps it human rather than clinical. That combination — radical restraint + sourced honesty + human voice, all on a strict token system — is the Jony-Ive register the owner asked for.

---

## BUILD CHECKLIST

**index.html**
- [ ] Delete page-top `.seg-toggle`; recreate it as first child of the right card, order BRF/Företag/Privatperson, `aria-pressed="true"` on BRF; add `.seg-caption`.
- [ ] Delete `#framing`.
- [ ] Replace `.trio` + `.co2-row` with `.hero-stats` (two `.stat-tile`s: `#statKwh`, `#statB`+`#statBKey`); rename label to `.hero-label`; add `.hero-unit` span with " kr/år".
- [ ] Gut `.cta-zone` → `.cta-card` containing only `#ctaBtn`; delete `#ctaTitle`,`#ctaSub`,`#ctaAssurance`,`#leadForm`,`#leadDone`,`.share-row`,`#shareBtn`,`#shareCard`.
- [ ] Remove `.eyebrow` "Dina värden"; keep `.section-title`.
- [ ] Expand `#inTyp` to segment-filtered `<optgroup>`s from research catalog with `data-` watt/cost attrs.
- [ ] Delete `#inElpris` field (slider + `#elprisVal` + its hint); add SE-zone `.hint` micro-line.
- [ ] Wrap transparency in `.transparency-group`: `<details>` (formula + table + `.avdrag`) + `.context` lysrör + `.honesty`; insert final Swedish strings from §6; add `.chev`.

**styles.css**
- [ ] Grid → `1.15fr 1fr`, `gap:var(--spacing-2xl)`; left column flex stack `row-gap:var(--spacing-lg)`.
- [ ] `.ampy-led` padding → `--spacing-xl`; ≤480 → `--spacing-md`.
- [ ] Toggle: remove `max-width:480px`; resting weight `--fw-medium`; selected navy fill; `min-height:36px`; add `.seg-caption`.
- [ ] Hero: padding `--spacing-2xl`; `.hero-number` `--fs-4xl`→`--fs-3xl`, add `font-variant-numeric:tabular-nums`; `.hero-unit` → teal `--action-primary`, `--fs-md`; `::before` accent → `--state-success`, `2px`, `left:var(--spacing-2xl); width:48px`; `.hero-label` sentence-case (remove `text-transform:uppercase`); new `.hero-stats` 2-up grid + `.stat-tile`.
- [ ] CTA: `.cta-zone`→`.cta-card` white panel; button → `--fs-sm`, `min-height:48px`, `max-width:360px`, `filter:brightness()` hover; delete `.btn-ghost`, lead-form, share, `.cta-zone.outside` styles.
- [ ] Fields: `.field` margin `--spacing-lg`; remove `#inElpris`-specific rules.
- [ ] Transparency: `.transparency-group` top rule; summary flex + `.chev` rotate; keep `.formula`/table styling (add tabular-nums to value column); `.avdrag`; `.honesty` final copy.
- [ ] ≤400px: `.hero-unit{display:block;margin-left:0}`. ≤480px: CTA button full width, hero stats `gap:var(--spacing-sm)`.

**data.js / engine.js / app.js**
- [ ] Default segment BRF; defaults antal 80/30/15, brinntid via kontext (BRF trapphus 11 / Företag kontor 7 / Privat vardagsrum 4) with full per-kontext table from research.
- [ ] Populate `#inTyp` from segment-filtered research catalog (`foretag_brf` → both); set per-segment default option.
- [ ] Block B swap: CO₂ (`ton`/`kg`, ESG residual-mix label) for BRF/Företag; kr/månad (annual ÷ 12, key "i månaden") for Privat — never CO₂ for Privat.
- [ ] Segment-set: `.hero-label`, `.seg-caption`, `#ctaBtn` label, `.avdrag` clause, `#lysrorContext` visibility (Företag/BRF only).
- [ ] Remove all `#inElpris` wiring; price strictly from SE-zone standard; SE hint text uses selected zone.
- [ ] Formula/table rows render resolved values; keep single `aria-live` announce; engine must not double-count 365-day-average brinntid.

**QA gates**
- [ ] No raw hex/px in UI CSS; every font-size via clamp tokens; one primary button per section; no card-in-card; sentence case throughout.
- [ ] 360px: hero number + "kr/år" fit (unit wraps <400px); stat tiles stay 2-up; toggle one row.
- [ ] Privat never renders CO₂; CO₂ label always reads "nordisk residualmix (ESG)".
- [ ] No payback, no 10-year, no framing sentence, no share/lead-form/assurance present in DOM.

Relevant files (absolute): `/Users/juliuscallahan/Desktop/Claude Code/led-kalkylatorn/index.html`, `/Users/juliuscallahan/Desktop/Claude Code/led-kalkylatorn/styles.css`, `/Users/juliuscallahan/Desktop/Claude Code/led-kalkylatorn/data.js`, `/Users/juliuscallahan/Desktop/Claude Code/led-kalkylatorn/engine.js`, `/Users/juliuscallahan/Desktop/Claude Code/led-kalkylatorn/app.js`.