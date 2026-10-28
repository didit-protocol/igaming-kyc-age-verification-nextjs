/**
 * The demo definition: brand, workflows (ids come from the environment, see
 * `npm run setup`), the rules the demo enforces and its copy. The Demo bar,
 * the Didit live layer and the route handlers read it from here.
 *
 * No `@/` imports: the setup script loads the policy that reads this file
 * straight from Node.
 */

import { defineDemo, workflowId } from "./config.ts";

export const auroraPlay = defineDemo({
  id: "aurora-play",
  route: "/",
  industry: "iGaming",
  brand: {
    name: "Aurora Play",
    initial: "A",
    mark: "linear-gradient(135deg, #8B5CFF 0%, #E047C8 100%)",
  },
  vendorPrefix: "aurora-play-",
  workflows: {
    age: workflowId("DIDIT_WORKFLOW_AGE"),
    kyc: workflowId("DIDIT_WORKFLOW_KYC"),
  },
  rules: {
    ageBeforeBet: "No bet before an approved age check",
    idAt2000: "ID check once deposits reach 2,000 EUR in 30 days",
    bonusPerDevice: "One welcome bonus per device",
  },
  copy: {
    tagline: "Casino and sportsbook",
    story:
      "A passkey sign-up, an age check before the first bet, deposits held for an ID check at 2,000 EUR, and bonus abuse caught by the device.",
  },
});

export const DEMOS = [auroraPlay];
