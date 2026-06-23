import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { buildMetadata, organizationSchema } from "@/lib/seo";
import { getSetting } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({});
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const contact = await getSetting("contact");
  const branding = await getSetting("branding");
  const schema = await organizationSchema();
  return (
    <html lang="da">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </head>
      <body className="font-sans">
        <Header logoUrl={branding.logoUrl} phone={contact.phone} />
        <main>{children}</main>
        <Footer contact={contact} logoUrl={branding.logoUrl} />
        <Reveal />
      </body>
    </html>
  );
}
