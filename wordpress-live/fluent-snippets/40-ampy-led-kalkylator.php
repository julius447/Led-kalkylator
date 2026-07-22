<?php
// <Internal Doc Start>
/*
*
* @description: Shortcode: [ampy_led_lead_magnet]
* @tags: 
* @group: 
* @name: Ampy — LED-kalkylator — Backend
* @type: PHP
* @status: published
* @created_by: 13
* @created_at: 2026-06-09 15:52:51
* @updated_at: 2026-07-09 23:57:18
* @is_valid: 1
* @updated_by: 13
* @priority: 10
* @run_at: all
* @load_as_file: 
* @load_in_block_editor: 
* @condition: {"status":"no","run_if":"assertive","items":[[]]}
*/
?>
<?php if (!defined("ABSPATH")) { return;} // <Internal Doc End> ?>
<?php


/**
 * Ampy — LED-kalkylator — Backend
 * Fluent Snippets: set Run Location -> Run everywhere (all).
 *
 * Mirrors the battery backend (REST + lead delivery + metabox) and the EV
 * pattern (the render function lives in the calculator's own snippet, so this
 * never edits the live battery snippets). Parallel namespace throughout:
 *   - REST:      ampy-led-calc/v1   (GET /data/{id}, POST /lead/{id})
 *   - Data var:  window.AmpyLedCalcData    DOM root: #ampyLed
 *   - Render fn: ampy_render_led_lead_magnet()   shortcode [ampy_led_lead_magnet]
 *   - Post meta: _ampy_led_calc_data / _ampy_led_webhook_url /
 *                _ampy_led_notify_email / _ampy_led_leads / _ampy_led_sida
 *
 * The lead-magnet CPT and the clean-URL Router are shared infrastructure
 * registered elsewhere; this snippet does NOT re-register them.
 *
 * LEAD DELIVERY PRIORITY (same as battery): webhook -> email -> always logged
 * to post meta, so no lead is ever lost.
 */
if ( ! defined( 'ABSPATH' ) ) exit;

// Lock the metabox to one lead-magnet post id; 0 = show on all lead-magnet posts.
if ( ! defined( 'AMPY_LED_POST_ID' ) ) define( 'AMPY_LED_POST_ID', 58759 );


/* ==========================================================================
   1. BUILT-IN DEFAULT DATA  (byte-identical to the standalone data.js)
   LED's business data is static, so the calculator works with no setup. The
   metabox can override it per-post by pasting replacement JSON.
   ========================================================================== */
