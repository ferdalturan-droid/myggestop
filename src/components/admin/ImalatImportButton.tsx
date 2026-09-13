"use client";
import { useRouter } from "next/navigation";

interface ImportItem { productName: string; widthMm: number; heightMm: number }

export default function ImalatImportButton({ musteri, tel, adres, orderId, items }: { musteri: string; tel?: string; adres?: string; orderId?: string; items: ImportItem[] }) {
  const router = useRouter();

  function isPerde(productName: string) {
    return /plisse|plissé|gardin|perde/i.test(productName || "");
  }

  function go() {
    const rows = items.map((it) => {
      const tur = isPerde(it.productName) ? "PERDE" : "SINEKLIK";
      return {
        tur, sys: "1,9", tip: "TEK", model: "YANA", kanat: "HAREKETLI", adet: "1",
        en: String(it.widthMm / 10).replace(".", ","),
        boy: String(it.heightMm / 10).replace(".", ",")
      };
    });
    localStorage.setItem("imalat_import", JSON.stringify({ musteri, tel: tel || "", adres: adres || "", rows, sourceOrderId: orderId || null }));
    router.push("/admin/imalat");
  }

  return <button onClick={go} className="btn-secondary py-2.5 text-sm">Overfør til produktion</button>;
}
