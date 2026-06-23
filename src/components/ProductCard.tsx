import Link from "next/link";
import { IconCheck } from "./Icons";
import { formatDKK } from "@/lib/pricing";

export default function ProductCard({ product }: { product: any }) {
  const features: string[] = Array.isArray(product.features) ? product.features : [];
  return (
    <div className="reveal card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-soft">
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-brand-ink to-brand-ink2">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <svg viewBox="0 0 400 250" className="h-full w-full">
            <defs>
              <pattern id={`np-${product.id}`} width="12" height="12" patternUnits="userSpaceOnUse">
                <path d="M12 0H0V12" fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="400" height="250" fill={`url(#np-${product.id})`} />
            <rect x="60" y="40" width="280" height="170" rx="8" fill="none" stroke="#3aa9f0" strokeWidth="8" />
          </svg>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-brand-bluedark shadow-card">
          fra {formatDKK(product.pricePerSqm)} / m²
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-bold text-brand-ink">{product.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-brand-ink2/75">{product.shortText || product.description}</p>
        <ul className="mt-4 space-y-2">
          {features.slice(0, 4).map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-brand-ink2">
              <span className="mt-0.5 text-brand-green">
                <IconCheck className="h-4 w-4" />
              </span>
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex items-center justify-between border-t border-brand-line pt-4">
          <span className="text-xs text-brand-ink2/60">Max bredde {product.maxWidthMm} mm</span>
          <Link href="/bestil" className="btn-primary px-5 py-2 text-sm">
            Bestil
          </Link>
        </div>
      </div>
    </div>
  );
}
