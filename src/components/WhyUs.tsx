import { IconRuler, IconStar, IconTruck, IconTools, IconShield, IconChat } from "./Icons";

export const WHY_ITEMS = [
  { icon: IconRuler, title: "Specialmål", text: "Hvert net fremstilles efter dine mål." },
  { icon: IconStar, title: "Dansk kvalitet", text: "Egen produktion i Glostrup." },
  { icon: IconTruck, title: "Hurtig levering", text: "Sendes til hele Danmark." },
  { icon: IconTools, title: "Nem montering", text: "Sæt op selv – eller få hjælp." },
  { icon: IconShield, title: "Aluminiumsprofiler", text: "Holdbare materialer, lang levetid." },
  { icon: IconChat, title: "Professionel rådgivning", text: "Personlig dansk service." }
];

export default function WhyUs() {
  return (
    <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {WHY_ITEMS.map((it) => {
        const Icon = it.icon;
        return (
          <div key={it.title} className="reveal">
            <span className="text-brand-greendark"><Icon className="h-8 w-8" /></span>
            <h3 className="mt-4 text-lg font-semibold text-brand-ink">{it.title}</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-brand-ink2/65">{it.text}</p>
          </div>
        );
      })}
    </div>
  );
}
