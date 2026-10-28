/**
 * The one place the app reads Didit's configuration from.
 *
 * Every route and browser call takes its base URLs and keys from here. It has
 * no runtime imports: `npm test` and `npm run setup` load it straight from
 * Node.
 */

export const diditUrls = {
  /** The verification API: sessions, decisions, users, transactions. */
  api: "https://verification.didit.me",
  /** Where hosted verification sessions live. */
  verify: "https://verify.didit.me",
  console: "https://business.didit.me",
  /** This app's own public URL (callbacks and redirects are built from it). */
  site: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/+$/,
    "",
  ),
  docs: "https://docs.didit.me",
};

/** A workflow id from the environment; `npm run setup` writes them to .env. */
export function workflowId(name: string): string {
  return (process.env[name] || "").trim();
}

/** The server-side API key. Never sent to the browser. */
export function apiKey(): string {
  return process.env.API_KEY || "";
}

/**
 * The Authentication publishable key: a public identifier of the demo
 * application, so it may be rendered into the page. When it is unset the app
 * keeps its own sign-in and the Authentication steps stay hidden.
 */
export function publishableKey(): string | null {
  const key = (process.env.DIDIT_PUBLISHABLE_KEY || "").trim();

  return /^pk_(live|test)_[A-Za-z0-9_-]+$/.test(key) ? key : null;
}

export const PRODUCTS = [
  "authentication",
  "signals",
  "verification",
  "transactions",
] as const;

export type Product = (typeof PRODUCTS)[number];

/** The five steps every demo walks through, in order. */
export const STEPS = [
  { id: "signup", label: "Sign up" },
  { id: "verify", label: "Verify" },
  { id: "transact", label: "Transact" },
  { id: "fraud", label: "Stop fraud" },
  { id: "console", label: "Console" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

export interface DemoBrand {
  name: string;
  /** The first letter shown in the brand square of the demo switcher. */
  initial: string;
  /** Background of that square (a CSS colour or gradient). */
  mark: string;
}

export interface DemoDefinition<W extends Record<string, string>> {
  id: string;
  route: string;
  industry: string;
  brand: DemoBrand;
  /** Every `vendor_data` this demo creates starts with it; its rules match it. */
  vendorPrefix: string;
  /** Workflow ids for the current environment, built with `pick`. */
  workflows: W;
  /** Plain-language rules the demo enforces, shown in the live layer. */
  rules: Record<string, string>;
  copy: { tagline: string; story: string };
}

/** A demo's config: brand, workflows per environment, rules and copy. */
export function defineDemo<W extends Record<string, string>>(
  demo: DemoDefinition<W>,
): DemoDefinition<W> {
  return demo;
}

/**
 * The `vendor_data` Didit sees for a visitor: the demo's prefix plus the
 * Didit Authentication user id, so the same person is one record across
 * Authentication, verification and transactions, and the demo's rules (which
 * match the prefix) apply to them only.
 */
export function vendorDataFor(prefix: string, userId: string): string | null {
  const clean = userId.trim();

  if (!/^[A-Za-z0-9_-]{6,80}$/.test(clean)) return null;

  return `${prefix}${clean}`;
}