function ampy_led_default_data(): array {
    static $d = null;
    if ( $d !== null ) return $d;
    $json = <<<'AMPYLEDJSON'
{
  "schema_version": "1.0.0",
  "_status": "Research-signerad (vol.1 + vol.3 2026-06-06). Kräver sakkunnig-signatur före lansering.",
  "elpris": {
    "SE1": 1.35,
    "SE2": 1.4,
    "SE3": 1.65,
    "SE4": 1.85,
    "nationellt_default": 1.5,
    "enhet": "kr/kWh inkl. moms",
    "datum": "2026 (verifierad 2026-06-06)",
    "kalla": "Skatteverket; Nord Pool/elpriser24.se; Ellevio",
    "not": "Medvetet lågt schablonpris per område — verklig besparing blir snarare högre."
  },
  "segments": {
    "brf": {
      "betalar_installation": true,
      "visa_co2": true
    },
    "foretag": {
      "betalar_installation": true,
      "visa_co2": true
    },
    "privat": {
      "betalar_installation": false,
      "visa_co2": false
    }
  },
  "limits": {
    "antal_max": 100000
  },
  "horisont_ar": 10,
  "cta": {
    "url": null
  },
  "lead": {
    "endpoint": null,
    "fallback_mailto": "offert@ampy.se"
  },
  "prissattning": {
    "moms_not": "Företag/BRF ex moms · Privat inkl moms efter ROT"
  },
  "watt_tabell": [
    {
      "id": "glod_40",
      "namn": "Glödlampa 40 W (E27/E14)",
      "kat": "privat",
      "grupp": "Glödljus",
      "w_gammal": 40,
      "w_led": 5,
      "lumen": "~470 lm",
      "kostnad_kr": 550
    },
    {
      "id": "glod_60",
      "namn": "Glödlampa 60 W (E27)",
      "kat": "privat",
      "grupp": "Glödljus",
      "w_gammal": 60,
      "w_led": 9,
      "lumen": "~800 lm",
      "kostnad_kr": 550
    },
    {
      "id": "glod_75",
      "namn": "Glödlampa 75 W (E27)",
      "kat": "privat",
      "grupp": "Glödljus",
      "w_gammal": 75,
      "w_led": 12,
      "lumen": "~1100 lm",
      "kostnad_kr": 600
    },
    {
      "id": "glod_100",
      "namn": "Glödlampa 100 W (E27)",
      "kat": "privat",
      "grupp": "Glödljus",
      "w_gammal": 100,
      "w_led": 16,
      "lumen": "~1500 lm",
      "kostnad_kr": 650
    },
    {
      "id": "gu10_35",
      "namn": "Halogenspot GU10 35 W",
      "kat": "privat",
      "grupp": "Halogen",
      "w_gammal": 35,
      "w_led": 4,
      "lumen": "~230–300 lm",
      "kostnad_kr": 650
    },
    {
      "id": "gu10_50",
      "namn": "Halogenspot GU10 50 W",
      "kat": "privat",
      "grupp": "Halogen",
      "w_gammal": 50,
      "w_led": 6,
      "lumen": "~380–450 lm",
      "kostnad_kr": 700
    },
    {
      "id": "halo_r7s_150",
      "namn": "Halogen linjär R7s 150 W",
      "kat": "privat",
      "grupp": "Halogen",
      "w_gammal": 150,
      "w_led": 18,
      "lumen": "~2200 lm",
      "kostnad_kr": 850
    },
    {
      "id": "halo_r7s_300",
      "namn": "Halogen linjär R7s 300 W",
      "kat": "privat",
      "grupp": "Halogen",
      "w_gammal": 300,
      "w_led": 35,
      "lumen": "~3200 lm",
      "kostnad_kr": 950
    },
    {
      "id": "cfl_15",
      "namn": "Lågenergilampa (CFL) 15 W",
      "kat": "privat",
      "grupp": "Lågenergi / LED",
      "w_gammal": 15,
      "w_led": 9,
      "lumen": "~800 lm",
      "kostnad_kr": 550
    },
    {
      "id": "cfl_23",
      "namn": "Lågenergilampa (CFL) 23 W",
      "kat": "privat",
      "grupp": "Lågenergi / LED",
      "w_gammal": 23,
      "w_led": 14,
      "lumen": "~1500 lm",
      "kostnad_kr": 650
    },
    {
      "id": "led_spot_gammal",
      "namn": "Äldre LED-spot (1:a gen, GU10)",
      "kat": "privat",
      "grupp": "Lågenergi / LED",
      "w_gammal": 7,
      "w_led": 5,
      "lumen": "~350 lm",
      "kostnad_kr": 700
    },
    {
      "id": "t8_1x18",
      "namn": "Lysrörsarmatur 1×18 W T8 (60 cm)",
      "kat": "kommersiell",
      "grupp": "Lysrör",
      "w_gammal": 28,
      "w_led": 10,
      "lumen": "~1000–1300 lm",
      "kostnad_kr": 1000
    },
    {
      "id": "t8_2x18",
      "namn": "Lysrörsarmatur 2×18 W T8 (60 cm)",
      "kat": "kommersiell",
      "grupp": "Lysrör",
      "w_gammal": 56,
      "w_led": 20,
      "lumen": "~2000–2600 lm",
      "kostnad_kr": 1200
    },
    {
      "id": "t8_1x36",
      "namn": "Lysrörsarmatur 1×36 W T8 (120 cm)",
      "kat": "kommersiell",
      "grupp": "Lysrör",
      "w_gammal": 41,
      "w_led": 18,
      "lumen": "~1800–2200 lm",
      "kostnad_kr": 1200
    },
    {
      "id": "t8_2x36",
      "namn": "Lysrörsarmatur 2×36 W T8 (120 cm)",
      "kat": "kommersiell",
      "grupp": "Lysrör",
      "w_gammal": 82,
      "w_led": 34,
      "lumen": "~3600–4400 lm",
      "kostnad_kr": 1500
    },
    {
      "id": "t8_1x58",
      "namn": "Lysrörsarmatur 1×58 W T8 (150 cm)",
      "kat": "kommersiell",
      "grupp": "Lysrör",
      "w_gammal": 65,
      "w_led": 25,
      "lumen": "~2600–3300 lm",
      "kostnad_kr": 1400
    },
    {
      "id": "t8_2x58",
      "namn": "Lysrörsarmatur 2×58 W T8 (150 cm)",
      "kat": "kommersiell",
      "grupp": "Lysrör",
      "w_gammal": 130,
      "w_led": 48,
      "lumen": "~5200–6600 lm",
      "kostnad_kr": 1900
    },
    {
      "id": "t5_28",
      "namn": "Lysrörsarmatur T5 28 W (120 cm)",
      "kat": "kommersiell",
      "grupp": "Lysrör",
      "w_gammal": 32,
      "w_led": 16,
      "lumen": "~2600 lm",
      "kostnad_kr": 1300
    },
    {
      "id": "pl_18",
      "namn": "Kompaktlysrör PL 18 W",
      "kat": "kommersiell",
      "grupp": "Lysrör",
      "w_gammal": 21,
      "w_led": 10,
      "lumen": "~1200 lm",
      "kostnad_kr": 1000
    },
    {
      "id": "pl_26",
      "namn": "Kompaktlysrör PL 26 W",
      "kat": "kommersiell",
      "grupp": "Lysrör",
      "w_gammal": 29,
      "w_led": 12,
      "lumen": "~1800 lm",
      "kostnad_kr": 1000
    },
    {
      "id": "led_panel_gammal",
      "namn": "Äldre LED-panel (1:a gen, ~45 W)",
      "kat": "kommersiell",
      "grupp": "LED",
      "w_gammal": 45,
      "w_led": 32,
      "lumen": "~3600 lm",
      "kostnad_kr": 1500
    },
    {
      "id": "mh_250_highbay",
      "namn": "Metallhalogen high-bay 250 W",
      "kat": "kommersiell",
      "grupp": "Utomhus / högtak",
      "w_gammal": 280,
      "w_led": 100,
      "lumen": "—",
      "kostnad_kr": 2800
    },
    {
      "id": "mh_400_highbay",
      "namn": "Metallhalogen high-bay 400 W",
      "kat": "kommersiell",
      "grupp": "Utomhus / högtak",
      "w_gammal": 455,
      "w_led": 150,
      "lumen": "—",
      "kostnad_kr": 3500
    },
    {
      "id": "hps_150",
      "namn": "Högtrycksnatrium 150 W (utomhus)",
      "kat": "kommersiell",
      "grupp": "Utomhus / högtak",
      "w_gammal": 170,
      "w_led": 60,
      "lumen": "—",
      "kostnad_kr": 2400
    },
    {
      "id": "hps_250",
      "namn": "Högtrycksnatrium 250 W (utomhus)",
      "kat": "kommersiell",
      "grupp": "Utomhus / högtak",
      "w_gammal": 280,
      "w_led": 95,
      "lumen": "—",
      "kostnad_kr": 2900
    },
    {
      "id": "merc_125",
      "namn": "Kvicksilverlampa 125 W (äldre)",
      "kat": "kommersiell",
      "grupp": "Utomhus / högtak",
      "w_gammal": 137,
      "w_led": 50,
      "lumen": "—",
      "kostnad_kr": 2300
    },
    {
      "id": "merc_250",
      "namn": "Kvicksilverlampa 250 W (äldre)",
      "kat": "kommersiell",
      "grupp": "Utomhus / högtak",
      "w_gammal": 272,
      "w_led": 90,
      "lumen": "—",
      "kostnad_kr": 2800
    }
  ],
  "brinntid_default": [
    {
      "kontext": "Snitt brinntid",
      "segment": "brf",
      "timmar_dag": 12
    },
    {
      "kontext": "Trapphus utan styrning",
      "segment": "brf",
      "timmar_dag": 24
    },
    {
      "kontext": "Trapphus med sensor",
      "segment": "brf",
      "timmar_dag": 4
    },
    {
      "kontext": "Garage / förråd — utan styrning",
      "segment": "brf",
      "timmar_dag": 24
    },
    {
      "kontext": "Tvättstuga / gemensamt",
      "segment": "brf",
      "timmar_dag": 6
    },
    {
      "kontext": "Snitt brinntid",
      "segment": "foretag",
      "timmar_dag": 9
    },
    {
      "kontext": "Kontor",
      "segment": "foretag",
      "timmar_dag": 9
    },
    {
      "kontext": "Butik",
      "segment": "foretag",
      "timmar_dag": 12
    },
    {
      "kontext": "Lager",
      "segment": "foretag",
      "timmar_dag": 14
    },
    {
      "kontext": "Verkstad / industri (2-skift)",
      "segment": "foretag",
      "timmar_dag": 16
    },
    {
      "kontext": "Snitt brinntid",
      "segment": "privat",
      "timmar_dag": 5
    },
    {
      "kontext": "Hem / vardagsrum (primär armatur)",
      "segment": "privat",
      "timmar_dag": 5
    },
    {
      "kontext": "Hem / hela bostaden (per lampa)",
      "segment": "privat",
      "timmar_dag": 6
    }
  ],
  "co2_faktor": {
    "g_per_kwh": 464.79,
    "metod": "Nordisk residualmix tillämpad i Sverige, marknadsbaserad (Scope 2), rapportår 2024. Endast Företag/BRF ESG.",
    "kalla": "Energimarknadsinspektionen (Ei), publ. 2025-06-12, beräknad av Grexel",
    "datum": "Rapportår 2024 (verifierad 2026-06-06)."
  },
  "avdrag_copy": {
    "foretag": "Priser är ex moms och inkl. installation. Exakt pris får du i offerten.",
    "brf": "Priser är ex moms och inkl. installation. Exakt pris får du i offerten.",
    "privat": "Priser är inkl. moms och installation, efter ROT-avdrag (30 % på arbetet). Exakt pris får du i offerten."
  },
  "lysror_fakta": {
    "text": "Visste du? Nya lysrör säljs inte längre — EU förbjöd försäljning av T8- och T5-lysrör 2023. Att byta nu är ofta billigare än att vänta.",
    "kalla": "EU Ecodesign/RoHS 2023; Belysningsbranschen (verifierad 2026-06-06)"
  },
  "defaults": {
    "brf": {
      "antal": 80,
      "typ_id": "t8_2x36",
      "kontext": "Snitt brinntid",
      "antal_slider": {
        "min": 1,
        "max": 400,
        "ticks": [
          40,
          80,
          160,
          280,
          400
        ]
      },
      "seg_caption": "Vi räknar för föreningens gemensamma belysning.",
      "enhet_namn": "armaturer",
      "cta_text": "Få en skräddarsydd offert"
    },
    "foretag": {
      "antal": 30,
      "typ_id": "t8_2x36",
      "kontext": "Snitt brinntid",
      "antal_slider": {
        "min": 1,
        "max": 200,
        "ticks": [
          10,
          30,
          75,
          125,
          200
        ]
      },
      "seg_caption": "Vi räknar för verksamhetens belysning.",
      "enhet_namn": "armaturer",
      "cta_text": "Få en skräddarsydd offert"
    },
    "privat": {
      "antal": 15,
      "typ_id": "gu10_50",
      "kontext": "Snitt brinntid",
      "antal_slider": {
        "min": 1,
        "max": 60,
        "ticks": [
          5,
          15,
          30,
          45,
          60
        ]
      },
      "seg_caption": "Vi räknar för belysningen i ditt hem — Ampy installerar.",
      "enhet_namn": "ljuskällor",
      "cta_text": "Få en skräddarsydd offert"
    }
  },
  "embed_preset": {
    "belysning": {
      "segment": "brf",
      "typ_id": "t8_2x36",
      "kontext": "Snitt brinntid"
    },
    "inomhusbelysning": {
      "segment": "foretag",
      "typ_id": "t8_2x36",
      "kontext": "Kontor"
    },
    "utomhusbelysning": {
      "segment": "brf",
      "typ_id": "hps_150",
      "kontext": "Garage / förråd — utan styrning"
    },
    "spotlight": {
      "segment": "privat",
      "typ_id": "gu10_50",
      "kontext": "Snitt brinntid"
    },
    "armaturer": {
      "segment": "foretag",
      "typ_id": "t8_2x36",
      "kontext": "Lager"
    }
  },
  "geo": {
    "default_servicezon": true,
    "regioner": {
      "SE1": true,
      "SE2": true,
      "SE3": true,
      "SE4": true
    }
  }
}
AMPYLEDJSON;
    $d = json_decode( $json, true );
    return is_array( $d ) ? $d : [];
}

