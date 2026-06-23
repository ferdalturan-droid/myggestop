export default function SectionHeading({
  eyebrow,
  title,
  text,
  center
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  center?: boolean;
}) {
  return (
    <div className={`reveal max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="h-title mt-4 text-3xl sm:text-4xl">{title}</h2>
      {text && <p className="mt-4 text-lg leading-relaxed text-brand-ink2/75">{text}</p>}
    </div>
  );
}
