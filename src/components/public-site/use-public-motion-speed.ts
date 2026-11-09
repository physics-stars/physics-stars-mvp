"use client";

import { useSyncExternalStore } from "react";
import { DESKTOP_SPEED_MULTIPLIER, MOBILE_MOTION_QUERY, motionSpeed } from "./motion-settings";

function subscribe(callback: () => void) {
  const media = matchMedia(MOBILE_MOTION_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const snapshot = () => motionSpeed(matchMedia(MOBILE_MOTION_QUERY).matches);
const serverSnapshot = () => DESKTOP_SPEED_MULTIPLIER;

export const usePublicMotionSpeed = () => useSyncExternalStore(subscribe, snapshot, serverSnapshot);
