export default function MeasurementGuide() {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-brand-line bg-brand-mist px-6 py-4">
        <h3 className="text-lg font-bold text-brand-ink">Målevejledning</h3>
        <p className="text-sm text-brand-ink2/70">Sådan måler og monterer du korrekt</p>
      </div>
      <div className="p-6">
        <svg viewBox="0 0 320 300" className="mx-auto w-full max-w-sm" role="img" aria-label="Illustration af bredde og højde">
          <defs>
            <pattern id="mg-net" width="13" height="13" patternUnits="userSpaceOnUse">
              <path d="M13 0H0V13" fill="none" stroke="#cfe0ef" strokeWidth="1" />
            </pattern>
            <marker id="ah" markerWidth="9" markerHeight="9" refX="5" refY="4.5" orient="auto">
              <path d="M0 0L9 4.5L0 9Z" fill="#1b8de0" />
            </marker>
            <marker id="ah2" markerWidth="9" markerHeight="9" refX="4" refY="4.5" orient="auto">
              <path d="M9 0L0 4.5L9 9Z" fill="#1b8de0" />
            </marker>
            <marker id="av" markerWidth="9" markerHeight="9" refX="4.5" refY="5" orient="auto">
              <path d="M0 0L4.5 9L9 0Z" fill="#5cc524" />
            </marker>
            <marker id="av2" markerWidth="9" markerHeight="9" refX="4.5" refY="4" orient="auto">
              <path d="M0 9L4.5 0L9 9Z" fill="#5cc524" />
            </marker>
          </defs>

          <rect x="60" y="50" width="200" height="200" rx="6" fill="#eef4fa" stroke="#0d1b2a" strokeWidth="3" />
          <rect x="74" y="64" width="172" height="172" rx="3" fill="url(#mg-net)" stroke="#1b8de0" strokeWidth="6" />

          <line x1="74" y1="40" x2="246" y2="40" stroke="#1b8de0" strokeWidth="2.5" markerStart="url(#ah2)" markerEnd="url(#ah)" />
          <rect x="135" y="28" width="50" height="22" rx="11" fill="#1b8de0" />
          <text x="160" y="43" textAnchor="middle" fontFamily="Arial" fontSize="12" fontWeight="700" fill="#fff">Bredde</text>

          <line x1="278" y1="64" x2="278" y2="236" stroke="#5cc524" strokeWidth="2.5" markerStart="url(#av2)" markerEnd="url(#av)" />
          <rect x="262" y="139" width="44" height="22" rx="11" fill="#5cc524" transform="rotate(90 284 150)" />
          <text x="284" y="154" textAnchor="middle" fontFamily="Arial" fontSize="12" fontWeight="700" fill="#fff" transform="rotate(90 284 150)">Højde</text>

          <text x="160" y="270" textAnchor="middle" fontFamily="Arial" fontSize="12" fill="#6b7785">Mål fra trækanten — i mm</text>
        </svg>

        <div className="mt-5 rounded-xl bg-brand-green/5 p-4 text-sm leading-relaxed text-brand-ink2">
          <p className="font-semibold text-brand-greendark">Vælg monteringsside:</p>
          <ul className="mt-2 space-y-1.5 text-brand-ink2/85">
            <li>• Åbner vinduet/døren <strong>udad</strong> → myggenettet monteres <strong>indvendigt</strong> (indefra).</li>
            <li>• Åbner vinduet/døren <strong>indad</strong> → myggenettet monteres <strong>udvendigt</strong> (udefra).</li>
          </ul>
        </div>

        <div className="mt-3 rounded-xl bg-brand-blue/5 p-4 text-sm leading-relaxed text-brand-ink2">
          <p className="font-semibold text-brand-bluedark">Sådan måler du:</p>
          <p className="mt-1">
            Mål altid bredde og højde fra <strong>trækanten</strong> (trærammen) på vinduet eller døren. Angiv alle mål i
            millimeter (mm).
          </p>
          <ul className="mt-3 space-y-1.5 text-brand-ink2/80">
            <li>• <strong>Bredde:</strong> mål vandret fra trækant til trækant.</li>
            <li>• <strong>Højde:</strong> mål lodret fra trækant til trækant.</li>
            <li>• Mål gerne tre steder og brug det mindste mål.</li>
            <li>• 1 cm = 10 mm (f.eks. 80 cm = 800 mm).</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
