"use client";
import { PRODUCT_CATEGORY_OPTIONS, categoryKey, SUBTYPE_OPTIONS, LAYOUT_OPTIONS, KANAT_OPTIONS, farveFelterRelevanteForTur, felterRelevanteForTur, ROOM_OPTIONS } from "@/lib/calcOptions";

// RUNDE 10 (§A/§C - "alt udover kommentar, antal, højde, bredde skal være
// dropdowns", "fælles visuelt sprog med Opmålingsliste"): ÉT sted der
// tegner alle felterne for én måle-/produktlinje, genbrugt identisk i
// Leads' "Mål (forventede/reelle)" og Installatørens Opmålingsliste, så de
// to formularer aldrig kan komme ud af trit med hinanden igen. Tekst-/
// talfelter committer på "blur" (som hidtil - undgår at gemme/genindlæse
// pr. tastetryk, som er den sandsynlige årsag til at linjer har "byttet
// plads" mens man skrev), dropdowns committer med det samme (et diskret
// valg, ikke løbende indtastning).
export interface RowValue {
  roomName: string;
  tur: string;
  tip: string;
  sys: string;
  layout: string;
  kanat: string;
  subType: string;
  adet: number | string;
  widthMm: number | string | null;
  heightMm: number | string | null;
  colorName: string;
  fabricColorName: string;
  rodColorName: string;
  comment: string;
}

export interface ColorOption { name: string; category: string }
export interface ProfileSizeOption { value: string; label: string }

export function MeasurementRowFields({
  value, onField, colors, profileSizes
}: {
  value: RowValue;
  onField: (patch: Partial<RowValue>) => void;
  colors: ColorOption[];
  profileSizes: ProfileSizeOption[];
}) {
  const rel = felterRelevanteForTur(value.tur || "SINEKLIK");
  const farveRel = farveFelterRelevanteForTur(value.tur || "SINEKLIK");
  const lbl = "mb-0.5 block text-[11px] font-medium text-brand-ink2/60";
  const cls = "input py-2 text-sm";
  const myggenetColors = colors.filter((c) => c.category === "MYGGENET");
  const stofColors = colors.filter((c) => c.category === "GARDIN_STOF");
  const stangColors = colors.filter((c) => c.category === "GARDIN_STANG");
  const sizes = profileSizes.length > 0 ? profileSizes : [{ value: "1,9", label: "1,9" }, { value: "2,8", label: "2,8" }];
  const roomIsKendt = ROOM_OPTIONS.includes(value.roomName);

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
      <label className="block">
        <span className={lbl}>Rum</span>
        <select className={cls} value={roomIsKendt ? value.roomName : "Andet"} onChange={(e) => onField({ roomName: e.target.value === "Andet" ? "" : e.target.value })}>
          <option value="Andet">Vælg rum...</option>
          {ROOM_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </label>
      {!roomIsKendt && (
        <label className="block">
          <span className={lbl}>Rum (angiv)</span>
          <input className={cls} defaultValue={value.roomName} onBlur={(e) => onField({ roomName: e.target.value })} placeholder="F.eks. Bryggers" />
        </label>
      )}
      <label className="block">
        <span className={lbl}>Produkttype</span>
        <select className={cls} value={categoryKey(value.tur || "SINEKLIK", value.tip || "TEK")} onChange={(e) => { const [tur, tip] = e.target.value.split("|"); onField({ tur, tip }); }}>
          {PRODUCT_CATEGORY_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <label className="block">
        <span className={lbl}>Undertype</span>
        <select className={cls} value={value.subType || "NORMAL"} onChange={(e) => onField({ subType: e.target.value })}>
          {SUBTYPE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      {rel.sys && (
        <label className="block">
          <span className={lbl}>Profilstørrelse</span>
          <select className={cls} value={value.sys || "1,9"} onChange={(e) => onField({ sys: e.target.value })}>
            {sizes.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
      )}
      {rel.layout && (
        <label className="block">
          <span className={lbl}>Retning</span>
          <select className={cls} value={value.layout || "YANA"} onChange={(e) => onField({ layout: e.target.value })}>
            {LAYOUT_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      )}
      {rel.kanat && (
        <label className="block">
          <span className={lbl}>Fløj</span>
          <select className={cls} value={value.kanat || "HAREKETLI"} onChange={(e) => onField({ kanat: e.target.value })}>
            {KANAT_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      )}
      {farveRel.net && (
        <label className="block">
          <span className={lbl}>Myggenet Farve</span>
          <select className={cls} value={value.colorName || ""} onChange={(e) => onField({ colorName: e.target.value })}>
            <option value="">Standard</option>
            {myggenetColors.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </label>
      )}
      {farveRel.stof && (
        <label className="block">
          <span className={lbl}>Gardin Farve</span>
          <select className={cls} value={value.fabricColorName || ""} onChange={(e) => onField({ fabricColorName: e.target.value })}>
            <option value="">Standard</option>
            {stofColors.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </label>
      )}
      {farveRel.stang && (
        <label className="block">
          <span className={lbl}>Gardin Stang Farve</span>
          <select className={cls} value={value.rodColorName || ""} onChange={(e) => onField({ rodColorName: e.target.value })}>
            <option value="">Standard</option>
            {stangColors.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </label>
      )}
      <label className="block">
        <span className={lbl}>Antal</span>
        <input className={cls} inputMode="numeric" defaultValue={value.adet ?? 1} onBlur={(e) => onField({ adet: e.target.value.replace(/[^0-9]/g, "") || "1" })} />
      </label>
      <label className="block">
        <span className={lbl}>Bredde (mm)</span>
        <input className={cls} inputMode="decimal" placeholder="mm" defaultValue={value.widthMm ?? ""} onBlur={(e) => onField({ widthMm: e.target.value.replace(/[^0-9.,]/g, "") })} />
      </label>
      <label className="block">
        <span className={lbl}>Højde (mm)</span>
        <input className={cls} inputMode="decimal" placeholder="mm" defaultValue={value.heightMm ?? ""} onBlur={(e) => onField({ heightMm: e.target.value.replace(/[^0-9.,]/g, "") })} />
      </label>
      <label className="block sm:col-span-2">
        <span className={lbl}>Kommentar</span>
        <input className={cls} defaultValue={value.comment || ""} onBlur={(e) => onField({ comment: e.target.value })} />
      </label>
    </div>
  );
}

export const BLANK_ROW: RowValue = {
  roomName: "", tur: "SINEKLIK", tip: "TEK", sys: "1,9", layout: "YANA", kanat: "HAREKETLI", subType: "NORMAL",
  adet: 1, widthMm: "", heightMm: "", colorName: "", fabricColorName: "", rodColorName: "", comment: ""
};
