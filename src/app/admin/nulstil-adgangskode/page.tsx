"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function NulstilAdgangskode() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password/forgot/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Kunne ikke nulstille adgangskoden.");
      setDone(true);
      setTimeout(() => router.push("/admin/login"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grain-dark grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-sm rounded-xl2 bg-white p-8 shadow-soft">
        <div className="mb-6 text-center">
          <span className="text-2xl font-extrabold text-brand-ink">NORD<span className="text-brand-green">ICA</span></span>
          <p className="mt-1 text-sm text-brand-ink2/60">Vælg ny adgangskode</p>
        </div>
        {!token ? (
          <p className="text-sm text-red-600">Linket mangler et gyldigt token. Bed om et nyt via "Glemt adgangskode".</p>
        ) : done ? (
          <p className="text-sm text-brand-greendark">Adgangskoden er skiftet ✓ Du sendes videre til login...</p>
        ) : (
          <form onSubmit={submit}>
            <label className="label">Ny adgangskode</label>
            <input className="input" type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <button disabled={loading} className="btn-primary mt-6 w-full disabled:opacity-60">{loading ? "Gemmer..." : "Skift adgangskode"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
