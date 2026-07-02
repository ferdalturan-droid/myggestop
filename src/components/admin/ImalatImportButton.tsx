"use client";
import { useRouter } from "next/navigation";

interface ImportItem { productName: string; widthMm: number; heightMm: number }

export default function ImalatImportButton({ musteri, tel, adres, items }: { musteri: string; tel?: string; adres?: string; items: ImportItem[] }) {
  const router = useRouter();

  function isPerde(productName: string) {
    return /plisse|plissé|gardin|perde/i.test(productName || "");
  }

  function go() {
    const sineklikItems = items.filter((it) => !isPerde(it.productName));
    const perdeItems = items.filter((it) => isPerde(it.productName));

    if (sineklikItems.length > 0) {
      const rows = sineklikItems.map((it) => ({
        sys: "1,9", tip: "TEK", model: "YANA", adet: "1",
        en: String(it.widthMm / 10).replace(".", ","),
        boy: String(it.heightMm / 10).replace(".", ",")
      }));
      localStorage.setItem("imalat_import", JSON.stringify({ musteri, tel: tel || "", adres: adres || "", rows }));
    }

    if (perdeItems.length > 0) {
      const rows = perdeItems.map((it) => ({
        kanat: "HAREKETLI", adet: "1",
        en: String(it.widthMm / 10).replace(".", ","),
        boy: String(it.heightMm / 10).replace(".", ",")
      }));
      localStorage.setItem("perde_import", JSON.stringify({ musteri, tel: tel || "", adres: adres || "", rows }));
    }

    // Vis fanen der matcher ordren: hvis der kun er gardin-varer, åbn Gardin-fanen.
    if (perdeItems.length > 0 && sineklikItems.length === 0) {
      localStorage.setItem("imalat_mode", "PERDE");
    } else if (sineklikItems.length > 0) {
      localStorage.setItem("imalat_mode", "SINEKLIK");
    }

    router.push("/admin/imalat");
  }

  return <button onClick={go} className="btn-secondary py-2.5 text-sm">Overfør til produktion</button>;
}
