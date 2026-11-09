/** Public-site pace. 1 = original desktop pace. Edit these values. */
export const DESKTOP_SPEED_MULTIPLIER = 1.25;
/** Additional desktop speed for planet readings and the final logo text. */
export const DESKTOP_TEXT_SPEED_FACTOR = 1.5;
export const MOBILE_TRAVEL_SPEED_MULTIPLIER = 1;
/** Planet readings and the final Physics Stars logo text. */
export const MOBILE_PLANET_TEXT_SPEED_MULTIPLIER = 2;
export const MOBILE_SLIDES_SPEED_MULTIPLIER = 2;

/** Scroll distance for planet-side text only; intro and finale stay unchanged. */
export const PLANET_READING_SCROLL_SCALE = 0.6;

/** Magnetic resting point within the fully visible planet-text interval. */
export const PLANET_READING_ATTRACTION_POINT = 0.8;

/** Logo attraction starts once both rings fit on screen; real milliseconds. */
export const LOGO_GRAVITY_DELAY_MS = 550;
export const LOGO_GRAVITY_DURATION_MS = 2400;

/** Mobile inertia uses real milliseconds, independently of animation speed. */
export const MOBILE_INERTIA_DECAY_MS = 320;
export const MOBILE_INERTIA_MAX_SPEED = 2.8;
export const MOBILE_INERTIA_MIN_SPEED = 0.025;
export const MOBILE_INERTIA_MAX_DURATION_MS = 1200;

export const MOBILE_MOTION_QUERY = "(max-width:760px), (pointer:coarse)";
export type MotionPhase = "travel" | "planet-text" | "slides";
export function motionSpeed(mobile: boolean, phase: MotionPhase = "travel") {
  if (!mobile) return DESKTOP_SPEED_MULTIPLIER * (phase === "planet-text" ? DESKTOP_TEXT_SPEED_FACTOR : 1);
  if (phase === "planet-text") return MOBILE_PLANET_TEXT_SPEED_MULTIPLIER;
  if (phase === "slides") return MOBILE_SLIDES_SPEED_MULTIPLIER;
  return MOBILE_TRAVEL_SPEED_MULTIPLIER;
}
