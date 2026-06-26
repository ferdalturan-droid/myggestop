"use client";
import { useState } from "react";

const FAQ = [
  { q: "Hvad koster et myggenet?", a: "Prisen afhænger af mål og produkt. Du får et uforpligtende estimat med det samme, når du indtaster dine mål i bestillingen – og vi vender tilbage med en endelig pris." },
  { q: "Leverer I i hele Danmark?", a: "Ja. Vi sender vores specialfremstillede net til hele Danmark. Montering tilbydes i København og omegn." },
  { q: "Hvordan måler jeg korrekt?", a: "Mål bredde og højde fra trækanten på vinduet eller døren – altid i millimeter (mm). Du finder en málevejledning ved bestillingen." },
  { q: "Skal jeg betale online?", a: "Nej. Din bestilling er en uforpligtende anmodning. Vi kontakter dig om endelig pris, levering og eventuel montering." },
  { q: "Kan jeg selv montere?", a: "Ja, vores net er nemme at sætte op uden værktøj. Ønsker du montering, klarer vi det i København og omegn." }
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-brand-line border-y border-brand-line">
      {FAQ.map((f, i) => (
        <div key={i} className="reveal">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 py-6 text-left"
          >
            <span className="text-lg font-medium text-brand-ink">{f.q}</span>
            <span className={`flex-none text-2xl font-light text-brand-greendark transition-transform ${open === i ? "rotate-45" : ""}`}>+</span>
          </button>
          {open === i && <p className="-mt-2 pb-6 pr-8 text-[15px] leading-relaxed text-brand-ink2/70">{f.a}</p>}
        </div>
      ))}
    </div>
  );
}
