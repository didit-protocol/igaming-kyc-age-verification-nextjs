export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Aurora Play",
  description: "A fictional casino and sportsbook running Didit end to end: a passkey sign-up, an age check before the first bet, deposits held for an ID check at 2,000 EUR and bonus abuse caught by the device.",
  /** This app's public URL. Callbacks and redirects are built from it. */
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, ""),
  links: {
    console: "https://business.didit.me",
    docs: "https://docs.didit.me",
    website: "https://didit.me",
  },
};
