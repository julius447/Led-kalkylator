/* =============================================================================
   build-snippets.js — deterministisk ompaketering av LED-kalkylatorn
   -----------------------------------------------------------------------------
   Läser de 5 käll-filerna (../styles.css ../data.js ../engine.js ../app.js
   ../index.html) och skriver de 3 Fluent-Snippets-klara leveranserna:

     1-ampy-led-styles.css   ← styles.css VERBATIM + 62.5%-basen
     2-ampy-led-scripts.js   ← data.js + engine.js + app.js VERBATIM, i ordning
     3-ampy-led-shortcode.php ← shortcode som skriver ut EXAKT markup + REST-endpoint

   Poängen: CSS/JS byggs genom REN SAMMANFOGNING av oförändrade källor (ingen
   handskrift → ingen drift). PHP:n injicerar den EXAKTA markupen ur index.html.
   Kör: node build-snippets.js   (från denna mapp). Idempotent.
   ============================================================================= */
"use strict";
var fs = require("fs");
var path = require("path");

var SRC = path.join(__dirname, "..");
var OUT = __dirname;
function read(f) { return fs.readFileSync(path.join(SRC, f), "utf8"); }
function write(f, s) { fs.writeFileSync(path.join(OUT, f), s); console.log("  ✓ " + f + " (" + s.length + " tecken)"); }

var stylesCss = read("styles.css");
var dataJs = read("data.js");
var engineJs = read("engine.js");
var appJs = read("app.js");
var indexHtml = read("index.html");

/* --- 1. CSS ---------------------------------------------------------------- */
// Fluent Snippets "CSS"-snippet. VIKTIGT om ordningen: styles.css inleds (efter
// kommentarer) med en @import för typsnitten. Per CSS-specen måste @import stå
// FÖRE alla stilregler — annars ignoreras den och typsnitten laddas aldrig. Därför
// får vår header vara ren kommentar (kommentarer före @import är OK) och basen
// html{font-size:62.5%} läggs SIST, efter hela styles.css. Källan förblir VERBATIM.
var cssHeader =
"/* ==========================================================================\n" +
"   AMPY LED-KALKYLATOR — SNIPPET 1 av 3: CSS\n" +
"   Klistra in som en Fluent Snippets-snippet av typ 'CSS'.\n" +
"   All KOMPONENT-styling är scopad under .ampy-calc. Filen sätter dessutom två\n" +
"   globala rader: @import för typsnitten (nedan) och 62.5%-basen (sist).\n" +
"   Genererad av build-snippets.js — REDIGERA INTE här; ändra ../styles.css.\n" +
"   ========================================================================== */\n\n";
// Basen läggs SIST så @import förblir första regeln (annars laddas inga typsnitt).
var cssBase =
"\n\n/* --- Designsystemets bas: 1rem = 10px --------------------------------------\n" +
"   Samma bas som Ampys batteri-/EV-kalkylator. ampy.se kör redan detta globalt\n" +
"   (no-op där). Ligger SIST med flit: en stilregel före @import ovan skulle\n" +
"   ogiltigförklara typsnittsimporten. Villkorar du snippeten till bara\n" +
"   kalkylator-sidorna påverkar raden inget annat på sajten. */\n" +
"html { font-size: 62.5%; }\n";
write("1-ampy-led-styles.css", cssHeader + stylesCss + cssBase);

/* --- 2. JS ----------------------------------------------------------------- */
// Fluent Snippets "JS"-snippet (footer). Ordning: data → engine → app.
// data.js sätter window.AMPY_LED_DATA, engine.js sätter window.AmpyLED,
// app.js (IIFE) självinitierar på DOM-ready. Varje del är VERBATIM.
function banner(t) {
  return "\n\n/* ==========================================================================\n" +
         "   " + t + "\n" +
         "   ========================================================================== */\n";
}
var jsHeader =
"/* ==========================================================================\n" +
"   AMPY LED-KALKYLATOR — SNIPPET 2 av 3: JAVASCRIPT\n" +
"   Klistra in som en Fluent Snippets-snippet av typ 'JS' (laddas i sidfoten).\n" +
"   Innehåller data.js + engine.js + app.js sammanfogade i EXAKT denna ordning.\n" +
"   Genererad av build-snippets.js — REDIGERA INTE här; ändra källfilerna.\n" +
"\n" +
"   ENDA sak att ev. ändra för skarp drift: sök 'endpoint: null' nedan och\n" +
"   sätt den till din REST-URL (se snippet 3) om du vill fånga leads server-\n" +
"   side i stället för mailto. Lämna null = mejlklient-fallback (inget lead tappas).\n" +
"   ========================================================================== */\n";
write("2-ampy-led-scripts.js", jsHeader + banner("DEL 1/3 — DATALAGER (data.js)") + dataJs +
      banner("DEL 2/3 — MOTOR (engine.js)") + engineJs +
      banner("DEL 3/3 — RENDERARE (app.js)") + appJs + "\n");

