import { defineApp } from "convex/server";
import passkeyAuth from "convex-passkey-auth/convex.config";

const app = defineApp();

app.use(passkeyAuth);

export default app;
