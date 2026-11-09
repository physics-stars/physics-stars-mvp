/** Global public-site pace. 1 = original desktop pace. Edit these two values. */
export const DESKTOP_SPEED_MULTIPLIER = 1.25;
export const MOBILE_SPEED_MULTIPLIER = 3;

/** Mobile inertia uses real milliseconds, independently of animation speed. */
export const MOBILE_INERTIA_DECAY_MS = 320;
export const MOBILE_INERTIA_MAX_SPEED = 2.8;
export const MOBILE_INERTIA_MIN_SPEED = 0.025;
export const MOBILE_INERTIA_MAX_DURATION_MS = 1200;

export const MOBILE_MOTION_QUERY = "(max-width:760px), (pointer:coarse)";
export const motionSpeed = (mobile: boolean) =>
  mobile ? MOBILE_SPEED_MULTIPLIER : DESKTOP_SPEED_MULTIPLIER;