/* --- 3. PHP + HTML --------------------------------------------------------- */
// Extrahera .ampy-calc-blocket VERBATIM ur index.html (öppnande div → yttre </div>
// precis före <script>). Byt bara data-sida-värdet mot en platshållare som PHP
// ersätter med den escapa:de shortcode-attributen. Ingen annan markup rörs.
var startTag = '<div class="ampy-calc" id="ampyLed"';
var s = indexHtml.indexOf(startTag);
var e = indexHtml.indexOf('<script src="data.js">');
if (s < 0 || e < 0) { throw new Error("Hittade inte markup-gränserna i index.html"); }
var block = indexHtml.slice(s, e).replace(/\s+$/, ""); // t.o.m. yttre </div>, utan efterföljande whitespace
if (block.indexOf('data-sida="belysning"') < 0) { throw new Error("data-sida-attributet saknas i markupen"); }
block = block.replace('data-sida="belysning"', 'data-sida="__AMPY_SIDA__"');
if (/^\s*HTML;\s*$/m.test(block)) { throw new Error("Markupen innehåller nowdoc-terminatorn HTML; — byt token"); }

var php =
"<?php\n" +
"/**\n" +
" * ==========================================================================\n" +
" *  AMPY LED-KALKYLATOR — SNIPPET 3 av 3: PHP + HTML (shortcode + lead-endpoint)\n" +
" *  Klistra in som en Fluent Snippets-snippet av typ 'PHP' (kör överallt, eller\n" +
" *  villkorat till kalkylator-sidorna). Placerar INGEN CSS/JS — det gör snippet\n" +
" *  1 och 2. Denna ger dig:\n" +
" *    • en shortcode  [ampy_led_kalkylator]  som skriver ut EXAKT samma markup\n" +
" *      som prototypen (lägg den i ett Bricks 'Shortcode'-element).\n" +
" *      Byt förval per sida:  [ampy_led_kalkylator sida=\"spotlight\"]\n" +
" *      Giltiga sida-värden: belysning · inomhusbelysning · utomhusbelysning ·\n" +
" *      spotlight · armaturer  (se embed_preset i snippet 2).\n" +
" *    • en REST-endpoint  POST /wp-json/ampy/v1/led-offert  för lead-fångst\n" +
" *      (valfritt — se snippet 2, 'endpoint'). Honeypot + rate-limit + validering.\n" +
" *  Genererad av build-snippets.js — markupen är index.html VERBATIM.\n" +
" * ========================================================================== */\n" +
"\n" +
"if ( ! defined( 'ABSPATH' ) ) { exit; }\n" +
"\n" +
"/* --- Shortcode: [ampy_led_kalkylator sida=\"belysning\"] --------------------- */\n" +
"add_shortcode( 'ampy_led_kalkylator', function ( $atts ) {\n" +
"\t$a = shortcode_atts( array( 'sida' => 'belysning' ), $atts, 'ampy_led_kalkylator' );\n" +
"\t$markup = <<<'HTML'\n" +
block + "\n" +
"HTML;\n" +
"\treturn str_replace( '__AMPY_SIDA__', esc_attr( $a['sida'] ), $markup );\n" +
"} );\n" +
"\n" +
"/* --- Lead-endpoint (valfritt): POST /wp-json/ampy/v1/led-offert ------------\n" +
"   Samma-origin. Sätt data.lead.endpoint = \"/wp-json/ampy/v1/led-offert\" i\n" +
"   snippet 2 för att aktivera. Lämnar du endpoint = null används mailto-fallback\n" +
"   och denna route rörs aldrig. */\n" +
"add_action( 'rest_api_init', function () {\n" +
"\tregister_rest_route( 'ampy/v1', '/led-offert', array(\n" +
"\t\t'methods'             => 'POST',\n" +
"\t\t'permission_callback' => '__return_true', // publikt formulär; skyddat i callbacken\n" +
"\t\t'callback'            => function ( WP_REST_Request $req ) {\n" +
"\t\t\t$d = $req->get_json_params();\n" +
"\n" +
"\t\t\t// 1) Honeypot: ifylld company_url = bot. Låtsas OK, skicka inget.\n" +
"\t\t\tif ( ! empty( $d['company_url'] ) ) { return new WP_REST_Response( array( 'ok' => true ), 200 ); }\n" +
"\n" +
"\t\t\t// 2) Rate-limit per IP: max 5 skick / 10 min.\n" +
"\t\t\t$ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? $_SERVER['REMOTE_ADDR'] : '';\n" +
"\t\t\t$key = 'ampy_led_' . md5( $ip );\n" +
"\t\t\t$n   = (int) get_transient( $key );\n" +
"\t\t\tif ( $n >= 5 ) { return new WP_REST_Response( array( 'ok' => false ), 429 ); }\n" +
"\t\t\tset_transient( $key, $n + 1, 10 * MINUTE_IN_SECONDS );\n" +
"\n" +
"\t\t\t// 3) Kräv ALLA fält klienten kräver (klientvalidering går att kringgå).\n" +
"\t\t\tif ( empty( $d['namn'] ) || empty( $d['epost'] ) || empty( $d['telefon'] )\n" +
"\t\t\t\t|| empty( $d['postnummer'] ) || empty( $d['samtycke'] ) ) {\n" +
"\t\t\t\treturn new WP_REST_Response( array( 'ok' => false ), 400 );\n" +
"\t\t\t}\n" +
"\t\t\t$namn  = sanitize_text_field( $d['namn'] );\n" +
"\t\t\t$epost = sanitize_email( $d['epost'] );\n" +
"\t\t\tif ( ! is_email( $epost ) ) { return new WP_REST_Response( array( 'ok' => false ), 400 ); }\n" +
"\n" +
"\t\t\t$g = function ( $k ) use ( $d ) { return isset( $d[ $k ] ) ? sanitize_text_field( $d[ $k ] ) : ''; };\n" +
"\t\t\t$body = \"Ny LED-offertförfrågan\\n\\n\"\n" +
"\t\t\t\t. \"Namn: $namn\\nE-post: $epost\\n\"\n" +
"\t\t\t\t. 'Telefon: '  . $g( 'telefon' )    . \"\\n\"\n" +
"\t\t\t\t. 'Postnr: '   . $g( 'postnummer' ) . \"\\n\\n\"\n" +
"\t\t\t\t. 'Segment: '  . $g( 'segment' )    . \"\\n\"\n" +
"\t\t\t\t. 'Antal: '    . intval( isset( $d['antal'] ) ? $d['antal'] : 0 ) . ' × ' . $g( 'typ_id' ) . \"\\n\"\n" +
"\t\t\t\t. 'Brinntid: ' . floatval( isset( $d['timmar_dag'] ) ? $d['timmar_dag'] : 0 ) . ' h/dygn, område ' . $g( 'elprisomrade' ) . \"\\n\"\n" +
"\t\t\t\t. 'Årlig besparing: '    . intval( isset( $d['arlig_besparing'] ) ? $d['arlig_besparing'] : 0 )     . \" kr/år\\n\"\n" +
"\t\t\t\t. 'Uppskattad kostnad: ' . intval( isset( $d['uppskattad_kostnad'] ) ? $d['uppskattad_kostnad'] : 0 ) . \" kr\\n\"\n" +
"\t\t\t\t. 'Samtycke: '  . $g( 'samtycke_tid' );\n" +
"\n" +
"\t\t\t// 4) Header-injection-skydd: strippa CR/LF ur allt som hamnar i en mejl-header.\n" +
"\t\t\t$reply = str_replace( array( \"\\r\", \"\\n\" ), '', $epost );\n" +
"\t\t\twp_mail( 'offert@ampy.se', 'LED-offert – ' . $namn, $body, array( 'Reply-To: ' . $reply ) );\n" +
"\t\t\t// TODO: pusha till CRM här om ni vill. Lägg ALDRIG rå $d[...] i mejl-headers.\n" +
"\t\t\treturn new WP_REST_Response( array( 'ok' => true ), 200 );\n" +
"\t\t},\n" +
"\t) );\n" +
"} );\n";
write("3-ampy-led-shortcode.php", php);

