import type { LiveInput } from "./live";

/**
 * Lines every app pushes to the Didit live layer: the signals device read-out
 * and the Authentication session. Pure, so `npm test` pins every line the
 * visitor reads.
 */

export interface DeviceRead {
  firstVisit: boolean;
  botScore: number;
  browser: string;
  os: string;
}

/** The signals read-out of this device, once per page load. */
export function deviceEvents(device: DeviceRead): LiveInput[] {
  const human = device.botScore < 0.5;

  return [
    {
      key: "sig-device",
      tone: "sig",
      product: "signals",
      title: device.firstVisit ? "New device fingerprinted" : "Known device",
      detail: `${device.browser} on ${device.os} · ${device.firstVisit ? "first visit" : "seen before"}`,
      code: "getDeviceFingerprintPayload() · @didit-protocol/signals",
    },
    {
      key: "sig-bot",
      tone: human ? "sig" : "stop",
      product: "signals",
      title: human
        ? "Bot protection: human"
        : "Bot protection: likely automated",
      detail: `Bot score ${device.botScore.toFixed(2)}`,
    },
  ];
}

/** A Didit Authentication session, as the feed reports it. */
export function authEvent(input: {
  sessionId: string;
  email: string | null;
  methods: string[];
  signUp: boolean;
  device: string | null;
}): LiveInput {
  const passkey = input.methods.includes("passkey");
  const code = input.methods.includes("code");
  const who = input.email ?? "New account";

  return {
    key: `auth-${input.sessionId}`,
    tone: "auth",
    product: "authentication",
    title: input.signUp
      ? passkey
        ? "Passkey created"
        : code
          ? "New sign-up with an email code"
          : "New sign-up"
      : passkey
        ? "Signed in with the passkey"
        : code
          ? "Signed in with an email code"
          : "Signed in",
    detail: [who, input.device].filter(Boolean).join(" · "),
    code: input.signUp
      ? "<SignUp /> · @didit-protocol/auth-nextjs"
      : "useUser() · @didit-protocol/auth-nextjs",
  };
}
