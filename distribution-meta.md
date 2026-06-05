# Distribution & Meta — LED-kalkylatorn (Agent 6)

> Verktyget är en **marknadsföringshändelse**, inte bara en sida. Primär vinkel riktas mot **högvärdes-segmentet** (BRF-styrelser, fastighetsförvaltare, företagare) — aldrig mot bred lågvärde-villaägartrafik. Krok = specificitet + ankare + plikt/deadline.

## 1. Meta-krokstrategi (lysrörsutfasningen som plikt-/deadline-hook)

Bärande mekanik: lysrören är **förbjudna sedan 2023** men får brinna tills de dör → en ångestfråga med deadline som "spara hemma" aldrig får. Varje krok parar en **plikt** (förbudet) med en **stor, sann siffra** (besparingen) och ett **ankare** (specifik fastighetstyp).

| # | Segment | Krok (primär rad) | Mekanik |
|---|---------|-------------------|---------|
| H1 | BRF | "Era trapphus lyser med förbjudna lysrör. Så mycket slänger föreningen i sjön varje år." | plikt + förlust-framing |
| H2 | Företag | "Lysrör får inte säljas sedan 2023. Räkna vad ert armaturbyte sparar — payback ofta ett par år." | deadline + payback-ankare |
| H3 | Fastighetsförvaltare | "~17 miljoner armaturer ska bytas. Hur många sitter i er fastighet — och vad kostar det att vänta?" | branschsiffra + ägd-kostnad |
| H4 | BRF (avgift) | "Sänk avgiftstrycket utan att höja avgiften: byt föreningens lysrör till LED." | intäkts-framing, ingen brådska-gimmick |

**Återhållsamhet (Del 6):** ingen falsk nedräkning, inga uppblåsta påståenden. Deadline är *äkta* (förbudet finns) — det är därför den får användas.

## 2. Annonsvarianter (enligt Ampy_Creative_Playbook_v1.md)

Spec som **måste** hållas (bekräfta mot playbooken innan produktion):
- **Format:** 1080×1350 (portrait 4:5).
- **Kategori-badge** uppe.
- **Gradient-overlay** tyngst i botten.
- **Vit CTA-knapp på mörk bakgrund** — *aldrig* teal CTA på mörkt, *aldrig* emoji som designelement.
- **Riktiga Ampy-bilder** (trapphus, kontor, lager) — ej stock-klyschor.

Varianter att producera: A = BRF-trapphus (H1), B = kontor/lager (H2), C = förvaltar-vinkel (H3). Varje med rubrik = krok, underrad = "Räkna er besparing gratis", CTA = "Räkna nu".

## 3. Målgruppsspec (Meta)

- **Inkludera:** BRF-styrelseroller, fastighetsförvaltning, facility management, småföretagare i lokal-tunga branscher (butik, lager, verkstad), egenföretagare 35–65.
- **Exkludera/nedprioritera:** bred villaägartrafik (det är SEO-/organiskt spår, inte betald högvärdeslead).
- **Retargeting-pooler** (events finns i `app.js` → `dataLayer`): `led_segment_byte`, `led_share`, CTA-klick, beräknat resultat-spann. Bygg lookalikes på de som *nått hög besparingssiffra* + klickat CTA.

## 4. Embed- & korslänksplan

- **Inbäddning** på fem belysningssidor via `data-sida`-attributet (preset i `data.js → embed_preset`):
  `belysning`, `inomhusbelysning`, `utomhusbelysning` (→ BRF/garage), `spotlight` (→ Privat), `armaturer` (→ Företag/lager).
- **Korslänk behörighetskollen → LED-kalkylatorn:** "Byta armatur = grönt, får du göra själv → räkna vad bytet sparar." Och retur-länk tillbaka.
- **Delningskort:** segment-anpassad citatrad genereras i verktyget (`renderShare`), Web Share API + clipboard-fallback. OG-image-renderare återanvänds från behörighetskollen.

## 5. Organisk vinkel (Reddit / FB)

- **Privat (volym/SEO):** r/sweden, r/swedishproblems, FB villaägargrupper — "Räknade ut min LED-besparing, här är matten" (transparent, icke-säljande).
- **BRF (högvärde):** FB BRF-/styrelsegrupper, förvaltargrupper — dela *föreningens* siffra + förbuds-fakta. Det är här delningen är värd mest.

## Acceptanskriterium (Agent 6)
- [x] Varje krok har stopping power (specificitet + ankare + plikt/deadline).
- [x] Primär Meta-vinkel riktad mot högvärde (BRF/Företag), ej lågvärde-DIY.
- [ ] Annons-spec dubbelkollad mot `Ampy_Creative_Playbook_v1.md` (kräver tillgång till playbooken).
- [ ] Förbuds-/branschsiffror daterade och källade (levereras av Agent 1:s dossier).
