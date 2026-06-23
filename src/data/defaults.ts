// Standardvaerdier for indstillinger, priser, indhold og SEO.
// Alle vaerdier kan redigeres fra admin-panelet og gemmes i Setting-tabellen.

export const defaultSettings = {
  pricing: {
    coloredFrameSurchargePerSqm: 20, // DKK pr. m2 (bruges hvis farve ikke har egen sats)
    doubleDoorSurcharge: 200, // DKK fast tillaeg pr. dobbeltdor
    installationBaseFee: 500, // DKK grundgebyr for montering
    installationPerProduct: 100, // DKK pr. produkt ved montering
    currency: "DKK",
    vatIncluded: true
  },
  shipping: {
    text: "Fragt beregnes efter aftale. Der kan tilkomme yderligere fragtomkostninger afhaengigt af antal, storrelse og leveringsadresse."
  },
  contact: {
    companyName: "Myggestop",
    phone: "+45 12 34 56 78",
    email: "ferdalturan@gmail.com",
    adminEmail: "ferdalturan@gmail.com",
    address: "Eksempelvej 12",
    postalCode: "2300",
    city: "Kobenhavn S",
    cvr: "00000000",
    serviceAreaText: "Vi leverer til hele Danmark. Montering tilbydes i Kobenhavn og omegn.",
    openingHours: "Man-fre 08-17 - Lor 09-14",
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
    heroTitle: "Myggenet efter mal - hold insekter ude, luk komforten ind",
    heroSubtitle:
      "Myggestop leverer specialfremstillede myggenet til vinduer og dore i hele Danmark. Bestil online efter dine egne mal - vi star for resten.",
    heroCtaPrimary: "Bestil nu",
    heroCtaSecondary: "Se produkter",
    uspBar: ["Specialmal", "Levering i hele Danmark", "Montering i Kobenhavn og omegn", "Dansk kundeservice"],
    introTitle: "Sov roligt - uden mygggesummen og insekter",
    introText:
      "Et myggenet fra Myggestop giver dig friske, insektfrie rum hele aret. Du kan have vinduer og dore staende abne uden at lukke myg, fluer, hvepse og andre insekter ind. Vores net fremstilles efter dine praecise mal, sa de passer perfekt til netop dine abninger.",
    ctaTitle: "Klar til en insektfri sommer?",
    ctaText:
      "Udfyld bestillingen med dine mal, sa vender vi tilbage med en endelig pris, levering og evt. montering. Helt uforpligtende.",
    ctaButton: "Anmod om tilbud"
  },
  seo: {
    siteName: "Myggestop",
    defaultTitle: "Myggestop - Specialfremstillede myggenet til vinduer og dore | Hele Danmark",
    titleTemplate: "%s | Myggestop",
    defaultDescription:
      "Myggenet, insektnet og fluenet efter mal til vinduer og dore. Myggedore og plissédore i specialmal. Levering i hele Danmark - montering i Kobenhavn og omegn. Bestil online.",
    keywords: [
      "myggenet",
      "insektnet",
      "fluenet",
      "myggedor",
      "plissedor",
      "myggestop",
      "specialmal myggenet",
      "myggenet Danmark",
      "myggenet vindue",
      "myggenet dor"
    ],
    ogImage: "/og-image.png",
    twitterHandle: "",
    locale: "da_DK"
  }
};

export type AppSettings = typeof defaultSettings;
