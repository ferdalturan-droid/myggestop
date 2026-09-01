import Link from "next/link";

export default function ProductCard({ product }: { product: any }) {
  return (
    <Link href="/produkter" className="reveal group block overflow-hidden rounded-2xl border border-brand-goldline bg-brand-charcoal transition hover:border-brand-blue/40">
      <div className="aspect-[4/3] w-full overflow-hidden bg-soft">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="h-full w-full bg-soft" />
        )}
      </div>
      <div className="p-7">
        <h3 className="text-2xl font-semibold text-brand-cream">{product.name}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-brand-cream2/70">{product.shortText || product.description}</p>
        <span className="mt-5 inline-flex items-center gap-1 text-[15px] font-semibold text-brand-green">Læs mere →</span>
      </div>
    </Link>
  );
}
