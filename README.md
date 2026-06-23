# Myggestop — Specialfremstillede myggenet (Next.js platform)

En komplet, produktionsklar webplatform til **Myggestop**: en dansk virksomhed der
fremstiller og leverer specialfremstillede myggenet til vinduer og døre i hele Danmark.
Online bestilling med live prisberegner, automatisk PDF + e-mail, og et fuldt admin-panel.

> **Betaling håndteres ikke online.** Ordrer behandles som uforpligtende anmodninger/tilbud.
> Efter bestilling kontakter Myggestop kunden vedr. endelig pris, levering og evt. montering.

---

## Teknologi

| Lag | Valg |
|-----|------|
| Framework | **Next.js 14** (App Router) + **TypeScript** |
| Styling | **Tailwind CSS** (premium skandinavisk design, animationer) |
| Database | **PostgreSQL** via **Prisma ORM** |
| Auth | JWT-session i httpOnly-cookie (`jose` + `bcryptjs`) |
| PDF | `pdf-lib` (branded ordre-PDF) |
| E-mail | `nodemailer` (SMTP) — bekræftelse til kunde + notifikation til admin |
| SEO | Metadata API, JSON-LD schema, Open Graph, `sitemap.xml`, `robots.txt` |

---

## Kom i gang (lokalt)

```bash
# 1) Installér afhængigheder
npm install

# 2) Opret .env ud fra skabelonen og udfyld DATABASE_URL m.m.
cp .env.example .env

# 3) Opret database-skema og generér Prisma-klient
npm run prisma:migrate      # opretter tabeller (kræver kørende PostgreSQL)
npm run db:seed             # opretter admin, produkter, farver, priser, indhold

# 4) Start udviklingsserver
npm run dev                 # http://localhost:3000
```

Admin-panelet ligger på **`/admin`**. Standard-login sættes i `.env`
(`ADMIN_EMAIL` / `ADMIN_PASSWORD`) og oprettes ved `db:seed`.
Standard: `ferdalturan@gmail.com` / `MyggeStop2026!` — **skift adgangskoden**.

### Krav
- Node.js ≥ 18.18
- En PostgreSQL-database (lokal, Supabase, Neon, Railway, RDS osv.)

---

## Miljøvariabler (`.env`)

| Variabel | Beskrivelse |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL-forbindelse |
| `NEXT_PUBLIC_SITE_URL` | Sitets offentlige URL (SEO, canonical, sitemap) |
| `AUTH_SECRET` | Lang tilfældig streng til admin-sessions (min. 32 tegn) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Første admin-bruger (oprettes ved seed) |
| `SMTP_HOST/PORT/SECURE/USER/PASS/FROM` | SMTP til ordre-e-mails |

Hvis SMTP ikke er udfyldt, gemmes ordrer stadig — e-mails springes blot over
(ses i serverloggen), og PDF kan altid hentes i admin.

---

## Funktioner

### Offentligt site (dansk)
- **Forside** med hero, USP-bar, fordele, produkter og store CTA-sektioner
- **Produkter** — Standard Myggenet & Plisségardin (begge i frit specialmål)
- **Bestil Nu** — avanceret ordreformular:
  - Kundeoplysninger (fornavn, efternavn, telefon, e-mail, adresse, postnr, by)
  - **Ubegrænset antal produkter** pr. ordre ("+ Tilføj endnu et produkt")
  - Pr. produkt: rum-navn, produkttype, bredde (mm), højde (mm), farve, kommentar
  - **Visuel målevejledning** med pile og labels ved siden af formularen
  - **Live prisberegner** (se prislogik nedenfor)
  - Valg: *Jeg ønsker montering* / *Kun levering*
  - "Fragt beregnes efter aftale."
- **Galleri** med filtre (Vinduer, Døre, Dobbeltdøre, Plisségardin, Videoer)
- **Videoer** — dedikeret sektion (admin uploader uden kodeændringer)
- **Kontakt** — formular + telefon, e-mail og serviceområde
- **Om Myggestop** og **Hvorfor vælge Myggestop**
- Fuldt responsivt, hurtigt, med bløde scroll-animationer

