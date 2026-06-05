import { PasskeyAuth } from "convex-passkey-auth";
import { components } from "./_generated/api";

export const passkeyAuth = new PasskeyAuth(components.passkeyAuth, {
  rpName: "Stuff Manager",
  sessionExpiryMs: 30 * 24 * 60 * 60 * 1000,
  refreshAfterMs: 24 * 60 * 60 * 1000,
});
