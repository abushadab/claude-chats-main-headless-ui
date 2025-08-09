/**
 * Channel UUID mappings from backend team
 */

export const CHANNEL_MAP = {
  general: "b91d0bfb-0d4e-4a53-b431-1f7ca72e086c",
  development: "0f2d358e-1577-44d5-829f-91bfceb614bf",
  global: "4fcb3b1e-2f13-47cd-b775-6a42c865d818"
} as const;

export const DEFAULT_CHANNEL_ID = CHANNEL_MAP.general;
export const DEFAULT_PROJECT_ID = "1"; // Keep for URL structure, but not used by backend