### Prislogik (vigtigt)
Mål indtastes i **millimeter** og konverteres til m².
Arealet bruges **ikke** matematisk præcist til prisen — der bruges **kommerciel
oprunding op til nærmeste 0,5 m²**:

```
1,25 m² → 1,5 m²    1,80 m² → 2,0 m²
2,08 m² → 2,5 m²    2,88 m² → 3,0 m²
```

- Pris pr. m² sættes **pr. produkt**.
- **Farvetillæg** pr. m² (standardfarver = intet tillæg).
- **Dobbeltdør:** hvis bredden overstiger produktets grænse (standard 1200 mm),
  klassificeres linjen automatisk som *Dobbeltdør* og et fast tillæg lægges til.
- **Montering** (hvis valgt): grundgebyr + beløb pr. produkt.
- Alle satser redigeres i admin. Standardværdier:
  Standard Myggenet 500 kr/m² (max 2500 mm), Plisségardin 400 kr/m² (max 1200 mm),
  farvetillæg 20 kr/m², dobbeltdør 200 kr, montering 500 kr + 100 kr/produkt.

> Prislogikken ligger isoleret i `src/lib/pricing.ts` og er enhedstestet mod
> ovenstående eksempler (kør `node` mod filen — se kommentarer).

### Ordreflow
Ved indsendelse:
1. Unikt ordrenummer genereres — fx **`MYG-2026-0001`** (fortløbende pr. år)
2. Ordren gemmes i databasen
3. **E-mail til admin** + **bekræftelses-e-mail til kunde**
4. **Branded PDF** vedhæftes begge mails (kan også hentes i admin)

### Admin-panel (`/admin`)
Sikret med login. Administrér:
- Produkter (opret/rediger/slet, priser, mål-grænser, dobbeltdør-grænse, egenskaber)
- Priser & gebyrer (farvetillæg, dobbeltdør, montering) + fragttekst
- Farver og farvetillæg
- Galleri & videoer (upload)
- Forside-indhold (hero, intro, CTA)
- SEO (titler, beskrivelser, nøgleord, OG)
- Kontakt-info, logo og admin-e-mail
- **Ordrer:** liste, søgning, statusfilter, CSV-eksport, PDF-download,
  statusskift (Ny ordre → Under behandling → Tilbud sendt → Afventer kunde →
  Afsluttet / Annulleret)

---

## Projektstruktur

```
prisma/schema.prisma      Datamodel (PostgreSQL)
prisma/seed.ts            Seed: admin, produkter, farver, priser, indhold, SEO
src/data/defaults.ts      Alle standard-indstillinger (redigeres i admin)
src/lib/pricing.ts        Prisberegning + kommerciel oprunding (ren logik)
src/lib/pdf.ts            Branded ordre-PDF (pdf-lib)
src/lib/email.ts          SMTP-afsendelse (nodemailer)
src/lib/auth.ts           JWT-session + cookies
src/lib/settings.ts       Indstillinger (DB + defaults flettet)
src/lib/seo.ts            Metadata, JSON-LD schema, OG
src/middleware.ts         Beskytter /admin
src/app/(sider)           Forside, produkter, bestil, galleri, videoer, kontakt, om-os, hvorfor
src/app/admin/...         Admin-dashboard
src/app/api/...           API-routes (orders, products, colors, settings, gallery, contact, auth, upload)
src/components/...        UI-komponenter (Hero, OrderForm, MeasurementGuide, admin/*, ...)
public/logo.svg           Myggestop-logo (udskift med din egen PNG i admin → Kontakt & logo)
```

## Logo
`public/logo.svg` er en skarp, skalerbar gengivelse af Myggestop-logoet, så sitet
ser færdigt ud fra start. Upload din officielle PNG/SVG i **Admin → Kontakt & logo**,
så bruges den i header, footer og PDF.

## Deployment
Deploy fx på **Vercel** (Next.js) med en managed PostgreSQL (Neon/Supabase):
1. Sæt alle miljøvariabler i hosting-dashboardet.
2. Build-kommando: `npm run build` (kører `prisma generate` automatisk).
3. Kør `npx prisma migrate deploy` mod produktionsdatabasen.
4. Kør seed én gang: `npm run db:seed`.

---
© Myggestop. Bygget som en komplet, produktionsklar forretningsplatform.
