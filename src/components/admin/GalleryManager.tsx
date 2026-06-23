"use client";
import { useEffect, useRef, useState } from "react";
import { GALLERY_CATEGORIES } from "@/lib/types";

export default function GalleryManager() {
  const [items, setItems] = useState<any[]>([]);
  const [category, setCategory] = useState("vinduer");
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const d = await (await fetch("/api/gallery")).json();
    setItems(d.items || []);
  }
  useEffect(() => { load(); }, []);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      const upd = await up.json();
      if (!up.ok) throw new Error(upd.error || "Upload fejlede");
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: upd.url, type: upd.type, category: category === "videoer" || upd.type === "video" ? (category === "videoer" ? "videoer" : category) : category, title })
      });
      if (!res.ok) throw new Error("Kunne ikke gemme i galleriet");
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
      setMsg("Uploadet ✓");
      load();
      setTimeout(() => setMsg(null), 2500);
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Slet dette element?")) return;
    await fetch(`/api/gallery/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-brand-ink">Galleri & videoer</h1>
      <p className="mb-6 text-sm text-brand-ink2/65">Upload billeder og videoer. De vises automatisk pa galleri- og videosiderne.</p>

      <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-brand-ink2">Kategori</span>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {GALLERY_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-brand-ink2">Titel (valgfri)</span>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-brand-ink2">Vaelg fil (billede/video)</span>
            <input ref={fileRef} type="file" accept="image/*,video/*" onChange={onUpload} disabled={uploading} className="block w-full text-sm text-brand-ink2 file:mr-3 file:rounded-full file:border-0 file:bg-brand-blue file:px-4 file:py-2 file:text-white" />
          </label>
        </div>
        {uploading && <p className="mt-3 text-sm text-brand-ink2/60">Uploader...</p>}
        {msg && <p className="mt-3 text-sm font-medium text-brand-green">{msg}</p>}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((it) => (
          <div key={it.id} className="group relative overflow-hidden rounded-xl2 border border-brand-line bg-brand-ink">
            {it.type === "video" ? <video src={it.url} className="aspect-square w-full object-cover" /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={it.url} alt={it.title} className="aspect-square w-full object-cover" />}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-2">
              <span className="text-xs text-white">{it.category}</span>
              <button onClick={() => remove(it.id)} className="rounded bg-red-500 px-2 py-1 text-xs text-white">Slet</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-brand-ink2/50">Ingen elementer endnu.</p>}
      </div>
    </div>
  );
}
