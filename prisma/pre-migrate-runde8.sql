-- RUNDE 8: koeres FOER "prisma db push" i build-trinnet (se package.json).
-- Lead.source skifter fra fri tekst (String) til et fast enum
-- (LeadSource). Postgres kan kun udfoere denne typeaendring hvis ALLE
-- eksisterende vaerdier allerede matcher praecis en af enum'ets labels -
-- ellers fejler HELE "prisma db push" (og dermed hele build'et) haardt.
-- Denne sætning normaliserer enhver vaerdi der IKKE allerede matcher til
-- "ANDET" (den bevidste fallback-kategori), MENS kolonnen stadig er
-- almindelig tekst - ren streng-sammenligning, ingen risiko.
-- Paakobles kun hvis tabellen/kolonnen allerede findes, saa en helt
-- fresh/tom database (fx et nyt miljoe) ikke faar en fejl her.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Lead' AND column_name = 'source'
  ) THEN
    UPDATE "Lead"
    SET "source" = 'ANDET'
    WHERE "source" IS NULL
       OR "source" NOT IN ('HJEMMESIDE', 'META', 'GOOGLE', 'HENVISNING', 'PERSONLIG_KONTAKT', 'ANDET');
  END IF;
END $$;
