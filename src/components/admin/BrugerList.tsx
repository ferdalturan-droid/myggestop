"use client";
import { useEffect, useState } from "react";

const ROLE_LABEL: Record<string, string> = { COORDINATOR: "Koordinator", BUILDER: "Bygger", INSTALLER: "Installatør" };

export default function BrugerList() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("BUILDER");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin-users", { cache: "no-store" });
      const d = await res.json();
      setUsers(d.users || []);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role, password })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Kunne ikke oprette bruger.");
      setMsg(`Oprettet: ${d.user.email} (${ROLE_LABEL[d.user.role]}). Giv adgangskoden videre til brugeren.`);
      setEmail(""); setName(""); setPassword(""); setRole("BUILDER");
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-ink">Brugere</h1>
      <p className="mt-1 text-sm text-brand-ink2/65">Opret Bygger- og Installatør-konti. Kun du (Koordinator) kan se og oprette brugere.</p>

      <form onSubmit={submit} className="mt-6 max-w-md space-y-3 rounded-xl2 border border-brand-line bg-white p-5 shadow-card">
        <div>
          <label className="label">Navn</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label">E-mail</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">Rolle</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="BUILDER">Bygger</option>
            <option value="INSTALLER">Installatør</option>
            <option value="COORDINATOR">Koordinator</option>
          </select>
        </div>
        <div>
          <label className="label">Midlertidig adgangskode</label>
          <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {msg && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-brand-greendark">{msg}</p>}
        <button disabled={saving} className="btn-primary w-full disabled:opacity-60">{saving ? "Opretter..." : "Opret bruger"}</button>
      </form>

      <div className="mt-8 space-y-2">
        {loading && <p className="text-brand-ink2/60">Indlæser...</p>}
        {!loading && users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm">
            <div>
              <span className="font-semibold text-brand-ink">{u.name}</span>
              <span className="text-brand-ink2/55"> · {u.email}</span>
            </div>
            <span className="rounded bg-brand-mist px-2 py-0.5 text-xs font-semibold text-brand-ink2">{ROLE_LABEL[u.role] || u.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
