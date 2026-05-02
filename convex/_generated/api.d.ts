/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as attendanceRecords from "../attendanceRecords.js";
import type * as clearLeaveRequests from "../clearLeaveRequests.js";
import type * as leaveRequests from "../leaveRequests.js";
import type * as meetings from "../meetings.js";
import type * as proofOfWork from "../proofOfWork.js";
import type * as removeDuplicateTasks from "../removeDuplicateTasks.js";
import type * as seed from "../seed.js";
import type * as teamMembers from "../teamMembers.js";
import type * as workTasks from "../workTasks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  attendanceRecords: typeof attendanceRecords;
  clearLeaveRequests: typeof clearLeaveRequests;
  leaveRequests: typeof leaveRequests;
  meetings: typeof meetings;
  proofOfWork: typeof proofOfWork;
  removeDuplicateTasks: typeof removeDuplicateTasks;
  seed: typeof seed;
  teamMembers: typeof teamMembers;
  workTasks: typeof workTasks;
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

export declare const components: {};
