import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const paths = ["", "/produkter", "/bestil", "/galleri", "/videoer", "/kontakt", "/om-os", "/hvorfor-myggestop"];
  return paths.map((p) => ({
    url: base + p,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.8
  }));
}
