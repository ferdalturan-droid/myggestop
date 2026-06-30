"use client";
import { useRouter } from "next/navigation";

export default function ImalatImportButton({ musteri, items }: { musteri: string; items: { widthMm: number; heightMm: number }[] }) {
  const router = useRouter();
  function go() {
    const rows = items.map((it) => ({
      sys: "1,9", tip: "TEK", model: "YANA", adet: "1",
      en: String(it.widthMm / 10).replace(".", ","),
      boy: String(it.heightMm / 10).replace(".", ",")
    }));
    localStorage.setItem("imalat_import", JSON.stringify({ musteri, rows }));
    router.push("/admin/imalat");
  }
  return <button onClick={go} className="btn-secondary py-2.5 text-sm">İmalata aktar</button>;
}
