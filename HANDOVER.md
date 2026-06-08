# LED-kalkylatorn — Developer Handover (Chris + AI agent)

**Read this first. It is the single source of truth.** Everything you need to ship the tool into Bricks/WordPress is here: files, exact data, formulas, the one thing to wire (the lead endpoint), copy-paste PHP, the QA checklist, and a precise task list for your Claude Code agent.

- **Live reference (must look/behave identical after embed):** https://julius447.github.io/Led-kalkylator/
- **Repo:** https://github.com/julius447/Led-kalkylator
- **Stack:** plain HTML + CSS + vanilla JS. No build step, no framework, no runtime dependencies. (One `@import` for Google Fonts; one optional `fetch` for the lead POST.)

---

## 0. TL;DR — ship it in 6 steps

1. Confirm the page has the design-system base `html{font-size:62.5%}` (Ampy's battery calculator already requires it — see §3).
2. Paste the **HTML** (`index.html` `<body>` inner markup, the `<div class="ampy-calc" …>` block) into a Bricks **Code** element.
3. Enqueue **`styles.css`**, then **`data.js` → `engine.js` → `app.js`** (in that order, in the footer).
4. Set `data.lead.endpoint` to your POST URL (§5) and add the PHP handler (§5). Until then a mailto fallback to `offert@ampy.se` is active — no lead is lost.
5. Set the `data-sida` attribute per page (§8) so the right preset loads.
6. Run the QA checklist (§13). Done.

There is **no database, no cron, no server logic** inside the tool. It cannot "go down" — uptime equals your page's uptime (§9).

---

## 1. What the tool is

A Swedish lead-magnet calculator: a visitor picks what light source they have, how many, where it sits, and their electricity zone; the tool instantly shows the **annual saving (kr/år)** of switching to LED, the energy cut, the CO₂ saved (companies/BRF only), the estimated cost, and a today-vs-LED cost comparison — then offers a tailored quote (lead capture). Three audiences: **BRF** (default), **Företag**, **Privat**.

Core doctrine (do not break): **honesty = the moat.** Conservative numbers, transparent math under "Så har vi räknat", no false tax deductions, the full answer is free with no wall before it, and CO₂ is **never** shown to private persons.

---

## 2. Files (5-layer architecture)

| File | Layer | Responsibility | You edit it to… |
|------|-------|----------------|-----------------|
| `data.js` | Data | ALL business data: prices, watt table, burn-hours, defaults, copy, presets. Zero logic. | change any number/price/text |
| `engine.js` | Engine | Pure `calculate(inputs, data)` → results. Zero hard-coded numbers. Validates the data on first run. | (rarely; the math) |
| `app.js` | Renderer/UI | Builds controls, renders results, handles the slider/dropdown/tooltip/lead form, analytics. | (rarely) |
| `index.html` | Shell | The markup + page-level base style. Data inlined, no fetch for data. | structure |
| `styles.css` | Style | All styling, scoped under `.ampy-calc`. Design tokens + components. | look & feel |

**Golden rules:** rounding happens only in the renderer (`app.js`); all business data lives only in `data.js`; the engine throws a clear error if `data.js` is malformed (so a typo can't silently produce a wrong number).

Other docs (context, not needed to implement): `research-dossier.md` (provenance of every number + the sign-off checklist), `qa-invariant-checklista.md`, `distribution-meta.md`, `VOL2-PLAN.md`/`VOL3-SPEC.md` (historical design specs).

---

## 3. The one hard requirement: `html { font-size: 62.5% }`

The whole tool uses `rem` with **1rem = 10px**, exactly like Ampy's battery calculator. That base is set **by the page/theme, not by `styles.css`** (so the widget never imposes global styles on the rest of your WordPress site). The standalone demo sets it in `<head>`:
```html
<style>html{font-size:62.5%}body{margin:0}</style>
```
Ampy's site already has `html{font-size:62.5%}` globally (the battery calc depends on it). **Verify it is present on the LED page.** If a specific template lacks it, add it to the theme's global CSS. *Symptom if missing: the whole tool renders ~1.6× too large.*

`styles.css` is otherwise 100% scoped under `.ampy-calc` (incl. `.sr-only`/`.is-hidden`), so it won't leak into the theme.

---

## 4. Enqueue (the only "code" you write besides PHP)

Order matters: `data.js` → `engine.js` → `app.js`. Footer load is fine — `app.js` self-inits whether the DOM is already parsed or not.

```php
add_action('wp_enqueue_scripts', function () {
  // Load only on pages that contain the calculator (adjust the condition):
  if (!is_page(['led-kalkylatorn','belysning','armaturer'])) return;
  $base = get_stylesheet_directory_uri() . '/ampy-led';
  $ver  = '1.0.0';
  wp_enqueue_style ('ampy-led',        "$base/styles.css", [], $ver);
  wp_enqueue_script('ampy-led-data',   "$base/data.js",    [],                 $ver, true);
  wp_enqueue_script('ampy-led-engine', "$base/engine.js",  ['ampy-led-data'],  $ver, true);
  wp_enqueue_script('ampy-led-app',    "$base/app.js",     ['ampy-led-engine'],$ver, true);
});
```
Put the four files in `wp-content/themes/<your-child-theme>/ampy-led/`. Then paste the markup (the `<div class="ampy-calc" id="ampyLed" data-sida="…">…</div>` from `index.html`) into a Bricks **Code** element on the page.

*Alternative:* you can also inline everything into one Bricks Code element (CSS in `<style>`, the three scripts in `<script>` in order). The enqueue route above is cleaner and cacheable.

---

## 5. Wire the lead endpoint (the ONLY thing that needs a backend)

In `data.js`:
```js
lead: { endpoint: "/wp-json/ampy/v1/led-offert", fallback_mailto: "offert@ampy.se" },
```
While `endpoint` is `null`, the form opens the user's mail client (mailto) with the full lead + scenario, so **no lead is ever lost** even before the backend exists.

The form POSTs JSON:
```json
{ "namn","epost","telefon","postnummer","segment","typ_id","antal","timmar_dag",
  "elprisomrade","arlig_besparing","uppskattad_kostnad","samtycke","samtycke_tid" }
```
All four contact fields are **required** and a GDPR consent checkbox is **required** (sends `samtycke:true` + ISO `samtycke_tid`).

Ready-to-paste WordPress REST handler (theme `functions.php` or a small plugin):
```php
add_action('rest_api_init', function () {
  register_rest_route('ampy/v1', '/led-offert', [
    'methods'  => 'POST',
    'permission_callback' => '__return_true',
    'callback' => function (WP_REST_Request $req) {
      $d = $req->get_json_params();
      if (empty($d['namn']) || empty($d['epost']) || empty($d['samtycke'])) {
        return new WP_REST_Response(['ok' => false], 400);
      }
      $namn  = sanitize_text_field($d['namn']);
      $epost = sanitize_email($d['epost']);
      if (!is_email($epost)) return new WP_REST_Response(['ok' => false], 400);
      $body = "Ny LED-offertförfrågan\n\n"
        . "Namn: $namn\nE-post: $epost\n"
        . "Telefon: "  . sanitize_text_field($d['telefon']    ?? '') . "\n"
        . "Postnr: "   . sanitize_text_field($d['postnummer'] ?? '') . "\n\n"
        . "Segment: "  . sanitize_text_field($d['segment']    ?? '') . "\n"
        . "Antal: "    . intval($d['antal'] ?? 0) . " × " . sanitize_text_field($d['typ_id'] ?? '') . "\n"
        . "Brinntid: " . floatval($d['timmar_dag'] ?? 0) . " h/dygn, område " . sanitize_text_field($d['elprisomrade'] ?? '') . "\n"
        . "Årlig besparing: "    . intval($d['arlig_besparing'] ?? 0)   . " kr/år\n"
        . "Uppskattad kostnad: " . intval($d['uppskattad_kostnad'] ?? 0) . " kr\n"
        . "Samtycke: "  . sanitize_text_field($d['samtycke_tid'] ?? '');
      wp_mail('offert@ampy.se', 'LED-offert – ' . $namn, $body, ['Reply-To: ' . $epost]);
      // TODO: push to your CRM here if desired.
      return new WP_REST_Response(['ok' => true], 200);
    },
  ]);
});
```
Return **HTTP 200** on success and **4xx/5xx** on failure — the tool shows the correct thank-you/error and prevents double-submit automatically.

---

## 6. The data contract — every number, and how to change it (`data.js`)

> The engine reads everything from here. To change a price, a watt value, a default, or any copy, edit `data.js` only. The engine **validates** the structure on load and throws a clear error (visible in the result area + console) if something is wrong — so you'll never silently ship a bad number.

### Electricity price (`elpris`, kr/kWh incl. VAT, the only price source)
`SE1 1.35 · SE2 1.40 · SE3 1.65 · SE4 1.85 · nationellt_default 1.50`. Deliberately conservative (low) schablon — real bills are usually higher, so the saving is understated, not overstated. The SE-zone segmented control is the **only** price control (there is intentionally no editable kr/kWh field).

### Segment config (`segments`)
| segment | betalar_installation | visa_co2 |
|---|---|---|
| brf | true | true |
| foretag | true | true |
| privat | **false** | **false** (CO₂ → kr/month instead) |

(Note: `betalar_installation` is legacy; cost is now the per-unit `kostnad_kr`, see below. CO₂ visibility is the live use of `visa_co2`.)

### Pricing (`watt_tabell[].kostnad_kr`) — total price per unit incl. installation
Confirmed by Ampy's bookers/electricians:
- **Företag/BRF (fluorescent fixtures):** 1000–2000 kr/armature, **ex VAT**, installation incl.
- **Privat (mostly halogen-spot → LED-spot):** 500–1000 kr/light source, **incl. VAT, after ROT** (Ampy always installs; no DIY).
- **High-bay/outdoor** (metal-halide, HPS, mercury) sit above the fluorescent range (2300–3500 kr) because the fixtures cost more.

### Light-source catalog (`watt_tabell`) — 27 entries
Each: `id, namn, kat ("privat" | "kommersiell"), grupp (optgroup), w_gammal, w_led, lumen, kostnad_kr`. `kat` decides which segment sees it (privat → privat items; företag & brf → kommersiell items). Watt deltas drive the saving; LED-side wattages are conservative (not too low). Defaults: privat → `gu10_50`; företag/brf → `t8_2x36` (the commercial core case, 82→34 W, 1500 kr).

### Burn-hours (`brinntid_default`, h/dygn, 365-day average)
"Snitt brinntid" is the default per segment (an average across rooms): **BRF 12 · Företag 9 · Privat 5**. Other contexts: BRF trapphus utan styrning 24 / med sensor 4 / garage 24 / tvättstuga 6; Företag kontor 9 / butik 12 / lager 14 / verkstad 16; Privat vardagsrum 5 / hela bostaden 6. **These are 365-day averages — never multiply by ×365 twice** (the engine already does ×365).

### CO₂ factor (`co2_faktor.g_per_kwh = 464.79`)
Nordic residual mix, market-based (Scope 2 / ESG), reporting year 2024 (Energimarknadsinspektionen, via Grexel). **Only ever shown for Företag/BRF**, labelled "jämfört med nordisk elmix"; the precise term lives in "Så har vi räknat". Re-verify when Ei publishes 2025 (June 2026).

### Defaults (`defaults[segment]`)
antal (BRF 80 / Företag 30 / Privat 15), default typ_id & kontext, the `antal_slider` range+ticks, the segment caption, `enhet_namn` (armaturer/ljuskällor), `cta_text`. **Horizon** `horisont_ar = 10` (used internally; payback is computed but deliberately not surfaced prominently).

### Copy that lives in data
`avdrag_copy` (per-segment VAT/ROT note in "Så har vi räknat"), `lysror_fakta` (the EU fluorescent-ban hook), segment captions, CTA text. UI labels/tooltips live in `index.html`.

### Embed presets (`embed_preset`) — see §8.

---

## 7. The engine — exact formulas (`engine.js`, `calculate(inputs, data)`)

All in full precision; the renderer rounds.

```
W_saved      = max(0, w_gammal − w_led)
kWh/år       = (W_saved / 1000) × h_per_dygn × 365 × antal
elpris       = inputs.kr_kwh (if >0) else elpris[zone] else nationellt_default
Årlig besparing (kr/år) = kWh/år × elpris
Energi du kapar (kWh/år) = kWh/år
% lägre       = kWh/år ÷ (W_gammal/1000 × h × 365 × antal)   [same % as the today-vs-LED bars]
CO₂ (kg/år)   = kWh/år × 464.79 / 1000          [Företag/BRF only]
Per-unit cost = kostnad_kr (from the chosen light source)
Uppskattad kostnad = Per-unit cost × antal
Payback (år)  = total cost ÷ årlig besparing     [computed; not shown prominently]
cumulative[y] = årlig besparing × y − total cost  (y = 0…10)   [for completeness]
Today's annual cost = (w_gammal/1000 × h × 365 × antal) × elpris
LED annual cost     = (w_led   /1000 × h × 365 × antal) × elpris
```
Worked example (BRF default = 80 × `t8_2x36` 82→34 W, 12 h, SE3 1.65):
kWh/år = 48/1000 × 12 × 365 × 80 = **16 819** → × 1.65 = **27 752 kr/år**; CO₂ = 16 819 × 0.46479 = **7.8 ton**; cost = 80 × 1500 = **120 000 kr**. Today 47 409 kr vs LED 19 657 kr → **59 % lower**. These exact numbers must appear after embed.

`engine.test.js` (run `node engine.test.js`) asserts all of this — **31 tests, must stay green** after any data/engine change.

---

## 8. Behaviour & embed presets

- Opens on **BRF** by default. Segment toggle (BRF/Företag/Privat) is the first control in the right… *(in this single-column-aware layout the toggle is at the top of the controls)*. Switching segment resets type/count/context/burn-hours to that segment's defaults and resets the lead form.
- **`data-sida`** on the root `<div class="ampy-calc" data-sida="…">` picks an embed preset (segment + type + context). Map per page:
  `belysning` → BRF/T8/Snitt · `inomhusbelysning` → Företag/T8/Kontor · `utomhusbelysning` → BRF/HPS/Garage · `spotlight` → Privat/GU10/Snitt · `armaturer` → Företag/T8/Lager. Unknown/absent value → defaults (BRF).
- Privat never shows CO₂ (shows "Per månad" = årlig ÷ 12 instead). Privat copy says "Ampy installerar" (no DIY).

---

## 9. Uptime, cross-platform & iOS (why it's robust)

- **Static = inherent uptime.** No DB/cron/server logic in the tool. All data is inlined in `data.js`. The only network calls are the lead POST (graceful fail + retry + mailto fallback) and the Google-Fonts `@import` (falls back to `system-ui` if unreachable). Nothing in the tool can break the page or stop the calculator. **Uptime = your hosting/CDN uptime.** *(Tip for max independence: self-host the 3 fonts and drop the `@import`.)*
- **iOS / touch:** the custom slider uses Pointer Events with `touch-action:none`, disables the thumb transition during drag (tracks the finger 1:1), `-webkit-tap-highlight-color:transparent`, `overscroll-behavior:contain`, and a global drag-end on blur/visibilitychange (so an interrupted iOS drag can't get stuck). Tooltips show on a single tap. Tap targets ≥ ~44px.
- **Cross-browser:** Pointer Events, `Intl.NumberFormat`, `clamp()`, CSS custom properties — all supported in current Safari/Chrome/Firefox/Edge (desktop + mobile). `sessionStorage` is wrapped in try/catch (Safari private mode safe).
- **No layout overflow** at 320–390px (verified); fluid type scale grows tastefully on desktop and holds a legible mobile minimum.
- **ID-collision safe:** `app.js` looks up elements **inside** the widget (`.ampy-calc`), not document-wide — other elements/forms on the Bricks page with the same id are unaffected. Run **one** instance per page.

---

## 10. GDPR / legal
The lead form: required GDPR consent checkbox + link to `https://ampy.se/integritetspolicy` (update if the slug differs), sends `samtycke:true` + ISO timestamp. No data is stored client-side except a non-PII analytics `meta` object in `sessionStorage`. Update the privacy-policy URL in `index.html` if needed.

## 11. Analytics (Google Tag Manager / `dataLayer`)
The tool pushes events to `window.dataLayer` (prefixed `led_`), each merged with UTM/referrer/embed-page meta:
`led_calc_view`, `led_segment_byte`, `led_berakning` (savings bucketed, never exact kr), `led_cta_klick`, `led_lead_submit`, `led_lead_error`, `led_calc_error`. Wire these in GTM for funnel/retargeting. No extra code needed.

## 12. Accessibility (already implemented)
Scoped `aria-live` result summary (one calm announcement per settle, no animation spam), labelled custom slider (role/valuenow/valuetext/keyboard), info tooltips whose full text is the button's `aria-label`, dropdown with `aria-expanded`/`aria-controls`/focus return, `role="alert"` + `aria-invalid` form errors, sr-only headings, AA contrast, `prefers-reduced-motion` honored.

---

## 13. QA / acceptance checklist (run before go-live)
- [ ] `html{font-size:62.5%}` is active on the page (tool not 1.6× too big).
- [ ] Scripts load in order data → engine → app; no console errors.
- [ ] BRF default shows **27 752 kr/år**, 16 819 kWh, 7,8 ton, 120 000 kr, "59 % mindre" (proves the data/engine are intact).
- [ ] All three segments switch correctly; Privat shows **no CO₂** (shows kr/month) and "inkl moms efter ROT".
- [ ] Slider is smooth on a real iPhone (Safari) and Android; no page scroll while dragging; ticks tappable.
- [ ] Light-source dropdown opens, groups show, selection updates the result.
- [ ] Tooltips show on a single tap (mobile) and on hover/focus (desktop).
- [ ] Lead form: all 4 fields + consent required; valid submit hits your endpoint (200 → thank-you); failure → error + retry; no double-submit.
- [ ] No horizontal scroll at 320/360/390px; layout intact at desktop.
- [ ] `node engine.test.js` → 31/31 green.
- [ ] Privacy-policy link points to the correct URL.

---

## 14. FOR THE AI AGENT (Claude Code) — precise task list

> Implement the LED calculator into this WordPress/Bricks site **without changing its behaviour, numbers, or formulas**. Treat https://julius447.github.io/Led-kalkylator/ as the pixel/behaviour reference.

**Do, in order:**
1. Copy `styles.css`, `data.js`, `engine.js`, `app.js` into `wp-content/themes/<child-theme>/ampy-led/`. Do **not** modify their contents except where §5/§8 say (the `lead.endpoint` value and the `data-sida` attribute).
2. Add the enqueue snippet from §4 to the child theme's `functions.php` (adjust the `is_page()` condition to the real page slugs).
3. Add the REST handler from §5 to `functions.php` (or a small mu-plugin). Set `data.lead.endpoint` to `/wp-json/ampy/v1/led-offert`.
4. Create/locate the Bricks page; add a **Code** element; paste the `<div class="ampy-calc" id="ampyLed" data-sida="belysning">…</div>` markup from `index.html` (everything inside `<body>` except the `<script>` tags — those are enqueued). Set `data-sida` per §8.
5. Ensure `html{font-size:62.5%}` is in the theme's global CSS (§3); if absent, add it.
6. Update the privacy-policy URL in the markup if the slug differs.

**Hard guardrails — do NOT:**
- change any number in `data.js` (prices, watts, burn-hours, CO₂ factor, defaults) — they are research-backed and conservative;
- change any formula in `engine.js`;
- show CO₂ for Privat, add a fake tax deduction, or gate the result behind the form;
- introduce a build step, a framework, jQuery, or any runtime dependency;
- rename the `.ampy-calc__*` classes or the element IDs (the JS and CSS depend on them);
- set global `html`/`body` rules inside `styles.css`.

**Verify before reporting done (must all pass):**
- `node engine.test.js` → `ALLA GRÖNA — 31 pass, 0 fail`.
- On the rendered page: BRF default == 27 752 kr/år, 16 819 kWh, 7,8 ton, 120 000 kr (matches §7).
- No console errors; no horizontal scroll at 360px; slider smooth on a touch device; lead POST reaches the endpoint and returns 200.
- Run the full §13 checklist and report each item.

**If a value looks wrong:** it almost certainly means `html{font-size:62.5%}` is missing (sizing) or the script order is wrong (blank result / console error) — check those first.

---

## 15. Provenance & the one open item before "signed" go-live
Every number is sourced and dated in `research-dossier.md` (electricity prices, watt equivalences, burn-hours, CO₂ factor, the fluorescent-ban facts, VAT/ROT wording). They are deliberately conservative. The remaining non-technical step (Ampy's, not Chris's): an energy/tax/electrical expert signs off the dossier's checklist, and `data.lead.endpoint` is wired (§5). Neither blocks embedding/testing.

**Questions / single point of contact:** the repo README links the rest. Everything else needed to implement is in this file.
