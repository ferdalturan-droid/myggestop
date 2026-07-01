"use client";
import { useEffect, useState } from "react";
import ImalatCalc from "./ImalatCalc";
import PerdeCalc from "./PerdeCalc";

export default function ImalatShell() {
  const [mode, setMode] = useState<"SINEKLIK" | "PERDE">("SINEKLIK");
  useEffect(() => { const m = localStorage.getItem("imalat_mode"); if (m === "PERDE" || m === "SINEKLIK") setMode(m); }, []);
  useEffect(() => { localStorage.setItem("imalat_mode", mode); }, [mode]);
  return (
    <div>
      <div className="mb-5 flex w-fit gap-1 rounded-full border border-brand-line bg-white p-1">
        {(["SINEKLIK", "PERDE"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${mode === m ? "bg-brand-greendark text-white" : "text-brand-ink2"}`}>{m === "SINEKLIK" ? "Sineklik" : "Perde"}</button>
        ))}
      </div>
      {mode === "SINEKLIK" ? <ImalatCalc /> : <PerdeCalc />}
    </div>
  );
}