function ampy_led_resolve_data( int $post_id ): array {
    // Precedence: (1) manual JSON override, (2) parsed Excel sheet, (3) baked default.
    $json = get_post_meta( $post_id, '_ampy_led_calc_data', true );
    if ( ! empty( $json ) ) {
        $d = json_decode( $json, true );
        if ( is_array( $d ) && ! empty( $d ) ) return $d;
    }
    $sheet = get_post_meta( $post_id, '_ampy_led_sheet_data', true );
    if ( ! empty( $sheet ) ) {
        $d = json_decode( $sheet, true );
        if ( is_array( $d ) && ! empty( $d ) ) return $d;
    }
    return ampy_led_default_data();
}

function ampy_led_fmt_kr( $v ): string {
    return number_format( (float) $v, 0, ',', "\xc2\xa0" ); // sv thousands (NBSP)
}


/* ==========================================================================
   2. REST API  (ampy-led-calc/v1)
   ========================================================================== */
add_action( 'rest_api_init', function () {
    register_rest_route( 'ampy-led-calc/v1', '/data/(?P<post_id>\\d+)', [
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'ampy_led_api_get_data',
        'permission_callback' => '__return_true',
        'args'                => [ 'post_id' => [ 'sanitize_callback' => 'absint' ] ],
    ] );
    register_rest_route( 'ampy-led-calc/v1', '/lead/(?P<post_id>\\d+)', [
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'ampy_led_api_submit_lead',
        'permission_callback' => '__return_true',
        'args'                => [ 'post_id' => [ 'sanitize_callback' => 'absint' ] ],
    ] );
} );

function ampy_led_api_get_data( WP_REST_Request $req ) {
    $post_id = (int) $req['post_id'];
    if ( get_post_type( $post_id ) !== 'lead-magnet' ) {
        return new WP_Error( 'invalid_post', 'Post not found or wrong post type.', [ 'status' => 404 ] );
    }
    return rest_ensure_response( ampy_led_resolve_data( $post_id ) );
}

function ampy_led_api_submit_lead( WP_REST_Request $req ) {
    $post_id = (int) $req['post_id'];
    $p = $req->get_json_params();
    if ( empty( $p ) ) return new WP_Error( 'empty_payload', 'No JSON body received.', [ 'status' => 400 ] );

    // Honeypot — real users never fill company_url. Pretend success, drop silently.
    if ( ! empty( $p['company_url'] ) ) return rest_ensure_response( [ 'success' => true ] );

    $namn   = sanitize_text_field( $p['namn']        ?? '' );
    $epost  = sanitize_email(      $p['epost']       ?? '' );
    $tel    = sanitize_text_field( $p['telefon']     ?? '' );
    $pnr    = sanitize_text_field( $p['postnummer']  ?? '' );
    $seg    = sanitize_text_field( $p['segment']     ?? '' );
    $typ    = sanitize_text_field( $p['typ_id']      ?? '' );
    $antal  = (int)  ( $p['antal']               ?? 0 );
    $tim    = (float)( $p['timmar_dag']          ?? 0 );
    $zon    = sanitize_text_field( $p['elprisomrade'] ?? '' );
    $bespar = (int)  ( $p['arlig_besparing']     ?? 0 );
    $kost   = (int)  ( $p['uppskattad_kostnad']  ?? 0 );

    $webhook = get_post_meta( $post_id, '_ampy_led_webhook_url',  true );
    $notify  = get_post_meta( $post_id, '_ampy_led_notify_email', true );

    if ( $webhook ) {
        wp_remote_post( $webhook, [
            'headers'     => [ 'Content-Type' => 'application/json' ],
            'body'        => wp_json_encode( $p ),
            'timeout'     => 10,
            'blocking'    => false,
            'data_format' => 'body',
        ] );
    } elseif ( $notify ) {
        $lines = [
            'Type:      led_quote_request',
            'Timestamp: ' . sanitize_text_field( $p['samtycke_tid'] ?? '' ),
            '',
            '--- CONTACT ---',
            "Name:     {$namn}",
            "Email:    {$epost}",
            "Phone:    {$tel}",
            "Postcode: {$pnr}",
            '',
            '--- SCENARIO ---',
            "Segment:        {$seg}",
            "Light source:   {$typ}",
            "Count:          {$antal}",
            "Burn hours/day: {$tim}",
            "Price area:     {$zon}",
            'Annual saving:  ' . ampy_led_fmt_kr( $bespar ) . ' kr/year',
            'Est. cost:      ' . ampy_led_fmt_kr( $kost ) . ' kr',
        ];
        wp_mail( $notify, 'New quote request - Ampy LED Calculator', implode( "\n", $lines ) );
    }

    // Always log (nothing lost even if webhook + email are both empty).
    $log_json = get_post_meta( $post_id, '_ampy_led_leads', true );
    $log      = $log_json ? (array) json_decode( $log_json, true ) : [];
    array_unshift( $log, [
        'time'    => current_time( 'mysql' ),
        'contact' => [ 'name' => $namn, 'email' => $epost, 'phone' => $tel, 'zip' => $pnr ],
        'segment' => $seg,
        'source'  => $typ,
        'count'   => $antal,
        'saving'  => $bespar,
        'cost'    => $kost,
    ] );
    update_post_meta( $post_id, '_ampy_led_leads', wp_json_encode( array_slice( $log, 0, 100 ) ) );

    return rest_ensure_response( [ 'success' => true ] );
}


