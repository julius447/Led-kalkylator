/* =============================================================================
   Enhetstester för motorn (Agent 2 acceptanskriterium: "enhetstester mot kända
   fall"). Körs i node: `node engine.test.js`. Laddar data.js + engine.js i en
   minimal window-shim och asserterar full-precisionsvärden mot handräknade fall.

   OBS: validateData() cachar efter första LYCKADE validering, så de FÖRSTA
   testerna här är valideringsgrindens FELfall (kall cache), därefter beräkningar.
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
function eq(label, got, want) {
  if (got === want) { pass++; console.log(`  ✓ ${label}: ${got}`); }
  else { fail++; console.error(`  ✗ ${label}: fick ${got}, väntade ${want}`); }
}
function ok(label, cond) { if (cond) { pass++; console.log(`  ✓ ${label}`); } else { fail++; console.error(`  ✗ ${label}`); } }
function throws(label, fn) { try { fn(); fail++; console.error(`  ✗ ${label}: borde ha kastat`); } catch (e) { pass++; console.log(`  ✓ ${label}`); } }

console.log("Valideringsgrind (kall cache — felfall först)");
throws("okänt schema kastar", () => { const c = clone(); c.schema_version = "0.0.0"; validateData(c); });
throws("w_led > w_gammal kastar", () => { const c = clone(); c.watt_tabell[0].w_led = 9999; validateData(c); });
throws("dinglande kostnad_id kastar", () => { const c = clone(); c.watt_tabell[0].kostnad_id = "finns_ej"; validateData(c); });
throws("icke-numeriskt elpris kastar", () => { const c = clone(); c.elpris.SE3 = "dyrt"; validateData(c); });
throws("default mot okänd typ_id kastar", () => { const c = clone(); c.defaults.foretag.typ_id = "spöke"; validateData(c); });

console.log("Fall 1 — Företag, 25 armaturer 2×36W T8, kontor 7h, SE3 (1,65)");
const r1 = calc({ segment: "foretag", typ_id: "t8_arm", antal: 25, timmar_dag: 7, elprisomrade: "SE3" }, DATA);
approx("kWh/år", r1.kwh_ar, 2427.25);
approx("årlig besparing", r1.arlig_besparing, 4004.9625);
approx("payback (58750/4004,96)", r1.payback_ar, 14.6693, 0.01);
approx("CO2 kg/år (2427,25*464,79/1000)", r1.co2_kg_ar, 1128.16, 0.1);
eq("visa_co2", r1.visa_co2, true);

console.log("Fall 2 — BRF garage 24h, 60 armaturer, SE3");
const r2 = calc({ segment: "brf", typ_id: "t8_arm", antal: 60, timmar_dag: 24, elprisomrade: "SE3" }, DATA);
approx("kWh/år", r2.kwh_ar, 19972.8);
approx("årlig besparing", r2.arlig_besparing, 32955.12);

console.log("Fall 3 — Privat, 12 GU10 50W, hem 2h, SE3 — INGEN CO2, ingen installation");
const r3 = calc({ segment: "privat", typ_id: "gu10_50", antal: 12, timmar_dag: 2, elprisomrade: "SE3" }, DATA);
approx("kWh/år", r3.kwh_ar, 385.44);
approx("årlig besparing", r3.arlig_besparing, 635.976);
eq("visa_co2 (Privat=false)", r3.visa_co2, false);
eq("co2 utelämnad", r3.co2_kg_ar, null);
approx("payback material-only", r3.payback_ar, 1.3209, 0.01);

console.log("Fall 4 — kr/kWh-override vinner över områdesdefault");
const r4 = calc({ segment: "foretag", typ_id: "t8_arm", antal: 25, timmar_dag: 7, elprisomrade: "SE3", kr_kwh: 2.40 }, DATA);
eq("breakdown.kr_kwh = override", r4.breakdown.kr_kwh, 2.40);
approx("besparing med 2,40 (2427,25*2,40)", r4.arlig_besparing, 5825.4);
// ogiltig override (<=0) faller tillbaka på områdesdefault
const r4b = calc({ segment: "foretag", typ_id: "t8_arm", antal: 25, timmar_dag: 7, elprisomrade: "SE3", kr_kwh: 0 }, DATA);
eq("ogiltig override → SE3 1,65", r4b.breakdown.kr_kwh, 1.65);

console.log("Fall 5 — nationell default när område saknas");
const r5 = calc({ segment: "foretag", typ_id: "t8_arm", antal: 1, timmar_dag: 10, elprisomrade: "SEX" }, DATA);
eq("faller tillbaka på nationellt_default 1,50", r5.inputs.kr_kwh, 1.50);

console.log("Fall 6 — kantfall: antal=0 (giltigt graciöst läge) och enormt antal");
const r6 = calc({ segment: "foretag", typ_id: "t8_arm", antal: 0, timmar_dag: 7, elprisomrade: "SE3" }, DATA);
eq("antal=0 → besparing 0", r6.arlig_besparing, 0);
eq("antal=0 → payback null", r6.payback_ar, null);
const r7 = calc({ segment: "foretag", typ_id: "t8_arm", antal: 1e9, timmar_dag: 24, elprisomrade: "SE4" }, DATA);
ok("enormt antal ger ändligt tal", Number.isFinite(r7.arlig_besparing) && Number.isFinite(r7.payback_ar));

console.log("Fall 7 — okänd ljuskälla kastar (felgränskontrakt för render)");
throws("okänd typ_id kastar", () => calc({ segment: "foretag", typ_id: "finns_ej", antal: 1, timmar_dag: 7, elprisomrade: "SE3" }, DATA));

console.log(`\n${fail === 0 ? "ALLA GRÖNA" : "RÖDA TESTER"} — ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
