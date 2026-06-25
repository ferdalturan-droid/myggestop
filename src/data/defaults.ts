// Standardværdier for indstillinger, priser, indhold og SEO.
// Alle værdier kan redigeres fra admin-panelet og gemmes i Setting-tabellen.

export const defaultSettings = {
  pricing: {
    coloredFrameSurchargePerSqm: 20, // DKK pr. m2 (bruges hvis farve ikke har egen sats)
    doubleDoorSurcharge: 200, // DKK fast tillæg pr. dobbeltdør
    installationBaseFee: 500, // DKK grundgebyr for montering
    installationPerProduct: 100, // DKK pr. produkt ved montering
    currency: "DKK",
    vatIncluded: true
  },
  shipping: {
    text: "Fragt beregnes efter aftale. Der kan tilkomme yderligere fragtomkostninger afhængigt af antal, størrelse og leveringsadresse."
  },
  contact: {
    companyName: "Myggestop",
    phone: "+45 12 34 56 78",
    email: "ferdalturan@gmail.com",
    adminEmail: "ferdalturan@gmail.com",
    address: "Eksempelvej 12",
    postalCode: "2300",
    city: "København S",
    cvr: "00000000",
    serviceAreaText: "Vi leverer til hele Danmark. Montering tilbydes i København og omegn.",
    openingHours: "Man-fre 08-17 · Lør 09-14",
    facebook: "",
    instagram: ""
  },
  branding: {
    logoUrl: "/logo.svg",
    primaryColor: "#1b8de0",
    secondaryColor: "#5cc524"
  },
  home: {
    heroEyebrow: "Specialfremstillet i Danmark",
    heroTitle: "Myggenet efter mål – hold insekter ude, luk komforten ind",
    heroSubtitle:
      "Myggestop leverer specialfremstillede myggenet til vinduer og døre i hele Danmark. Bestil online efter dine egne mål – vi står for resten.",
    heroCtaPrimary: "Bestil nu",
    heroCtaSecondary: "Se produkter",
    uspBar: ["Specialmål", "Levering i hele Danmark", "Montering i København og omegn", "Dansk kundeservice"],
    introTitle: "Sov roligt – uden myggesummen og insekter",
    introText:
      "Et myggenet fra Myggestop giver dig friske, insektfrie rum hele året. Du kan have vinduer og døre stående åbne uden at lukke myg, fluer, hvepse og andre insekter ind. Vores net fremstilles efter dine præcise mål, så de passer perfekt til netop dine åbninger.",
    ctaTitle: "Klar til en insektfri sommer?",
    ctaText:
      "Udfyld bestillingen med dine mål, så vender vi tilbage med en endelig pris, levering og eventuel montering. Helt uforpligtende.",
    ctaButton: "Anmod om tilbud"
  },
  seo: {
    siteName: "Myggestop",
    defaultTitle: "Myggestop – Specialfremstillede myggenet til vinduer og døre | Hele Danmark",
    titleTemplate: "%s | Myggestop",
    defaultDescription:
      "Myggenet, insektnet og fluenet efter mål til vinduer og døre. Plisségardiner til solafskærmning i specialmål. Levering i hele Danmark – montering i København og omegn. Bestil online.",
    keywords: [
      "myggenet",
      "insektnet",
      "fluenet",
      "myggedør",
      "plisségardin",
      "myggestop",
      "specialmål myggenet",
      "myggenet Danmark",
      "myggenet vindue",
      "myggenet dør"
    ],
    ogImage: "/og-image.png",
    twitterHandle: "",
    locale: "da_DK"
  }
};

export type AppSettings = typeof defaultSettings;