/* ==========================================================================
   3. RENDER  —  ampy_render_led_lead_magnet( id|slug )
   Injects window.AmpyLedCalcData + prints the markup. Mirrors the battery's
   ampy_render_lead_magnet(): fonts via PHP, header hidden on the tool's own page.
   ========================================================================== */
function ampy_render_led_lead_magnet( $id_or_slug ): string {
    if ( is_numeric( $id_or_slug ) ) {
        $post = get_post( (int) $id_or_slug );
    } else {
        $posts = get_posts( [
            'post_type'      => 'lead-magnet',
            'name'           => sanitize_title( (string) $id_or_slug ),
            'post_status'    => [ 'publish', 'pending', 'draft', 'future', 'private' ],
            'posts_per_page' => 1,
            'no_found_rows'  => true,
        ] );
        $post = $posts[0] ?? null;
    }
    if ( ! $post || $post->post_type !== 'lead-magnet' ) return '';
    // Drafts/pending/private render only for users who can edit (build + preview).
    if ( $post->post_status !== 'publish' && ! current_user_can( 'edit_post', $post->ID ) ) return '';

    $post_id     = $post->ID;
    $on_own_page = ( (int) get_the_ID() === (int) $post_id );
    $sida        = get_post_meta( $post_id, '_ampy_led_sida', true ) ?: 'belysning';

    $data    = ampy_led_resolve_data( $post_id );

    /* Lead delivery: the prototype engine ships lead.endpoint = null, which makes
       it fall back to a mailto: link. On WordPress we point it at the live REST
       route so submissions go server-side and hit the n8n webhook (with the email
       fallback) exactly like every other tool. Payload keys the engine sends
       (namn/epost/telefon/postnummer/segment/typ_id/antal/timmar_dag/
       elprisomrade/arlig_besparing/uppskattad_kostnad/company_url honeypot/
       samtycke/samtycke_tid) already match ampy_led_api_submit_lead 1:1. */
    if ( ! isset( $data['lead'] ) || ! is_array( $data['lead'] ) ) $data['lead'] = [];
    $data['lead']['endpoint'] = rest_url( 'ampy-led-calc/v1/lead/' . $post_id );

    $js_data = array_merge( $data, [
        'postId'  => $post_id,
        'restUrl' => rest_url( 'ampy-led-calc/v1' ),
        'nonce'   => wp_create_nonce( 'wp_rest' ),
    ] );

    /* Self-hosted variable fonts — no third-party font requests (GDPR).
       ampy.se ships the three families the --font-* tokens name as variable woff2
       in /wp-content/uploads/fonts/; one file per family covers the whole weight
       axis. A face is emitted only when its file is actually present, so a missing
       file degrades to the system stack already declared in the token
       (system-ui / ui-monospace) instead of 404-ing or hitting Google. */
    $font_dir_path = ABSPATH . 'wp-content/uploads/fonts/';
    $font_dir_url  = home_url( '/wp-content/uploads/fonts/' );
    $font_files = [
        'Plus Jakarta Sans' => [ 'PlusJakartaSans-VariableFont_wght.woff2', '200 800' ],
        'Outfit'            => [ 'Outfit-VariableFont_wght.woff2',          '100 900' ],
        'JetBrains Mono'    => [ 'JetBrainsMono-VariableFont_wght.woff2',   '100 800' ],
    ];
    $faces = '';
    foreach ( $font_files as $family => $spec ) {
        if ( ! file_exists( $font_dir_path . $spec[0] ) ) continue;
        $faces .= '@font-face{font-family:"' . $family . '";'
                // Two sources, one file: a browser that does not recognise the legacy
                // "woff2-variations" token skips that src and takes the plain woff2
                // instead of silently loading no font. The variable axis still works;
                // it is the font-weight range below that enables it.
                . 'src:url("' . esc_url( $font_dir_url . $spec[0] ) . '")format("woff2-variations"),'
                . 'url("' . esc_url( $font_dir_url . $spec[0] ) . '")format("woff2");'
                . 'font-weight:' . $spec[1] . ';font-style:normal;font-display:swap;}';
    }
    $fonts = $faces ? '<style>' . $faces . '</style>' : '';

    ob_start();
    echo $fonts;
    ?>

<script>window.AmpyLedCalcData = <?= wp_json_encode( $js_data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) ?>;</script>

<div class="ampy-led-outer">
  <div class="ampy-calc" id="ampyLed" data-sida="<?= esc_attr( $sida ) ?>">
    <div class="ampy-calc__container">

      <header class="ampy-calc__header"<?= $on_own_page ? ' hidden style="display:none;"' : '' ?>>
        <h1>Vad sparar du på att byta till LED?</h1>
      </header>

      <div class="ampy-calc__main">

        <!-- VÄNSTER: inputs -->
        <section class="ampy-calc__card" aria-label="Dina värden">
          <div class="ampy-calc__tier ampy-calc__tier--primary">
            <span class="ampy-calc__tier-label">Vad du byter</span>

            <div class="ampy-calc__field">
              <span class="ampy-calc__field-label-tiny">Vem räknar vi för?
                <button type="button" class="ampy-calc__tip" data-tip="BRF, företag och privatperson räknas olika — vi anpassar armaturtyp, brinntid och pris efter din profil.">i</button>
              </span>
              <div class="ampy-calc__segmented ampy-calc__segmented--3" role="group" aria-label="Segment" id="segSegment">
                <button type="button" class="ampy-calc__segmented-option" data-seg="brf" aria-pressed="true">BRF</button>
                <button type="button" class="ampy-calc__segmented-option" data-seg="foretag" aria-pressed="false">Företag</button>
                <button type="button" class="ampy-calc__segmented-option" data-seg="privat" aria-pressed="false">Privat</button>
              </div>
              <p class="ampy-calc__field-hint" id="segCaption">Vi räknar för föreningens gemensamma belysning.</p>
            </div>

            <div class="ampy-calc__field ampy-calc__field--prominent">
              <label class="ampy-calc__field-label-tiny" id="typLabel">Vad byter du från?
                <button type="button" class="ampy-calc__tip" data-tip="Välj din nuvarande ljuskälla. Vi jämför mot en likvärdig LED-ersättning med samma ljus.">i</button>
              </label>
              <div class="ampy-calc__selector" id="typSelector" aria-expanded="false">
                <button type="button" class="ampy-calc__selector-button" id="typButton" aria-haspopup="listbox">
                  <span class="ampy-calc__selector-img">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.8 1 1.3 1 2.5h6c0-1.2.3-1.7 1-2.5A6 6 0 0 0 12 3Z"/></svg>
                  </span>
                  <span class="ampy-calc__selector-text">
                    <span class="ampy-calc__selector-name" id="typName">—</span>
                    <span class="ampy-calc__selector-best" id="typMeta">—</span>
                  </span>
                  <svg class="ampy-calc__selector-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                <ul class="ampy-calc__selector-list" id="typList" role="listbox" aria-label="Ljuskälla"></ul>
              </div>
            </div>

            <div class="ampy-calc__field ampy-calc__field--prominent">
              <label class="ampy-calc__field-label-tiny" id="antalLabel">Antal armaturer
                <button type="button" class="ampy-calc__tip" data-tip="Hur många armaturer eller ljuskällor bytet gäller. Dra i reglaget eller klicka på en siffra.">i</button>
              </label>
              <span class="ampy-calc__value-prominent ampy-calc__t-mono">
                <span id="antalValue">—</span><span class="ampy-calc__value-unit" id="antalUnit">st</span>
              </span>
              <div id="antalSlider"></div>
            </div>
          </div>

          <div class="ampy-calc__tier">
            <span class="ampy-calc__tier-label">Din situation</span>

            <div class="ampy-calc__field">
              <label class="ampy-calc__field-label" for="inKontext">Var sitter belysningen?
                <button type="button" class="ampy-calc__tip" data-tip="Styr brinntiden. ”Snitt brinntid” är ett genomsnitt över alla armaturer — bra när bytet omfattar flera utrymmen.">i</button>
              </label>
              <select class="ampy-calc__select" id="inKontext"></select>
            </div>

            <div class="ampy-calc__field ampy-calc__field--prominent">
              <label class="ampy-calc__field-label-tiny">Brinntid
                <button type="button" class="ampy-calc__tip" data-tip="Timmar per dygn som belysningen lyser, i snitt över året. ”Snitt brinntid” tar ett genomsnitt över alla armaturer i olika utrymmen.">i</button>
              </label>
              <span class="ampy-calc__value-prominent ampy-calc__value-prominent--sm ampy-calc__t-mono">
                <span id="brinntidValue">—</span><span class="ampy-calc__value-unit">h/dygn</span>
              </span>
              <div id="brinntidSlider"></div>
            </div>

            <div class="ampy-calc__field">
              <label class="ampy-calc__field-label">Elprisområde
                <button type="button" class="ampy-calc__tip" data-tip="Vi använder ett medvetet lågt schablonpris per område (SE1–SE4) — din verkliga besparing blir snarare högre.">i</button>
              </label>
              <div class="ampy-calc__segmented ampy-calc__segmented--4" role="group" aria-label="Elprisområde" id="segRegion">
                <button type="button" class="ampy-calc__segmented-option" data-region="SE1" aria-pressed="false">SE1</button>
                <button type="button" class="ampy-calc__segmented-option" data-region="SE2" aria-pressed="false">SE2</button>
                <button type="button" class="ampy-calc__segmented-option" data-region="SE3" aria-pressed="true">SE3</button>
                <button type="button" class="ampy-calc__segmented-option" data-region="SE4" aria-pressed="false">SE4</button>
              </div>
            </div>
          </div>
        </section>

        <!-- HÖGER: resultat -->
        <div class="ampy-calc__result-stack">
          <section class="ampy-calc__card ampy-calc__card--surface" aria-label="Ditt resultat">
            <h2 class="sr-only">Ditt resultat</h2>
            <p class="sr-only" id="resultSummary" aria-live="polite"></p>

            <div class="ampy-calc__hero">
              <span class="ampy-calc__hero-eyebrow">Årlig besparing</span>
              <span class="ampy-calc__hero-value ampy-calc__t-mono">
                <span id="heroValue">—</span><span class="ampy-calc__hero-unit">kr/år</span>
              </span>
              <span class="ampy-calc__hero-sub" id="heroSub">Så mycket lägre kan elkostnaden bli — varje år, så länge belysningen lyser.</span>
            </div>

            <div class="ampy-calc__trio">
              <span class="ampy-calc__trio-label">Energi du kapar</span>
              <span class="ampy-calc__trio-value ampy-calc__t-mono"><span id="statKwh">—</span><span class="ampy-calc__trio-unit">kWh/år</span></span>
              <span class="ampy-calc__trio-sub" id="statKwhSub">—</span>

              <span class="ampy-calc__trio-label" id="statBLabel">CO₂ du sparar</span>
              <span class="ampy-calc__trio-value ampy-calc__t-mono"><span id="statB">—</span><span class="ampy-calc__trio-unit" id="statBUnit">/år</span></span>
              <span class="ampy-calc__trio-sub" id="statBSub">—</span>

              <span class="ampy-calc__trio-label">Uppskattad kostnad</span>
              <span class="ampy-calc__trio-value ampy-calc__t-mono"><span id="statCost">—</span><span class="ampy-calc__trio-unit">kr</span></span>
              <span class="ampy-calc__trio-sub" id="statCostSub">—</span>
            </div>

            <hr class="ampy-calc__internal-divider" />

            <!-- Före/efter — elkostnad per år (ersätter payback-kurvan) -->
            <div class="ampy-calc__compare">
              <span class="ampy-calc__evidence-label">Vad belysningen kostar per år</span>
              <div class="ampy-calc__compare-row ampy-calc__compare-row--now">
                <span class="ampy-calc__compare-key">I dag</span>
                <span class="ampy-calc__compare-track"><span class="ampy-calc__compare-bar ampy-calc__compare-bar--now" id="barNow"></span></span>
                <span class="ampy-calc__compare-val ampy-calc__t-mono" id="costNow">—</span>
              </div>
              <div class="ampy-calc__compare-row ampy-calc__compare-row--led">
                <span class="ampy-calc__compare-key">Med LED</span>
                <span class="ampy-calc__compare-track"><span class="ampy-calc__compare-bar ampy-calc__compare-bar--led" id="barLed"></span></span>
                <span class="ampy-calc__compare-val ampy-calc__t-mono" id="costLed">—</span>
              </div>
              <p class="ampy-calc__evidence-caption" id="compareCaption">—</p>
            </div>

            <hr class="ampy-calc__internal-divider" />

            <div class="ampy-calc__cta-stack">
              <button class="ampy-calc__btn ampy-calc__btn--primary ampy-calc__btn--lg ampy-calc__btn--block" id="ctaBtn" type="button">
                <span id="ctaLabel">Få en skräddarsydd offert</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </button>

              <!-- Lead-formulär: fälls ut vid klick på CTA (värde först, ingen vägg) -->
              <form class="ampy-calc__lead-form is-hidden" id="leadForm" novalidate>
                <p class="ampy-calc__lead-intro">Vår belysningsexpert hör av sig med ett offertförslag, oftast inom en arbetsdag.</p>
                <div class="ampy-calc__lead-grid">
                  <div class="ampy-calc__lead-field">
                    <label for="leadNamn">Namn</label>
                    <input id="leadNamn" name="namn" type="text" autocomplete="name" maxlength="80" aria-required="true" required />
                  </div>
                  <div class="ampy-calc__lead-field">
                    <label for="leadEpost">E-post</label>
                    <input id="leadEpost" name="epost" type="email" autocomplete="email" inputmode="email" maxlength="120" aria-required="true" required />
                  </div>
                  <div class="ampy-calc__lead-field">
                    <label for="leadTel">Telefon</label>
                    <input id="leadTel" name="telefon" type="tel" autocomplete="tel" inputmode="tel" maxlength="20" aria-required="true" required />
                  </div>
                  <div class="ampy-calc__lead-field">
                    <label for="leadPostnr">Postnummer</label>
                    <input id="leadPostnr" name="postnummer" type="text" inputmode="numeric" autocomplete="postal-code" maxlength="6" pattern="\d{3}\s?\d{2}" aria-required="true" required />
                  </div>
                </div>
                <div class="ampy-calc__hp" aria-hidden="true">
                  <label>Lämna detta fält tomt<input id="leadHp" name="company_url" type="text" tabindex="-1" autocomplete="off" /></label>
                </div>
                <label class="ampy-calc__lead-consent">
                  <input id="leadConsent" name="samtycke" type="checkbox" aria-required="true" required />
                  <span>Jag godkänner att Ampy sparar mina uppgifter för att kontakta mig med en offert, enligt <a href="https://ampy.se/integritetspolicy" target="_blank" rel="noopener">integritetspolicyn</a>.</span>
                </label>
                <button class="ampy-calc__btn ampy-calc__btn--primary ampy-calc__btn--block" id="leadSubmit" type="submit">Skicka offertförfrågan</button>
                <p class="ampy-calc__lead-fine">Kostnadsfritt och utan förbindelse. <button type="button" class="ampy-calc__lead-cancel" id="leadCancel">Avbryt</button></p>
                <p class="ampy-calc__lead-msg is-hidden" id="leadMsg" role="alert"></p>
              </form>
            </div>
          </section>

          <section class="ampy-calc__methodology" id="methodology" aria-label="Så har vi räknat">
            <h2 class="sr-only">Så har vi räknat</h2>
            <details class="ampy-calc__disclosure">
              <summary class="ampy-calc__disclosure-summary">Så har vi räknat</summary>
              <div class="ampy-calc__disclosure-content">
                <div class="ampy-calc__methodology-stack" id="methodologyStack"></div>
                <div class="ampy-calc__disclaimers" id="disclaimers"></div>
              </div>
            </details>
          </section>
        </div>

      </div>
    </div>
  </div>
</div><!-- /.ampy-led-outer -->

    <?php
    return ob_get_clean();
}

