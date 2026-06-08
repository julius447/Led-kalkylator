# LED-kalkylatorn — Developer Handover (Chris + AI agent)

**Read this first. It is the single source of truth.** Everything you need to ship the tool into Bricks/WordPress is here: files, exact data, formulas, the one thing to wire (the lead endpoint), copy-paste PHP, the QA checklist, and a precise task list for your Claude Code agent.

- **Live reference (must look/behave identical after embed):** https://julius447.github.io/Led-kalkylator/
- **Repo:** https://github.com/julius447/Led-kalkylator
- **Stack:** plain HTML + CSS + vanilla JS. No build step, no framework, no runtime dependencies. (One `@import` for Google Fonts; one optional `fetch` for the lead POST.)

---

## 0. TL;DR — ship it in 6 steps

1. Confirm the page has the design-system base `html{font-size:62.5%}` (Ampy's battery calculator already requires it — see §3).
2. Paste **only** the single `<div class="ampy-calc" id="ampyLed" data-sida="…">…</div>` block from `index.html` into a Bricks **Code** element. Do **not** copy anything from `<head>` or the `<script>` tags (§14).
3. Enqueue **`styles.css`**, then **`data.js` → `engine.js` → `app.js`** (in that order, in the footer).
4. Choose your lead path (§5): **(A)** ship as-is — the form opens the user's mail client to `offert@ampy.se` (no backend), or **(B)** set `data.lead.endpoint` + add the PHP handler. Both lose no lead; pick one and verify it in QA.
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
Ampy's site already has `html{font-size:62.5%}` globally (the battery calc depends on it). **Measure it, don't eyeball it** — on the target page run in the console:
```js
getComputedStyle(document.documentElement).fontSize  // must be "10px"
```
If it returns `"16px"` (or anything else), the base is missing — the tool will render ~1.6× too large. **Only add `html{font-size:62.5%}` globally if the site is not already 62.5%-based** (Ampy's is, so normally you add nothing). If some other site is *not* 62.5%-based, do **not** set it globally — it would rescale every `rem` on the whole site. Scope it to a wrapper instead (e.g. set `font-size:62.5%` on a parent of the widget) and confirm the measurement above reads `10px` at the widget.

`styles.css` is otherwise 100% scoped under `.ampy-calc` (incl. `.sr-only`/`.is-hidden`), so it won't leak into the theme.

---

## 4. Enqueue (the only "code" you write besides PHP)

Order matters: `data.js` → `engine.js` → `app.js`. Footer load is fine — `app.js` self-inits whether the DOM is already parsed or not.

```php
add_action('wp_enqueue_scripts', function () {
  // Load only on the pages that embed the calculator.
  // These five mirror the embed_preset keys in data.js (§8) — adjust to your real slugs:
  if (!is_page(['belysning','inomhusbelysning','utomhusbelysning','spotlight','armaturer'])) return;
  $dir  = get_stylesheet_directory()     . '/ampy-led'; // filesystem path (for filemtime)
  $base = get_stylesheet_directory_uri() . '/ampy-led'; // public URL
  // Cache-bust on every edit: filemtime bumps $ver automatically when a file changes.
  $v = function ($f) use ($dir) { return @filemtime("$dir/$f") ?: '1.0.0'; };
  wp_enqueue_style ('ampy-led',        "$base/styles.css", [],                  $v('styles.css'));
  wp_enqueue_script('ampy-led-data',   "$base/data.js",    [],                  $v('data.js'),   true);
  wp_enqueue_script('ampy-led-engine', "$base/engine.js",  ['ampy-led-data'],   $v('engine.js'), true);
  wp_enqueue_script('ampy-led-app',    "$base/app.js",     ['ampy-led-engine'], $v('app.js'),    true);
});
```
Put the four files in `wp-content/themes/<your-child-theme>/ampy-led/`. Then paste the markup (the `<div class="ampy-calc" id="ampyLed" data-sida="…">…</div>` from `index.html`) into a Bricks **Code** element on the page.

> **Cache-busting:** the `filemtime` trick above re-versions each asset whenever you edit it, so editing `data.js` never serves stale cached JS. If you hard-code a `$ver` string instead, you **must** bump it on every change to any of the four files — otherwise the browser/CDN keeps serving the old version and your `data.js` edit silently does nothing.
>
> Keep all logic in the enqueue + REST handler below; **do not** also inline the scripts in the Bricks Code element (that double-loads `app.js`). The Code element holds the `<div>` markup only.

---

## 5. The lead path — pick (A) mailto or (B) a REST endpoint

The tool ships with `data.lead.endpoint = null`, which means **(A) mailto**: on submit it opens the user's mail client (via a transient `<a target="_blank">`, so it never navigates the host page) pre-filled with the full lead + scenario to `offert@ampy.se`. No backend, nothing to host. The copy is honest ("Ett mejl öppnas i din e-postklient…") because we can't confirm delivery without a server.

**(B) REST endpoint** captures leads server-side (recommended for volume/CRM). Set in `data.js`:
```js
lead: { endpoint: "/wp-json/ampy/v1/led-offert", fallback_mailto: "offert@ampy.se" },
```

> **The endpoint MUST be same-origin** — a relative `/wp-json/…` path. `app.js` sends `Content-Type: application/json`, which triggers a CORS **preflight** on any cross-origin host that the default WP REST route won't answer → every submit fails silently (and there is **no** mailto fallback once `endpoint` is non-null). To forward to an external CRM, do it **server-side** in the PHP callback below; never point `data.lead.endpoint` at a foreign host.

The form POSTs this JSON (all five marked fields are required; the engine echo fields are for your records):
```json
{
  "namn": "Anna Andersson",
  "epost": "anna@example.se",
  "telefon": "070 123 45 67",
  "postnummer": "114 35",
  "samtycke": true,
  "samtycke_tid": "2026-06-08T10:15:00.000Z",
  "company_url": "",
  "segment": "brf",
  "typ_id": "t8_2x36",
  "antal": 80,
  "timmar_dag": 12,
  "elprisomrade": "SE3",
  "arlig_besparing": 27752,
  "uppskattad_kostnad": 120000
}
```
`namn`, `epost`, `telefon`, `postnummer` and `samtycke` are **all required**. `company_url` is a **honeypot** — always empty for real users; a non-empty value means a bot. **The server is the real gate**: client-side validation is advisory and trivially bypassed with `curl`, so re-check every required field server-side.

Ready-to-paste WordPress REST handler (theme `functions.php` or a small mu-plugin):
```php
add_action('rest_api_init', function () {
  register_rest_route('ampy/v1', '/led-offert', [
    'methods'  => 'POST',
    'permission_callback' => '__return_true', // public form; abuse-guarded in the callback
    'callback' => function (WP_REST_Request $req) {
      $d = $req->get_json_params();

      // 1) Honeypot: a filled company_url is a bot — pretend success, send nothing.
      if (!empty($d['company_url'])) return new WP_REST_Response(['ok' => true], 200);

      // 2) Per-IP rate limit: max 5 submits / 10 min.
      $ip  = $_SERVER['REMOTE_ADDR'] ?? '';
      $key = 'ampy_led_' . md5($ip);
      $n   = (int) get_transient($key);
      if ($n >= 5) return new WP_REST_Response(['ok' => false], 429);
      set_transient($key, $n + 1, 10 * MINUTE_IN_SECONDS);

      // 3) Require ALL fields the client requires (client validation is bypassable).
      if (empty($d['namn']) || empty($d['epost']) || empty($d['telefon'])
          || empty($d['postnummer']) || empty($d['samtycke'])) {
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

      // 4) Header-injection guard: strip CR/LF from anything placed in a mail header.
      $reply = str_replace(["\r", "\n"], '', $epost);
      wp_mail('offert@ampy.se', 'LED-offert – ' . $namn, $body, ['Reply-To: ' . $reply]);
      // TODO: push to your CRM here if desired. Never put raw $d[...] into mail headers.
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
| privat | **false** | **false** (no CO₂ — see below) |

For Privat, **no CO₂ value is ever computed**; the middle stat instead shows the **monthly kronor saving** (`arlig_besparing ÷ 12`). (Note: `betalar_installation` is **legacy and read nowhere** by the engine — installation is already baked into the per-unit `kostnad_kr`. Do not build pricing logic on it. `visa_co2` is the only live flag here.)

### Pricing (`watt_tabell[].kostnad_kr`) — total price per unit incl. installation
Confirmed by Ampy's bookers/electricians:
- **Företag/BRF (fluorescent fixtures):** 1000–2000 kr/armature, **ex VAT**, installation incl.
- **Privat (mostly halogen-spot → LED-spot):** 500–1000 kr/light source, **incl. VAT, after ROT** (current catalog spans 550–950); Ampy always installs; no DIY.
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
kWh/år = 48/1000 × 12 × 365 × 80 = **16 819** → × 1.65 = **27 752 kr/år**; CO₂ = 16 819 × 0.46479 = **7 817 kg**; cost = 80 × 1500 = **120 000 kr**. Today 47 409 kr vs LED 19 657 kr → label **"59 % mindre"**. These exact numbers must appear after embed.

> **Renderer formatting is a contract, not a discrepancy.** The engine returns CO₂ in **kg** (here 7 817 kg). The renderer (`app.js`) displays it as **tonnes when ≥ ~1000 kg** — `kg ÷ 1000`, one decimal, Swedish comma — so `7 817 kg → "7,8 ton"`; below ~1000 kg it shows kg. Likewise thousands use a non-breaking space (`27 752`) and the saving label is the literal string `"59 % mindre"`. If you verify against the formulas and get `7 817 kg`, that's correct — the UI just shows `7,8 ton`. Do **not** "correct" the data.

`engine.test.js` (run `node engine.test.js`) asserts all of this — **31 tests, must stay green** after any data/engine change.

---

## 8. Behaviour & embed presets

- Opens on **BRF** by default. Segment toggle (BRF/Företag/Privat) is the first control in the right… *(in this single-column-aware layout the toggle is at the top of the controls)*. Switching segment resets type/count/context/burn-hours to that segment's defaults and resets the lead form.
- **`data-sida`** on the root `<div class="ampy-calc" data-sida="…">` picks an embed preset (segment + type + context). These are the **only** valid `data-sida` values, copied verbatim from `data.js` (`embed_preset`) — the engine matches the `kontext` strings **exactly** (note the em-dash in the garage one), so don't paraphrase them:
  ```js
  embed_preset: {
    "belysning":        { segment: "brf",     typ_id: "t8_2x36",  kontext: "Snitt brinntid" },
    "inomhusbelysning": { segment: "foretag", typ_id: "t8_2x36",  kontext: "Kontor" },
    "utomhusbelysning": { segment: "brf",     typ_id: "hps_150",  kontext: "Garage / förråd — utan styrning" },
    "spotlight":        { segment: "privat",  typ_id: "gu10_50",  kontext: "Snitt brinntid" },
    "armaturer":        { segment: "foretag", typ_id: "t8_2x36",  kontext: "Lager" }
  }
  ```
  An unknown or absent `data-sida` (or a preset whose `typ_id`/`kontext` doesn't fit its segment) safely falls back to that segment's defaults — `applyPreset()` validates before applying. To target another page, **add a key here**; don't invent a `data-sida` value that isn't in this block.
- Privat never shows CO₂ (shows "Per månad" = årlig ÷ 12 instead). Privat copy says "Ampy installerar" (no DIY).

---

## 9. Uptime, cross-platform & iOS (why it's robust)

- **Static = inherent uptime.** No DB/cron/server logic in the tool. All data is inlined in `data.js`. The only network calls are the lead POST (graceful fail + retry + mailto fallback) and the web-font load. Nothing in the tool can break the page or stop the calculator. **Uptime = your hosting/CDN uptime.**
- **Fonts — self-host them (recommended).** `styles.css` currently pulls Plus Jakarta Sans, Outfit and JetBrains Mono via an `@import` from `fonts.googleapis.com`. Two problems: (1) a CSS `@import` is **render-blocking** and fetched after the stylesheet, so on a slow/blocked network the widget paints late or unstyled (it does fall back to `system-ui`, but later than ideal); (2) it sends every visitor's IP to Google **before consent**, a real GDPR concern for a consent-forward Swedish tool. **Preferred:** download the three families (Plus Jakarta Sans 500/600/700, Outfit 400/500/600, JetBrains Mono 500/600/700) as `woff2` into `ampy-led/fonts/`, replace the line-6 `@import` with local `@font-face { … font-display:swap }` rules, and the tool has zero third-party calls. If you keep Google Fonts, at least move it out of `@import` into a `<link rel="stylesheet">` in `<head>` (or let the theme provide the same families) so it isn't render-blocking — but self-hosting is the clean answer.
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
Scoped `aria-live` result summary (one calm announcement per settle, no animation spam), labelled custom slider (role/valuenow/valuetext/keyboard), info tooltips whose full text is the button's `aria-label` and which dismiss on **Escape**, dropdown with `aria-expanded`/`aria-controls`/focus return, form errors that flip the status node to `role="alert"` (errors) / `role="status"` (success, polite) plus `aria-invalid` on the offending field, consent checkbox drawn with `appearance:none` so it stays visible on the dark surface even where `accent-color` is unsupported, sr-only headings, AA contrast, `prefers-reduced-motion` honored.

---

## 13. QA / acceptance checklist (run before go-live)
- [ ] `getComputedStyle(document.documentElement).fontSize` returns **`"10px"`** on the page (tool not 1.6× too big — §3).
- [ ] Scripts load in order data → engine → app; no console errors.
- [ ] BRF default shows **27 752 kr/år**, 16 819 kWh, **7,8 ton**, 120 000 kr, and the bar caption reads **"59 % mindre"** (proves the data/engine are intact).
- [ ] All three segments switch correctly; Privat shows **no CO₂** (shows kr/month) and "· inkl installation".
- [ ] Slider is smooth on a real iPhone (Safari) and Android; no page scroll while dragging; ticks tappable.
- [ ] Light-source dropdown opens, groups show, selection updates the result.
- [ ] Tooltips show on a single tap (mobile), on hover/focus (desktop), and dismiss on Escape.
- [ ] Consent checkbox is clearly visible (a box with a tick) on the dark card — check a budget Android + iOS 15.
- [ ] Lead form: all 5 (name, e-post, phone, postcode, consent) required; junk phone/postcode rejected; no double-submit. Then **either** — **(A) mailto:** submitting opens a mail draft to `offert@ampy.se` containing the full lead, and the host page does **not** navigate away; **(B) endpoint:** a valid submit returns **200** and the thank-you shows; a forced failure shows the error + allows retry.
- [ ] No horizontal scroll at 320/360/390px; layout intact at desktop.
- [ ] `node engine.test.js` → 31/31 green (run from the repo, where `engine.test.js` lives).
- [ ] After any `data.js` edit, the enqueued `$ver` changed and a hard reload shows the new value (no stale cache — §4).
- [ ] Privacy-policy link points to the correct URL.

---

## 14. FOR THE AI AGENT (Claude Code) — precise task list

> Implement the LED calculator into this WordPress/Bricks site **without changing its behaviour, numbers, or formulas**. Treat https://julius447.github.io/Led-kalkylator/ as the pixel/behaviour reference.

**Do, in order:**
1. Copy `styles.css`, `data.js`, `engine.js`, `app.js` into `wp-content/themes/<child-theme>/ampy-led/`. (Run `node engine.test.js` from the **repo**, not the theme folder — the test file stays in the repo.) Do **not** modify the four files' contents except where §5/§8 say (the `lead.endpoint` value and the `data-sida` attribute).
2. Add the enqueue snippet from §4 to the child theme's `functions.php` (adjust the `is_page()` slug list to the real page slugs; it mirrors the five `embed_preset` keys).
3. **Lead path (pick one, §5):** **(A)** leave `data.lead.endpoint = null` — the mailto path is already wired, nothing else to do; **or (B)** add the §5 REST handler to `functions.php` (or a small mu-plugin) and set `data.lead.endpoint` to the same-origin path `/wp-json/ampy/v1/led-offert`.
4. Create/locate the Bricks page; add a **Code** element; paste **only** the single `<div class="ampy-calc" id="ampyLed" data-sida="belysning">…</div>` element from `index.html`. Do **not** paste anything from `<head>` (especially not the inline `<style>html{font-size:62.5%}…</style>`) and do **not** paste the `<script>` tags (they're enqueued in step 2 — pasting them double-loads `app.js`). Set `data-sida` per §8. **Bricks note:** the Code element HTML-escapes its content unless **"Execute code"** (PHP/HTML execution) is enabled and the user has the `bricks_execute_code` capability — if the widget renders as visible `<div…>` angle-bracket text, that toggle is off.
5. Ensure the page measures `getComputedStyle(document.documentElement).fontSize === "10px"` (§3); if not, fix the base per §3 (scope it, don't blanket-set it on a non-62.5% site).
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
- No console errors; no horizontal scroll at 360px; slider smooth on a touch device.
- Lead path works for the option you chose: **(A)** submit opens a mail draft to `offert@ampy.se` and the page stays put; **(B)** a valid submit reaches the endpoint and returns 200.
- Run the full §13 checklist and report each item.

**If a value looks wrong:** it almost certainly means `html{font-size:62.5%}` is missing (sizing) or the script order is wrong (blank result / console error) — check those first.

---

## 15. Provenance & the one open item before "signed" go-live
Every number is sourced and dated in `research-dossier.md` (electricity prices, watt equivalences, burn-hours, CO₂ factor, the fluorescent-ban facts, VAT/ROT wording). They are deliberately conservative. The remaining non-technical step (Ampy's, not Chris's): an energy/tax/electrical expert signs off the dossier's checklist. The lead path can ship on **mailto (A)** with no backend; wiring the REST endpoint **(B, §5)** is an optional upgrade for volume/CRM, not a blocker. Nothing here blocks embedding/testing.

**Questions / single point of contact:** the repo README links the rest. Everything else needed to implement is in this file.
