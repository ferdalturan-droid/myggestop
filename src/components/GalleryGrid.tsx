"use client";
import { useEffect, useState } from "react";
import { GALLERY_CATEGORIES } from "@/lib/types";

interface Item { id: string; type: string; category: string; url: string; thumbUrl: string; title: string; alt: string; }

export default function GalleryGrid() {
  const [active, setActive] = useState<string>("alle");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = active === "alle" ? "/api/gallery" : `/api/gallery?category=${active}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }, [active]);

  const filters = [{ key: "alle", label: "Alle" }, ...GALLERY_CATEGORIES];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActive(f.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              active === f.key ? "bg-brand-blue text-white shadow-glow" : "bg-white text-brand-ink2 border border-brand-line hover:border-brand-blue"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-xl2 bg-brand-mist" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-12 rounded-xl2 border border-dashed border-brand-line bg-brand-mist/50 p-12 text-center">
          <p className="text-brand-ink2/70">Der er endnu ingen billeder i denne kategori.</p>
          <p className="mt-1 text-sm text-brand-ink2/50">Galleriet udfyldes lobende — kig forbi igen snart.</p>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <figure key={it.id} className="group relative overflow-hidden rounded-xl2 border border-brand-line bg-brand-ink">
              {it.type === "video" ? (
                <video src={it.url} controls className="aspect-[4/3] w-full object-cover" poster={it.thumbUrl || undefined} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.url} alt={it.alt || it.title} className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" />
              )}
              {it.title && (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-sm font-medium text-white">
                  {it.title}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
