import Link from "next/link";

export default function Footer({ contact, logoUrl }: { contact: any; logoUrl: string }) {
  return (
    <footer className="grain-dark mt-10 text-slate-300">
      <div className="container-page grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="Myggestop" className="h-10 w-auto brightness-0 invert" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
            Specialfremstillede myggenet til vinduer og døre. Levering i hele Danmark — montering i København og omegn.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Navigation</h4>
          <ul className="space-y-2 text-sm">
            {[
              ["/produkter", "Produkter"],
              ["/bestil", "Bestil nu"],
              ["/galleri", "Galleri"],
              ["/videoer", "Videoer"]
            ].map(([h, l]) => (
              <li key={h}>
                <Link href={h} className="text-slate-400 transition hover:text-brand-green">
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Kontakt</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="hover:text-brand-green">
                {contact.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${contact.email}`} className="hover:text-brand-green">
                {contact.email}
              </a>
            </li>
            <li>
              {contact.address}, {contact.postalCode} {contact.city}
            </li>
            <li>{contact.openingHours}</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Serviceområde</h4>
          <p className="text-sm leading-relaxed text-slate-400">{contact.serviceAreaText}</p>
          <Link href="/bestil" className="btn-green mt-4">
            Anmod om tilbud
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {contact.companyName}. Alle rettigheder forbeholdes.{contact.cvr && contact.cvr !== "00000000" ? ` · CVR ${contact.cvr}` : ""}</p>
          <p>
            Myggenet · Insektnet · Fluenet · Myggedøre · Plisségardin
          </p>
        </div>
      </div>
    </footer>
  );
}