add_shortcode( 'ampy_led_lead_magnet', function ( $atts ): string {
    $a  = shortcode_atts( [ 'slug' => '', 'id' => '' ], $atts, 'ampy_led_lead_magnet' );
    $id = $a['id'] ?: $a['slug'];
    // No id/slug given: fall back to the current post if it is a lead-magnet.
    // Lets a per-post Bricks template just drop [ampy_led_lead_magnet] in place.
    if ( ! $id ) {
        $cur = get_queried_object_id() ?: get_the_ID();
        if ( $cur && get_post_type( $cur ) === 'lead-magnet' ) $id = (int) $cur;
    }
    return $id ? ampy_render_led_lead_magnet( $id ) : '';
} );


/* ==========================================================================
   4. METABOX on the lead-magnet post type
   ========================================================================== */
add_action( 'add_meta_boxes', function ( $post_type, $post ) {
    // Bind to the LED lead-magnet ONLY. Previously this registered on every
    // 'lead-magnet' post and printed a "This box is locked to post ID ..."
    // notice on all the others; now it simply isn't added there at all.
    // AMPY_LED_POST_ID = 0 falls back to "every lead-magnet".
    if ( $post_type !== 'lead-magnet' ) return;
    if ( AMPY_LED_POST_ID && (int) $post->ID !== (int) AMPY_LED_POST_ID ) return;
    add_meta_box(
        'ampy_led_settings',
        'LED-kalkylator - Settings',
        'ampy_led_metabox_render',
        'lead-magnet',
        'normal',
        'high'
    );
}, 10, 2 );

