/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as boxes from "../boxes.js";
import type * as crons from "../crons.js";
import type * as files from "../files.js";
import type * as items from "../items.js";
import type * as llm from "../llm.js";
import type * as notes from "../notes.js";
import type * as passkeyCleanup from "../passkeyCleanup.js";
import type * as passkeys from "../passkeys.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  boxes: typeof boxes;
  crons: typeof crons;
  files: typeof files;
  items: typeof items;
  llm: typeof llm;
  notes: typeof notes;
  passkeyCleanup: typeof passkeyCleanup;
  passkeys: typeof passkeys;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  passkeyAuth: import("convex-passkey-auth/_generated/component.js").ComponentApi<"passkeyAuth">;
};
