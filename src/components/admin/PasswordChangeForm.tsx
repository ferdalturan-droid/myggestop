"use client";
import { useState } from "react";

export default function PasswordChangeForm() {
  const [mode, setMode] = useState<"change" | "reset">("change");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);

  async function submit() {
    if (newPassword !== confirm) { setMsg({ t: "De nye adgangskoder er ikke ens.", ok: false }); return; }
    setSaving(true);
    setMsg(null);
    const url = mode === "reset" ? "/api/auth/password/reset" : "/api/auth/password";
    const body = mode === "reset" ? { newPassword } : { currentPassword, newPassword };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold text-brand-ink">{mode === "reset" ? "Nulstil adgangskode" : "Skift adgangskode"}</h2>
        <button
          onClick={() => { setMode(mode === "reset" ? "change" : "reset"); setMsg(null); }}
          className="text-xs font-medium text-brand-blue hover:underline"
        >
          {mode === "reset" ? "Jeg kender min nuværende adgangskode" : "Glemt din nuværende adgangskode?"}
        </button>
      </div>

      {mode === "reset" && (
        <p className="mb-3 text-xs text-brand-ink2/60">
          Da du allerede er logget ind, kan du sætte en ny adgangskode uden at kende den gamle.
        </p>
      )}

      <div className="space-y-3">
        {mode === "change" && (
          <label className="block"><span className="label">Nuværende adgangskode</span><input type="password" className="input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></label>
        )}
        <label className="block"><span className="label">Ny adgangskode</span><input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></label>
        <label className="block"><span className="label">Gentag ny adgangskode</span><input type="password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
      </div>
      {msg && <p className={`mt-3 text-sm font-medium ${msg.ok ? "text-brand-greendark" : "text-red-600"}`}>{msg.t}</p>}
      <button
        onClick={submit}
        disabled={saving || (mode === "change" && !currentPassword) || !newPassword}
        className="btn-primary mt-4 py-2.5 text-sm disabled:opacity-50"
      >
        {saving ? "Gemmer..." : mode === "reset" ? "Nulstil adgangskode" : "Opdater adgangskode"}
      </button>
    </div>
  );
}
