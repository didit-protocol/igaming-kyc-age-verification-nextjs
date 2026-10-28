import { Metadata } from "next";
import { Suspense } from "react";

import "@/demo-layer/live.css";
import "@/styles/aurora.css";

import { AuroraDemo } from "@/components/igaming/aurora-demo";

export const metadata: Metadata = {
  title: "iGaming demo: Aurora Play",
  description:
    "A fictional casino and sportsbook running Didit end to end: a passkey sign-up, an age check before the first bet, deposits held for an ID check at 2,000 EUR and bonus abuse caught by the device.",
  alternates: { canonical: "/" },
};

export default function IgamingPage() {
  return (
    <Suspense>
      <AuroraDemo />
    </Suspense>
  );
}