function ampy_led_metabox_render( WP_Post $post ): void {
    if ( AMPY_LED_POST_ID && (int) $post->ID !== (int) AMPY_LED_POST_ID ) {
        echo '<p>This box is locked to post ID ' . (int) AMPY_LED_POST_ID . '.</p>';
        return;
    }
    wp_nonce_field( 'ampy_led_save', 'ampy_led_nonce' );

    $sida    = esc_attr( get_post_meta( $post->ID, '_ampy_led_sida', true ) ?: 'belysning' );
    $webhook = esc_attr( get_post_meta( $post->ID, '_ampy_led_webhook_url', true ) );
    $notify  = esc_attr( get_post_meta( $post->ID, '_ampy_led_notify_email', true ) );
    $data       = get_post_meta( $post->ID, '_ampy_led_calc_data', true );
    $sheet_id   = (int) get_post_meta( $post->ID, '_ampy_led_sheet_id', true );
    $sheet_name = $sheet_id ? basename( (string) get_attached_file( $sheet_id ) ) : '';
    $sheet_url  = $sheet_id ? wp_get_attachment_url( $sheet_id ) : '';
    $status     = get_post_meta( $post->ID, '_ampy_led_import_status', true );
    $last       = get_post_meta( $post->ID, '_ampy_led_last_import', true );
    $eff        = ampy_led_resolve_data( $post->ID );
    $src        = ! empty( $data ) ? 'manual JSON override'
                : ( get_post_meta( $post->ID, '_ampy_led_sheet_data', true ) ? 'uploaded Excel sheet' : 'built-in default' );
    $log     = get_post_meta( $post->ID, '_ampy_led_leads', true );
    $log_arr = $log ? (array) json_decode( $log, true ) : [];

    echo '<p><label><strong>Embed preset (data-sida)</strong></label><br>';
    echo '<input type="text" name="ampy_led_sida" value="' . $sida . '" class="regular-text" placeholder="belysning"></p>';

    echo '<p><label><strong>Lead webhook URL</strong> (optional)</label><br>';
    echo '<input type="url" name="ampy_led_webhook_url" value="' . $webhook . '" class="large-text" placeholder="https://..."></p>';

    echo '<p><label><strong>Notification email</strong> (used if no webhook)</label><br>';
    echo '<input type="email" name="ampy_led_notify_email" value="' . $notify . '" class="regular-text" placeholder="offert@ampy.se"></p>';

    // -- Data source: Excel sheet (editor parity with the battery) ----------
    $t8 = null;
    foreach ( ( $eff['watt_tabell'] ?? [] ) as $rrow ) { if ( ( $rrow['id'] ?? '' ) === 't8_2x36' ) { $t8 = $rrow; break; } }
    echo '<hr><p><label><strong>Data source - Excel file (.xlsx)</strong></label></p>';
    echo '<p style="color:#666;margin-top:-6px;">Upload the LED numbers sheet to update the volatile values (elpris, watt-table prices/watts, burn hours, CO2 factor). Everything else (copy, segments, presets) stays baked in. Leave empty to use the built-in default.</p>';
    echo '<input type="hidden" id="ampy_led_sheet_id" name="ampy_led_sheet_id" value="' . esc_attr( $sheet_id ?: '' ) . '">';
    echo '<p><button type="button" class="button" id="ampy_led_upload_btn">' . ( $sheet_id ? 'Replace Excel file' : 'Choose Excel file from Media Library' ) . '</button> ';
    if ( $sheet_name ) {
        echo '<code id="ampy_led_sheet_name">' . esc_html( $sheet_name ) . '</code> ';
        if ( $sheet_url ) echo '<a href="' . esc_url( $sheet_url ) . '" target="_blank">Open</a>';
    } else {
        echo '<span id="ampy_led_sheet_name" style="color:#888;">No file selected</span>';
    }
    echo '</p>';
    if ( $last ) {
        $ok = ( strpos( (string) $status, 'OK' ) !== false );
        echo '<p style="color:#555;">Last import: ' . esc_html( $last )
           . ' <span style="padding:2px 8px;border-radius:4px;font-size:11px;background:' . ( $ok ? '#d4f7e7' : '#fce8e8' ) . ';color:' . ( $ok ? '#1a6b3c' : '#b91c1c' ) . ';">' . esc_html( $status ) . '</span></p>';
    }
    // Live readout so the editor can see what is active right now.
    echo '<p style="color:#555;">Active data source: <strong>' . esc_html( $src ) . '</strong>'
       . ' &middot; SE3 ' . esc_html( number_format( (float) ( $eff['elpris']['SE3'] ?? 0 ), 2, ',', '' ) ) . ' kr/kWh'
       . ' &middot; T8 2x36 ' . esc_html( number_format( (float) ( $t8['kostnad_kr'] ?? 0 ), 0, ',', ' ' ) ) . ' kr'
       . ' &middot; CO2 ' . esc_html( number_format( (float) ( $eff['co2_faktor']['g_per_kwh'] ?? 0 ), 2, ',', '' ) ) . ' g/kWh'
       . ' &middot; ' . count( $eff['watt_tabell'] ?? [] ) . ' light sources</p>';

    // -- Advanced: raw JSON override (developer escape hatch; wins over the sheet) --
    echo '<hr><p><label><strong>Advanced: raw JSON override</strong> - leave empty to use the sheet/default. When filled, this overrides the uploaded sheet.</label><br>';
    echo '<textarea name="ampy_led_calc_data" rows="5" class="large-text code" placeholder="(advanced) paste a full data JSON to override everything...">' . esc_textarea( $data ) . '</textarea></p>';

    if ( $log_arr ) {
        echo '<hr><p><strong>Recent leads (' . count( $log_arr ) . ')</strong></p><ol style="margin-left:1.2em;">';
        foreach ( array_slice( $log_arr, 0, 10 ) as $row ) {
            $c = $row['contact'] ?? [];
            echo '<li>' . esc_html( $row['time'] ?? '' ) . ' - ' . esc_html( $c['name'] ?? '' )
               . ' (' . esc_html( $c['email'] ?? '' ) . ') - ' . esc_html( $row['segment'] ?? '' )
               . ', ' . (int) ( $row['saving'] ?? 0 ) . ' kr/year</li>';
        }
        echo '</ol>';
    }

    // Media Library picker for the .xlsx (mirrors the battery).
    ?>
    <script>
    (function($){
        var frame;
        $('#ampy_led_upload_btn').on('click', function(e){
            e.preventDefault();
            if ( frame ) { frame.open(); return; }
            frame = wp.media({ title:'Choose LED numbers .xlsx', button:{ text:'Use this file' }, multiple:false });
            frame.on('select', function(){
                var att = frame.state().get('selection').first().toJSON();
                $('#ampy_led_sheet_id').val(att.id);
                $('#ampy_led_sheet_name').replaceWith('<code id="ampy_led_sheet_name">'+att.filename+'</code>');
                $('#ampy_led_upload_btn').text('Replace Excel file');
            });
            frame.open();
        });
    }(jQuery));
    </script>
    <?php
}

