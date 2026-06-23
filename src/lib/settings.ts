import { prisma } from "./prisma";
import { defaultSettings, AppSettings } from "@/data/defaults";

type SettingsKey = keyof AppSettings;

function deepMerge<T>(base: T, override: any): T {
  if (override == null) return base;
  if (typeof base !== "object" || Array.isArray(base)) return (override ?? base) as T;
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...base };
  for (const k of Object.keys(base as any)) {
    out[k] = k in override ? deepMerge((base as any)[k], override[k]) : (base as any)[k];
  }
  // medtag ekstra nogler fra override
  for (const k of Object.keys(override)) if (!(k in out)) out[k] = override[k];
  return out as T;
}

/** Hent en enkelt indstillingsgruppe (flettet med defaults). */
export async function getSetting<K extends SettingsKey>(key: K): Promise<AppSettings[K]> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return deepMerge(defaultSettings[key], row?.value);
}

/** Hent alle indstillingsgrupper. */
export async function getAllSettings(): Promise<AppSettings> {
  const rows = await prisma.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const out: any = {};
  for (const key of Object.keys(defaultSettings) as SettingsKey[]) {
    out[key] = deepMerge(defaultSettings[key], map.get(key));
  }
  return out as AppSettings;
}

export async function saveSetting<K extends SettingsKey>(key: K, value: AppSettings[K]) {
  await prisma.setting.upsert({
    where: { key },
    update: { value: value as any },
    create: { key, value: value as any }
  });
}
