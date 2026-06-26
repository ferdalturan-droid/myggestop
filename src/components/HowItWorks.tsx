const STEPS = [
  { n: "1", title: "Vælg produkt", text: "Myggenet eller plisségardin." },
  { n: "2", title: "Indtast mål", text: "Bredde og højde i mm." },
  { n: "3", title: "Vi producerer", text: "Fremstilles efter dine mål." },
  { n: "4", title: "Levering eller montering", text: "I hele Danmark." }
];

export default function HowItWorks() {
  return (
    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((s) => (
        <div key={s.n} className="reveal">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-line text-lg font-semibold text-brand-greendark">{s.n}</div>
          <h3 className="mt-5 text-lg font-semibold text-brand-ink">{s.title}</h3>
          <p className="mt-1.5 text-[15px] leading-relaxed text-brand-ink2/65">{s.text}</p>
        </div>
      ))}
    </div>
  );
}
