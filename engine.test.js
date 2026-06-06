/* =============================================================================
   Enhetstester för motorn (vol.3). Körs i node: `node engine.test.js`.
   Laddar data.js + engine.js i en window-shim och asserterar full-precisionsvärden.
   Valideringsgrindens FELfall först (kall cache), sedan beräkningar.
   ============================================================================= */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const sandbox = { window: {} };
vm.createContext(sandbox);
for (const f of ["data.js", "engine.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, f), "utf8"), sandbox, { filename: f });
}
const DATA = sandbox.window.AMPY_LED_DATA;
const calc = sandbox.window.AmpyLED.calculate;
const validateData = sandbox.window.AmpyLED.validateData;
const clone = () => JSON.parse(JSON.stringify(DATA));

let pass = 0, fail = 0;
function approx(label, got, want, tol = 0.5) {
  if (Math.abs(got - want) <= tol) { pass++; console.log(`  ✓ ${label}: ${got.toFixed(2)}`); }
  else { fail++; console.error(`  ✗ ${label}: fick ${got}, väntade ${want}`); }
}
function eq(label, got, want) { if (got === want) { pass++; console.log(`  ✓ ${label}: ${got}`); } else { fail++; console.error(`  ✗ ${label}: fick ${got}, väntade ${want}`); } }
function ok(label, cond) { if (cond) { pass++; console.log(`  ✓ ${label}`); } else { fail++; console.error(`  ✗ ${label}`); } }
function throws(label, fn) { try { fn(); fail++; console.error(`  ✗ ${label}: borde ha kastat`); } catch (e) { pass++; console.log(`  ✓ ${label}`); } }

console.log("Valideringsgrind (kall cache — felfall först)");
throws("okänt schema kastar", () => { const c = clone(); c.schema_version = "0.0.0"; validateData(c); });
throws("w_led > w_gammal kastar", () => { const c = clone(); c.watt_tabell[0].w_led = 9999; validateData(c); });
throws("saknad material_kr kastar", () => { const c = clone(); c.watt_tabell[0].material_kr = "x"; validateData(c); });
throws("icke-numeriskt elpris kastar", () => { const c = clone(); c.elpris.SE3 = "dyrt"; validateData(c); });
throws("default mot okänd typ_id kastar", () => { const c = clone(); c.defaults.brf.typ_id = "spöke"; validateData(c); });

console.log("Fall A — Företag, 2×36W T8, 30 st, kontor 7h, SE3 (1,65)");
const a = calc({ segment: "foretag", typ_id: "t8_2x36", antal: 30, timmar_dag: 7, elprisomrade: "SE3" }, DATA);
approx("kWh/år (48/1000·7·365·30)", a.kwh_ar, 3679.2);
approx("årlig besparing", a.arlig_besparing, 6070.68);
approx("CO2 kg/år (3679,2·464,79/1000)", a.co2_kg_ar, 1710.06, 0.1);
approx("payback (70500/6070,68)", a.payback_ar, 11.613, 0.01);
eq("visa_co2", a.visa_co2, true);

console.log("Fall B — BRF default, 2×36W T8, 80 st, trapphus 11h, SE3");
const b = calc({ segment: "brf", typ_id: "t8_2x36", antal: 80, timmar_dag: 11, elprisomrade: "SE3" }, DATA);
approx("kWh/år", b.kwh_ar, 15417.6);
approx("årlig besparing", b.arlig_besparing, 25439.04);

console.log("Fall C — Privat, GU10 50W, 15 st, hem 4h, SE3 — INGEN CO2, ingen installation");
const c = calc({ segment: "privat", typ_id: "gu10_50", antal: 15, timmar_dag: 4, elprisomrade: "SE3" }, DATA);
approx("kWh/år (44/1000·4·365·15)", c.kwh_ar, 963.6);
approx("årlig besparing", c.arlig_besparing, 1589.94);
eq("visa_co2 (Privat=false)", c.visa_co2, false);
eq("co2 utelämnad", c.co2_kg_ar, null);
approx("payback material-only (1050/1589,94)", c.payback_ar, 0.6604, 0.01);

console.log("Fall D — kr/kWh-override vinner; ogiltig faller tillbaka");
const d1 = calc({ segment: "foretag", typ_id: "t8_2x36", antal: 30, timmar_dag: 7, elprisomrade: "SE3", kr_kwh: 2.40 }, DATA);
approx("besparing med 2,40", d1.arlig_besparing, 8830.08);
const d2 = calc({ segment: "foretag", typ_id: "t8_2x36", antal: 30, timmar_dag: 7, elprisomrade: "SE3", kr_kwh: 0 }, DATA);
eq("ogiltig override → SE3 1,65", d2.breakdown.kr_kwh, 1.65);

console.log("Fall E — nationell default när område saknas");
eq("SEX → 1,50", calc({ segment: "foretag", typ_id: "t8_2x36", antal: 1, timmar_dag: 10, elprisomrade: "SEX" }, DATA).inputs.kr_kwh, 1.50);

console.log("Fall F — kantfall: antal=0 och enormt antal");
const f0 = calc({ segment: "brf", typ_id: "t8_2x36", antal: 0, timmar_dag: 11, elprisomrade: "SE3" }, DATA);
eq("antal=0 → besparing 0", f0.arlig_besparing, 0);
eq("antal=0 → payback null", f0.payback_ar, null);
const fBig = calc({ segment: "brf", typ_id: "t8_2x36", antal: 1e9, timmar_dag: 24, elprisomrade: "SE4" }, DATA);
ok("enormt antal ger ändligt tal", Number.isFinite(fBig.arlig_besparing) && Number.isFinite(fBig.payback_ar));

console.log("Fall G — okänd ljuskälla kastar (felgränskontrakt)");
throws("okänd typ_id kastar", () => calc({ segment: "brf", typ_id: "finns_ej", antal: 1, timmar_dag: 7, elprisomrade: "SE3" }, DATA));

console.log("Fall H — katalog: 27 ljuskällor, privat DIY har installation 0");
eq("antal ljuskällor", DATA.watt_tabell.length, 27);
ok("alla privat-typer har installation 0", DATA.watt_tabell.filter(t => t.kat === "privat").every(t => t.installation_kr === 0));
ok("alla kommersiella har installation > 0", DATA.watt_tabell.filter(t => t.kat === "kommersiell").every(t => t.installation_kr > 0));

console.log(`\n${fail === 0 ? "ALLA GRÖNA" : "RÖDA TESTER"} — ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
