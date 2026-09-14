// RUNDE 5 (§"Koordinator indsætter dette i Installators (specifik person)
// kalender"): installation ligger hos en NAVNGIVEN installatør, ikke en
// generisk "INSTALLER"-bunke.
// RUNDE 8 ("Calendar (tentative and fixed) can only be created directly
// from calendar, i dont want any ui possiblity to auto-create as it
// confuses"): denne komponent opretter IKKE længere en aftale - den viser
// kun de aftaler, der allerede findes for ordren (oprettet fra selve
// Kalender-siden). Server-komponent nu, ingen client-state nødvendig.
export default function OrderInstallAppointment({ existing }: { existing: { day: string; time: string; status: string; assignedUserName: string | null }[] }) {
  return (
    <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
      <h2 className="mb-1 font-bold text-brand-ink">Installationsaftale</h2>
      {existing.length === 0 && (
        <p className="mt-2 text-sm text-brand-ink2/55">Ingen installationsaftale booket endnu. Book den fra Kalender-siden (søg på ordrenummeret).</p>
      )}
      {existing.map((a, i) => (
        <p key={i} className="mb-1 text-sm text-brand-ink2/80">{a.day} kl. {a.time} — {a.status === "CONFIRMED" ? "Bekræftet" : "Foreløbig"}{a.assignedUserName ? ` · ${a.assignedUserName}` : ""}</p>
      ))}
    </div>
  );
}
