import type { Metadata } from "next";
import clsx from "clsx";
import { Inter, Sora } from "next/font/google";
import { DiditAuth } from "@didit-protocol/auth-nextjs";

import "@/styles/globals.css";

import { siteConfig } from "@/config/site";
import { authEnabled, authEnv } from "@/lib/didit/auth";
import { DiditClientProvider } from "@/lib/didit/provider";

/** The Didit live layer and the console view are set in Inter. */
const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600"],
});

const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600"],
});

/** Aurora Play, the casino. */
const fontSora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

/**
 * Every page: Didit Authentication when a publishable key is configured, and
 * signals from the first load (see lib/didit/provider.tsx).
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const withAuth = authEnabled();

  if (withAuth) authEnv();

  const content = (
    <DiditClientProvider authEnabled={withAuth}>{children}</DiditClientProvider>
  );

  return (
    <html suppressHydrationWarning lang="en">
      <body
        className={clsx(
          "min-h-screen font-sans",
          fontSans.variable,
          fontInter.variable,
          fontSora.variable,
        )}
      >
        {withAuth ? (
          <DiditAuth appearance={{ theme: "light" }} locale="en">
            {content}
          </DiditAuth>
        ) : (
          content
        )}
      </body>
    </html>
  );
}
