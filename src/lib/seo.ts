import type { Metadata } from "next";
import { getSetting } from "./settings";

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.myggestop.dk";
}

export async function buildMetadata(opts: {
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
}): Promise<Metadata> {
  const seo = await getSetting("seo");
  const url = siteUrl() + (opts.path || "");
  const title = opts.title ? `${opts.title} | ${seo.siteName}` : seo.defaultTitle;
  const description = opts.description || seo.defaultDescription;
  return {
    metadataBase: new URL(siteUrl()),
    title,
    description,
    keywords: opts.keywords || seo.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: seo.locale,
      url,
      siteName: seo.siteName,
      title,
      description,
      images: [{ url: seo.ogImage, width: 1200, height: 630, alt: seo.siteName }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [seo.ogImage]
    },
    robots: { index: true, follow: true }
  };
}

export async function organizationSchema() {
  const c = await getSetting("contact");
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: c.companyName,
    image: siteUrl() + "/logo.svg",
    "@id": siteUrl(),
    url: siteUrl(),
    telephone: c.phone,
    email: c.email,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: c.address,
      postalCode: c.postalCode,
      addressLocality: c.city,
      addressCountry: "DK"
    },
    areaServed: { "@type": "Country", name: "Danmark" },
    description:
      "Specialfremstillede myggenet, insektnet og fluenet til vinduer og døre. Myggedøre og plissédøre i specialmål. Levering i hele Danmark."
  };
}
