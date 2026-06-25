"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Reveal() {
  const pathname = usePathname();
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.in)"));
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    els.forEach((el) => io.observe(el));
    // Sikkerhedsnet: vis alt efter kort tid, uanset observer (forhindrer tomme sider)
    const t = setTimeout(() => els.forEach((el) => el.classList.add("in")), 1000);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, [pathname]);
  return null;
}
