import { IconRuler, IconShield, IconChat, IconTruck, IconMap, IconStar, IconLeaf } from "./Icons";

export const WHY_ITEMS = [
  { icon: IconRuler, title: "Specialmål", text: "Hvert net produceres præcist efter dine mål — perfekt pasform til netop dine vinduer og døre." },
  { icon: IconStar, title: "Høj kvalitet", text: "Solide aluminiumsrammer og finmasket net, der holder år efter år." },
  { icon: IconChat, title: "Professionel rådgivning", text: "Vi hjælper dig med at vælge den rette løsning — venlig dansk kundeservice." },
  { icon: IconTruck, title: "Levering i hele Danmark", text: "Vi sender dine specialfremstillede net direkte til døren, uanset hvor du bor." },
  { icon: IconMap, title: "Montering i København og omegn", text: "Onsker du montering, klarer vores montører det hele i hovedstadsområdet." },
  { icon: IconShield, title: "Lang levetid", text: "Vejrbestandige materialer designet til mange års brug — ude som inde." },
  { icon: IconLeaf, title: "Elegant design", text: "Diskrete, stilrene rammer der passer til dansk arkitektur og indretning." }
];

export default function WhyUs() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {WHY_ITEMS.map((it, i) => {
        const Icon = it.icon;
        return (
          <div key={it.title} className="reveal card group p-6 transition hover:-translate-y-1 hover:shadow-soft" style={{ transitionDelay: `${i * 40}ms` }}>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand-blue/15 to-brand-green/15 text-brand-bluedark transition group-hover:from-brand-blue group-hover:to-brand-bluedark group-hover:text-white">
              <Icon />
            </span>
            <h3 className="mt-4 text-lg font-bold text-brand-ink">{it.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-ink2/75">{it.text}</p>
          </div>
        );
      })}
    </div>
  );
}