/* --- WP-trogen förhandsvisning (endast för vår verifiering, ej en leverans) -
   Simulerar EXAKT hur WordPress + Fluent Snippets laddar bitarna:
     • snippet 1 (CSS, med 62.5%-basen) i <head>
     • shortcode-markupen (data-sida=belysning) i <body>
     • snippet 2 (JS) precis före </body>
   Sid-chrome (body margin/bg) matchar prototypens index.html så en ev. pixel-
   diff bara kan komma från ompaketeringen, inte från sidramen. */
var previewMarkup = block.replace('data-sida="__AMPY_SIDA__"', 'data-sida="belysning"');
var preview =
"<!DOCTYPE html>\n<html lang=\"sv\">\n<head>\n" +
"  <meta charset=\"UTF-8\" />\n" +
"  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n" +
"  <title>WP-förhandsvisning — LED-kalkylatorn (Fluent Snippets)</title>\n" +
"  <!-- Preview-chrome (INTE en del av leveransen; på riktig WP är detta sidans/temats jobb) -->\n" +
"  <style>body{margin:0;background:rgb(247,249,251)}</style>\n" +
"  <!-- SNIPPET 1 (CSS) — laddas som Fluent CSS-snippet i <head>. Innehåller 62.5%-basen. -->\n" +
"  <link rel=\"stylesheet\" href=\"../1-ampy-led-styles.css\" />\n" +
"</head>\n<body>\n\n" +
"  <!-- SNIPPET 3 (shortcode-utdata) — exakt markup som [ampy_led_kalkylator] returnerar -->\n" +
previewMarkup + "\n\n" +
"  <!-- SNIPPET 2 (JS) — laddas som Fluent JS-snippet i sidfoten -->\n" +
"  <script src=\"../2-ampy-led-scripts.js\"></script>\n" +
"</body>\n</html>\n";
write("_preview/index.html", preview);

console.log("\nKlart. 3 snippets + WP-preview genererade i " + OUT);
