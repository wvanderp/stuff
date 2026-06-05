import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "cleanup expired passkey sessions",
  { hours: 24 },
  internal.passkeyCleanup.expiredSessions,
  {},
);

crons.interval(
  "cleanup expired passkey challenges",
  { hours: 1 },
  internal.passkeyCleanup.expiredChallenges,
  {},
);

export default crons;
