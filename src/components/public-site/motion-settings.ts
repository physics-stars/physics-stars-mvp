/** Global public-site pace. 1 = original desktop pace. Edit these two values. */
export const DESKTOP_SPEED_MULTIPLIER = 2;
export const MOBILE_SPEED_MULTIPLIER = 5;

export const MOBILE_MOTION_QUERY = "(max-width:760px), (pointer:coarse)";
export const motionSpeed = (mobile: boolean) =>
  mobile ? MOBILE_SPEED_MULTIPLIER : DESKTOP_SPEED_MULTIPLIER;