add_action( 'admin_enqueue_scripts', function ( $hook ) {
    if ( ! in_array( $hook, [ 'post.php', 'post-new.php' ], true ) ) return;
    global $post;
    if ( isset( $post ) && $post->post_type === 'lead-magnet' ) wp_enqueue_media();
} );

add_action( 'save_post_lead-magnet', function ( $post_id ) {
    if ( ! isset( $_POST['ampy_led_nonce'] ) || ! wp_verify_nonce( $_POST['ampy_led_nonce'], 'ampy_led_save' ) ) return;
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
    if ( ! current_user_can( 'edit_post', $post_id ) ) return;

    update_post_meta( $post_id, '_ampy_led_sida',         sanitize_text_field( $_POST['ampy_led_sida'] ?? 'belysning' ) );
    update_post_meta( $post_id, '_ampy_led_webhook_url',  esc_url_raw(       $_POST['ampy_led_webhook_url'] ?? '' ) );
    update_post_meta( $post_id, '_ampy_led_notify_email', sanitize_email(    $_POST['ampy_led_notify_email'] ?? '' ) );

    // Excel sheet: store the chosen attachment id; parse only when it changes.
    $new_sheet = absint( $_POST['ampy_led_sheet_id'] ?? 0 );
    $old_sheet = (int) get_post_meta( $post_id, '_ampy_led_sheet_id', true );
    update_post_meta( $post_id, '_ampy_led_sheet_id', $new_sheet );
    if ( $new_sheet && $new_sheet !== $old_sheet ) {
        ampy_led_parse_sheet( $post_id, $new_sheet );
    }

    $raw = wp_unslash( $_POST['ampy_led_calc_data'] ?? '' );
    if ( trim( $raw ) === '' ) {
        delete_post_meta( $post_id, '_ampy_led_calc_data' );      // empty -> built-in default
    } elseif ( json_decode( $raw, true ) !== null ) {
        update_post_meta( $post_id, '_ampy_led_calc_data', $raw ); // valid JSON only
    }
} );


/* ==========================================================================
   5. EXCEL PARSER  (editor parity with the battery)
   Reuses the battery's proven ZipArchive + SimpleXML approach, but under
   ampy_led_* names so the two snippets never collide on redeclare. The sheet
   drives only the volatile numbers; everything is merged over the baked
   default, so structure/copy stay fixed and an omitted row keeps its default.
   Convention (mirrors battery): header row = row 1, row 2 is a hint row and is
   skipped, data starts on row 3.
   ========================================================================== */

function ampy_led_col_idx( string $col ): int {
    $col = strtoupper( $col ); $idx = 0;
    for ( $i = 0, $len = strlen( $col ); $i < $len; $i++ ) $idx = $idx * 26 + ( ord( $col[ $i ] ) - 64 );
    return $idx - 1;
}

function ampy_led_xlsx_shared_strings( ZipArchive $zip ): array {
    $xml = $zip->getFromName( 'xl/sharedStrings.xml' );
    if ( ! $xml ) return [];
    $ss = new SimpleXMLElement( $xml ); $out = [];
    foreach ( $ss->si as $si ) {
        if ( isset( $si->t ) ) { $out[] = (string) $si->t; }
        elseif ( isset( $si->r ) ) { $t = ''; foreach ( $si->r as $r ) $t .= (string) $r->t; $out[] = $t; }
        else { $out[] = ''; }
    }
    return $out;
}

function ampy_led_xlsx_sheet_map( ZipArchive $zip ): array {
    $wb = $zip->getFromName( 'xl/workbook.xml' );
    $rels = $zip->getFromName( 'xl/_rels/workbook.xml.rels' );
    if ( ! $wb || ! $rels ) return [];
    $wbx = new SimpleXMLElement( $wb ); $relsx = new SimpleXMLElement( $rels );
    $rid = [];
    foreach ( $relsx->Relationship as $rel ) $rid[ (string) $rel['Id'] ] = 'xl/' . ltrim( (string) $rel['Target'], '/' );
    $map = [];
    foreach ( $wbx->sheets->sheet as $sheet ) {
        $id = (string) $sheet->attributes( 'r', true )->id;
        $nm = (string) $sheet['name'];
        if ( isset( $rid[ $id ] ) ) $map[ $nm ] = $rid[ $id ];
    }
    return $map;
}

