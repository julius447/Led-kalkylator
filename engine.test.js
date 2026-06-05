/* =============================================================================
   Enhetstester för motorn (Agent 2 acceptanskriterium: "enhetstester mot kända
   fall"). Körs i node: `node engine.test.js`. Laddar data.js + engine.js i en
   minimal window-shim och asserterar full-precisionsvärden mot handräknade fall.
   ============================================================================= */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

// Minimal window-shim så IIFE:erna kan registrera sig.
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const f of ["data.js", "engine.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, f), "utf8"), sandbox, { filename: f });
}
const DATA = sandbox.window.AMPY_LED_DATA;
const calc = sandbox.window.AmpyLED.calculate;

let pass = 0, fail = 0;
function approx(label, got, want, tol = 0.5) {
  if (Math.abs(got - want) <= tol) { pass++; console.log(`  ✓ ${label}: ${got.toFixed(2)}`); }
  else { fail++; console.error(`  ✗ ${label}: fick ${got}, väntade ${want}`); }
}
function eq(label, got, want) {
  if (got === want) { pass++; console.log(`  ✓ ${label}: ${got}`); }
  else { fail++; console.error(`  ✗ ${label}: fick ${got}, väntade ${want}`); }
}

console.log("Fall 1 — Företag, 25 armaturer 2×36W T8, kontor 7h, SE3 (1,65)");
const r1 = calc({ segment: "foretag", typ_id: "t8_arm", antal: 25, timmar_dag: 7, elprisomrade: "SE3" }, DATA);
// (72-34)/1000 * 7 * 365 * 25 = 2427,25 kWh ; *1,65 = 4004,9625 kr
approx("kWh/år", r1.kwh_ar, 2427.25);
approx("årlig besparing", r1.arlig_besparing, 4004.9625);
approx("payback (58750/4004,96)", r1.payback_ar, 14.6693, 0.01);
approx("CO2 kg/år (2427,25*464,79/1000)", r1.co2_kg_ar, 1128.16, 0.1);
eq("visa_co2", r1.visa_co2, true);

console.log("Fall 2 — BRF garage 24h, 60 armaturer, SE3");
const r2 = calc({ segment: "brf", typ_id: "t8_arm", antal: 60, timmar_dag: 24, elprisomrade: "SE3" }, DATA);
// (38)/1000*24*365*60 = 19972,8 kWh ; *1,65 = 32955,12
approx("kWh/år", r2.kwh_ar, 19972.8);
approx("årlig besparing", r2.arlig_besparing, 32955.12);

console.log("Fall 3 — Privat, 12 GU10 50W, hem 2h, SE3 — INGEN CO2, ingen installation");
const r3 = calc({ segment: "privat", typ_id: "gu10_50", antal: 12, timmar_dag: 2, elprisomrade: "SE3" }, DATA);
// (50-6)/1000*2*365*12 = 385,44 kWh ; *1,65 = 635,976
approx("kWh/år", r3.kwh_ar, 385.44);
approx("årlig besparing", r3.arlig_besparing, 635.976);
eq("visa_co2 (Privat=false)", r3.visa_co2, false);
eq("co2 utelämnad", r3.co2_kg_ar, null);
// material 12*70=840, ingen installation för Privat → payback 840/635,976 = 1,3209 år
approx("payback material-only", r3.payback_ar, 1.3209, 0.01);

console.log("Fall 4 — okänt schema vägras");
try { calc({ segment: "foretag", typ_id: "t8_arm", antal: 1, timmar_dag: 1, elprisomrade: "SE3" }, { schema_version: "0.0.0" }); fail++; console.error("  ✗ borde ha kastat"); }
catch (e) { pass++; console.log("  ✓ kastade på okänt schema"); }

console.log("Fall 5 — nationell default när område saknas");
const r5 = calc({ segment: "foretag", typ_id: "t8_arm", antal: 1, timmar_dag: 10, elprisomrade: "SEX" }, DATA);
eq("faller tillbaka på nationellt_default 1,50", r5.inputs.kr_kwh, 1.50);

console.log(`\n${fail === 0 ? "ALLA GRÖNA" : "RÖDA TESTER"} — ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
