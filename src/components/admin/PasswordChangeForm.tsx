"use client";
import { useState } from "react";

export default function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);

  async function submit() {
    if (newPassword !== confirm) { setMsg({ t: "De nye adgangskoder er ikke ens.", ok: false }); return; }
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) {
      setMsg({ t: "Adgangskode opdateret ✓", ok: true });
      setCurrentPassword(""); setNewPassword(""); setConfirm("");
    } else {
      setMsg({ t: d.error || "Kunne ikke opdatere adgangskoden.", ok: false });
    }
  }

  return (
    <div className="max-w-md rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
      <h2 className="mb-4 font-bold text-brand-ink">Skift adgangskode</h2>
      <div className="space-y-3">
        <label className="block"><span className="label">Nuværende adgangskode</span><input type="password" className="input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></label>
        <label className="block"><span className="label">Ny adgangskode</span><input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></label>
        <label className="block"><span className="label">Gentag ny adgangskode</span><input type="password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
      </div>
      {msg && <p className={`mt-3 text-sm font-medium ${msg.ok ? "text-brand-greendark" : "text-red-600"}`}>{msg.t}</p>}
      <button onClick={submit} disabled={saving || !currentPassword || !newPassword} className="btn-primary mt-4 py-2.5 text-sm disabled:opacity-50">
        {saving ? "Gemmer..." : "Opdater adgangskode"}
      </button>
    </div>
  );
}