function ampy_led_xlsx_read_sheet( ZipArchive $zip, string $path, array $shared ): array {
    $xml = $zip->getFromName( $path );
    if ( ! $xml ) return [];
    $ws = new SimpleXMLElement( $xml ); $rows = [];
    foreach ( $ws->sheetData->row as $row ) {
        $ri = (int) $row['r'] - 1; $rd = [];
        foreach ( $row->c as $cell ) {
            $c = ampy_led_col_idx( preg_replace( '/\d/', '', (string) $cell['r'] ) );
            $t = (string) $cell['t']; $v = (string) $cell->v;
            if ( $t === 's' ) $v = $shared[ (int) $v ] ?? '';
            elseif ( $t === 'b' ) $v = $v === '1' ? 'TRUE' : 'FALSE';
            while ( count( $rd ) <= $c ) $rd[] = '';
            $rd[ $c ] = $v;
        }
        $rows[ $ri ] = $rd;
    }
    ksort( $rows );
    return array_values( $rows );
}

function ampy_led_xlsx_header_map( array $rows ): array { return array_flip( $rows[0] ?? [] ); }

function ampy_led_set_import_status( int $post_id, string $msg ): void {
    update_post_meta( $post_id, '_ampy_led_import_status', $msg );
    update_post_meta( $post_id, '_ampy_led_last_import', current_time( 'mysql' ) );
}

function ampy_led_num( $v ) {
    $f = (float) $v;
    return ( floor( $f ) == $f ) ? (int) $f : $f;
}

function ampy_led_parse_sheet( int $post_id, int $attachment_id ): void {
    $file = get_attached_file( $attachment_id );
    if ( ! $file || ! file_exists( $file ) ) { ampy_led_set_import_status( $post_id, 'Error: file not found on server.' ); return; }
    if ( strtolower( pathinfo( $file, PATHINFO_EXTENSION ) ) !== 'xlsx' ) { ampy_led_set_import_status( $post_id, 'Error: only .xlsx files are supported.' ); return; }
    if ( ! class_exists( 'ZipArchive' ) ) { ampy_led_set_import_status( $post_id, 'Error: PHP ZipArchive extension not available.' ); return; }

    try {
        $zip = new ZipArchive();
        if ( true !== $zip->open( $file ) ) throw new RuntimeException( 'Could not open .xlsx (invalid zip archive).' );
        $shared = ampy_led_xlsx_shared_strings( $zip );
        $map    = ampy_led_xlsx_sheet_map( $zip );
        $read = function ( string $name ) use ( $zip, $map, $shared ): array {
            return isset( $map[ $name ] ) ? ampy_led_xlsx_read_sheet( $zip, $map[ $name ], $shared ) : [];
        };

        $data    = ampy_led_default_data();   // merge sheet numbers over the baked default
        $changed = [];

        // Elpris: omrade -> kr_per_kwh (only override known keys)
        $rows = $read( 'Elpris' );
        if ( $rows ) {
            $col = ampy_led_xlsx_header_map( $rows );
            for ( $i = 2; $i < count( $rows ); $i++ ) {
                $r = $rows[ $i ];
                $o = trim( $r[ $col['omrade'] ] ?? '' );
                $v = $r[ $col['kr_per_kwh'] ] ?? '';
                if ( $o === '' || $v === '' ) continue;
                if ( array_key_exists( $o, $data['elpris'] ) ) { $data['elpris'][ $o ] = (float) $v; $changed['elpris'] = true; }
            }
        }

        // Ljuskallor: join by id, override w_gammal / w_led / lumen / kostnad_kr
        $rows = $read( 'Ljuskallor' );
        if ( $rows ) {
            $col = ampy_led_xlsx_header_map( $rows );
            $by = [];
            for ( $i = 2; $i < count( $rows ); $i++ ) {
                $r = $rows[ $i ];
                $id = trim( $r[ $col['id'] ] ?? '' );
                if ( $id !== '' ) $by[ $id ] = $r;
            }
            foreach ( $data['watt_tabell'] as &$row ) {
                if ( ! isset( $by[ $row['id'] ] ) ) continue;
                $r = $by[ $row['id'] ];
                foreach ( [ 'w_gammal', 'w_led', 'kostnad_kr' ] as $f ) {
                    if ( isset( $col[ $f ] ) && ( $r[ $col[ $f ] ] ?? '' ) !== '' ) $row[ $f ] = ampy_led_num( $r[ $col[ $f ] ] );
                }
                if ( isset( $col['lumen'] ) && ( $r[ $col['lumen'] ] ?? '' ) !== '' ) $row['lumen'] = (string) $r[ $col['lumen'] ];
                $changed['ljuskallor'] = true;
            }
            unset( $row );
        }

        // Brinntid: (segment, kontext) -> timmar_dag
        $rows = $read( 'Brinntid' );
        if ( $rows ) {
            $col = ampy_led_xlsx_header_map( $rows );
            $bt = [];
            for ( $i = 2; $i < count( $rows ); $i++ ) {
                $r = $rows[ $i ];
                $seg = trim( $r[ $col['segment'] ] ?? '' );
                $ctx = trim( $r[ $col['kontext'] ] ?? '' );
                $h   = $r[ $col['timmar_dag'] ] ?? '';
                if ( $seg === '' || $ctx === '' || $h === '' ) continue;
                $bt[ $seg . '|' . $ctx ] = (float) $h;
            }
            foreach ( $data['brinntid_default'] as &$row ) {
                $k = ( $row['segment'] ?? '' ) . '|' . ( $row['kontext'] ?? '' );
                if ( isset( $bt[ $k ] ) ) { $row['timmar_dag'] = ampy_led_num( $bt[ $k ] ); $changed['brinntid'] = true; }
            }
            unset( $row );
        }

        // CO2: nyckel/varde (only g_per_kwh)
        $rows = $read( 'CO2' );
        if ( $rows ) {
            $col = ampy_led_xlsx_header_map( $rows );
            for ( $i = 2; $i < count( $rows ); $i++ ) {
                $r = $rows[ $i ];
                $k = trim( $r[ $col['nyckel'] ] ?? '' );
                $v = $r[ $col['varde'] ] ?? '';
                if ( $k === 'g_per_kwh' && $v !== '' ) { $data['co2_faktor']['g_per_kwh'] = (float) $v; $changed['co2'] = true; }
            }
        }

        // Defaults (optional): segment -> antal
        $rows = $read( 'Defaults' );
        if ( $rows ) {
            $col = ampy_led_xlsx_header_map( $rows );
            for ( $i = 2; $i < count( $rows ); $i++ ) {
                $r = $rows[ $i ];
                $seg = trim( $r[ $col['segment'] ] ?? '' );
                $a   = $r[ $col['antal'] ] ?? '';
                if ( $seg !== '' && $a !== '' && isset( $data['defaults'][ $seg ] ) ) { $data['defaults'][ $seg ]['antal'] = (int) $a; $changed['defaults'] = true; }
            }
        }

        $zip->close();

        update_post_meta( $post_id, '_ampy_led_sheet_data',
            wp_json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) );

        $parts = array_keys( $changed );
        ampy_led_set_import_status( $post_id, 'OK - updated: ' . ( $parts ? implode( ', ', $parts ) : 'no recognised sheets (kept defaults)' ) . '.' );

    } catch ( Throwable $e ) {
        ampy_led_set_import_status( $post_id, 'Error: ' . $e->getMessage() );
    }
}