import { internalMutation } from "./_generated/server";
import { passkeyAuth } from "./auth";

export const expiredSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await passkeyAuth.cleanupExpiredSessions(ctx);
  },
});

export const expiredChallenges = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await passkeyAuth.cleanupExpiredChallenges(ctx);
  },
});
