const MYGGENET_MATERIALS = [
  { title: "Karmprofil", text: "Ydre ramme i aluminium, som fastgøres i vindues- eller dørhullet." },
  { title: "Fløjprofil", text: "Den indre ramme (fast eller bevægelig), hvor nettet er spændt op." },
  { title: "Net (fiberglas eller polyester)", text: "Insektafvisende mesh, holdbart og let at se igennem." },
  { title: "Plissestrimmel og plissesæt", text: "Foldemekanisme til foldbare (plisse-) modeller." },
  { title: "Monteringsbånd", text: "Fastholder nettet i fløjprofilen." },
  { title: "Snor (spline)", text: "Gummi-/plastiksnor der presser nettet fast i kanalen." },
  { title: "Magnet", text: "Sikrer lukning i midten ved dobbeltdøre." },
  { title: "Fitil/tætningsliste", text: "Tætner mellem karm og vindue/dør mod træk og fugt." }
];

const PLISSE_MATERIALS = [
  { title: "Alu top- og bundprofil", text: "Skinner som kaldsen er monteret i foroven og forneden." },
  { title: "Plissékain", text: "Brandhæmmende, fugtafvisende polyesterstof, kan aftørres med en fugtig klud." },
  { title: "Selvklæbende strimmel", text: "Fastgør stoffet til profilen." },
  { title: "Snor-/kordelmekanisme", text: "Styrer den bevægelige fløj op/ned eller til siden." },
  { title: "Fikserings-/låsedele", text: "Holder den bevægelige fløj fast i den ønskede position." },
  { title: "Monteringsbeslag", text: "Til fastgørelse på glas eller karm." }
];

export default function MaterialsSection() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="card p-6">
        <h3 className="text-lg font-bold text-brand-ink">Myggenet — materialer</h3>
        <p className="mt-1 text-sm text-brand-ink2/65">Det er dette, dit myggenet er lavet af.</p>
        <ul className="mt-4 space-y-3">
          {MYGGENET_MATERIALS.map((m) => (
            <li key={m.title} className="text-sm">
              <span className="font-semibold text-brand-ink">{m.title}</span>
              <span className="text-brand-ink2/70"> — {m.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="card p-6">
        <h3 className="text-lg font-bold text-brand-ink">Plissegardin — materialer</h3>
        <p className="mt-1 text-sm text-brand-ink2/65">Det er dette, din plissegardin er lavet af.</p>
        <ul className="mt-4 space-y-3">
          {PLISSE_MATERIALS.map((m) => (
            <li key={m.title} className="text-sm">
              <span className="font-semibold text-brand-ink">{m.title}</span>
              <span className="text-brand-ink2/70"> — {m.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
