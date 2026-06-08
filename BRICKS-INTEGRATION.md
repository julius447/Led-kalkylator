# LED-kalkylatorn — integration i WordPress / Bricks

Verktyget är **ren HTML + CSS + vanilla JS** utan runtime-beroenden (all data är inlinad i `data.js`). Det är byggt för att bäddas in i Bricks utan att påverka resten av sidan.

## Filer
| Fil | Roll | Hur den läggs in i Bricks |
|-----|------|---------------------------|
| `styles.css` | Widgetens stil (allt scopat under `.ampy-calc`) | Enqueue som stylesheet, **eller** klistra in i Bricks › Settings › Custom CSS. |
| `data.js` | Datalager (priser, watt, brinntid, copy) | Enqueue som skript (1:a) |
| `engine.js` | Ren beräkningsmotor | Enqueue som skript (2:a) |
| `app.js` | Renderare + interaktion | Enqueue som skript (3:e) |
| HTML-blocket | Markupen (`<div class="ampy-calc" …>`) | Klistra in i ett **Code**-element på sidan |

**Skriptordning är viktig:** `data.js` → `engine.js` → `app.js`. Lägg dem i sidfoten (`wp_enqueue_script(..., true)`). `app.js` initierar sig själv oavsett om DOM redan är laddad (den kollar `document.readyState`), så den fungerar även när Bricks injicerar sent.

## Designsystem-bas (enda hårda kravet)
Verktyget använder samma bas som **batterikalkylatorn**: `html { font-size: 62.5% }` (1 rem = 10 px). Den raden sätts **inte** av `styles.css` (för att inte påverka resten av WordPress-sidan) — den måste finnas globalt på sidan. På Ampys site finns den redan (batterikalkylatorn kräver den). Om den saknas på en specifik mall, lägg till i temats globala CSS:
```css
html { font-size: 62.5%; }
```
Utan den renderas verktyget 1,6× för stort.

## Koppla offertförfrågan (lead)
Sätt `lead.endpoint` i `data.js` till en riktig POST-URL. Tills dess används **mailto-fallback** (`lead.fallback_mailto`, just nu `offert@ampy.se`) så inga leads tappas.

```js
// data.js
lead: { endpoint: "/wp-json/ampy/v1/led-offert", fallback_mailto: "offert@ampy.se" },
```

Verktyget POST:ar JSON: `{ namn, epost, telefon, postnummer, segment, typ_id, antal, timmar_dag, elprisomrade, arlig_besparing, uppskattad_kostnad, samtycke, samtycke_tid }`.

Exempel på WordPress REST-handler (i temats `functions.php` eller en liten plugin) — skickar mejl och/eller skriver till valfritt CRM:
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
      // enkel anti-spam + sanering
      $namn  = sanitize_text_field($d['namn']);
      $epost = sanitize_email($d['epost']);
      if (!is_email($epost)) return new WP_REST_Response(['ok' => false], 400);

      $body = "Ny LED-offertförfrågan\n\n"
            . "Namn: $namn\nE-post: $epost\n"
            . "Telefon: " . sanitize_text_field($d['telefon'] ?? '') . "\n"
            . "Postnr: "  . sanitize_text_field($d['postnummer'] ?? '') . "\n\n"
            . "Segment: " . sanitize_text_field($d['segment'] ?? '') . "\n"
            . "Antal: "   . intval($d['antal'] ?? 0) . " × " . sanitize_text_field($d['typ_id'] ?? '') . "\n"
            . "Årlig besparing: " . intval($d['arlig_besparing'] ?? 0) . " kr/år\n"
            . "Uppskattad kostnad: " . intval($d['uppskattad_kostnad'] ?? 0) . " kr\n"
            . "Samtycke: " . sanitize_text_field($d['samtycke_tid'] ?? '');

      wp_mail('offert@ampy.se', 'LED-offert – ' . $namn, $body, ['Reply-To: ' . $epost]);
      // TODO: lägg även till i ert CRM här om ni vill.
      return new WP_REST_Response(['ok' => true], 200);
    },
  ]);
});
```
Returnera **HTTP 200** vid lyckat och **4xx/5xx** vid fel — verktyget visar då rätt tack-/felmeddelande automatiskt (och låser knappen mot dubbel-submit).

> GDPR: formuläret kräver aktivt samtycke (omarkerad ruta) + länk till integritetspolicyn, och skickar `samtycke: true` + `samtycke_tid` (ISO-tidsstämpel) i payloaden.

## Bricks-säkerhet (redan löst i koden)
- **Inga globala stilar läcker:** all CSS är scopad under `.ampy-calc` (inkl. `.sr-only`/`.is-hidden`); `html`/`body` rörs inte av widget-CSS:en.
- **Inga ID-krockar:** JS slår upp element *inom* widgeten (`.ampy-calc`), inte globalt — andra element/formulär på sidan med samma id påverkas inte. (Kör dock helst **en** instans per sida.)
- **Inga runtime-beroenden:** data är inlinad, inga API-anrop i drift utom själva lead-POST:en (med mailto-fallback) och Google Fonts-`@import` (faller tillbaka på system-typsnitt om otillgängligt). Vill ni ha maximal prestanda/oberoende: self-hosta typsnitten och ta bort `@import`.

## Drift / uptime
Verktyget är **statiskt** (ingen server­logik som kan krascha). Upptid = er webbhotells/CDN:s upptid för sidan. Det enda dynamiska är offert-POST:en — failar den (eller saknas endpoint) fångas leadet ändå via mailto-fallback, och beräknaren fortsätter fungera. Inget i verktyget kan ta ner sidan eller sluta räkna.

## Embed-preset per belysningssida
`data-sida`-attributet på rot-elementet styr förvalt läge (segment/typ/kontext) via `embed_preset` i `data.js`: `belysning`, `inomhusbelysning`, `utomhusbelysning`, `spotlight`, `armaturer`. Sätt rätt värde per sida där verktyget bäddas in.
