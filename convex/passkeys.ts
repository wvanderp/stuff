import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { passkeyAuth } from "./auth";

export const generateRegistrationChallenge = mutation({
  args: { identifier: v.string(), displayName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return await passkeyAuth.generateRegistrationOptions(ctx, args);
  },
});

export const verifyRegistration = mutation({
  args: {
    identifier: v.string(),
    credentialId: v.string(),
    publicKey: v.string(),
    challenge: v.string(),
    counter: v.number(),
    deviceName: v.optional(v.string()),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await passkeyAuth.verifyRegistration(ctx, args);
  },
});

export const generateAuthenticationChallenge = mutation({
  args: { identifier: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return await passkeyAuth.generateAuthenticationOptions(ctx, args);
  },
});

export const verifyAuthentication = mutation({
  args: {
    credentialId: v.string(),
    challenge: v.string(),
    counter: v.number(),
  },
  handler: async (ctx, args) => {
    return await passkeyAuth.verifyAuthentication(ctx, args);
  },
});

export const validateSession = mutation({
  args: { tokenHash: v.string() },
  handler: async (ctx, args) => {
    return await passkeyAuth.validateSession(ctx, args.tokenHash);
  },
});

export const logout = mutation({
  args: { tokenHash: v.string() },
  handler: async (ctx, args) => {
    return await passkeyAuth.logout(ctx, args.tokenHash);
  },
});
