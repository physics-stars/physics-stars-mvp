"use client";

import { useId } from "react";
import styles from "./landing.module.css";

export const vesselBodyPath =
  "M184 43V100C184 112 175 130 166 146L109 239Q99 260 122 261H298Q321 260 311 239L254 146C245 130 236 112 236 100V43Z";

/** A small volume of glass: only translucency and reflected light define it. */
export function GlassVessel() {
  const id = useId();
  return (
    <div className={styles.glassVessel} data-descent-vessel aria-hidden="true">
      <svg viewBox="0 0 420 290" fill="none">
        <defs>
          <linearGradient
            id={`${id}-glass`}
            x1="110"
            y1="90"
            x2="310"
            y2="236"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#a8becf" stopOpacity="0.52" />
            <stop offset="0.28" stopColor="#e7edf3" stopOpacity="0.2" />
            <stop offset="0.72" stopColor="#c9bddf" stopOpacity="0.28" />
            <stop offset="1" stopColor="#94b2c8" stopOpacity="0.5" />
          </linearGradient>
          <radialGradient id={`${id}-glow`}>
            <stop stopColor="#fdd835" stopOpacity="0.6" />
            <stop offset="0.22" stopColor="#fdd835" stopOpacity="0.2" />
            <stop offset="1" stopColor="#fdd835" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-shadow`}>
            <stop stopColor="#a9a0b9" stopOpacity="0.12" />
            <stop offset="1" stopColor="#a9a0b9" stopOpacity="0" />
          </radialGradient>
          <clipPath id={`${id}-body`}>
            <path d={vesselBodyPath} />
          </clipPath>
        </defs>
        <ellipse
          cx="210"
          cy="268"
          rx="125"
          ry="17"
          fill={`url(#${id}-shadow)`}
        />
        <path d={vesselBodyPath} fill={`url(#${id}-glass)`} />
        <g clipPath={`url(#${id}-body)`}>
          <path
            d="M189 52H195V108C191 133 160 179 129 238Q120 248 116 243C143 188 180 130 187 105Z"
            fill="#fff"
            opacity="0.6"
          />
          <ellipse
            cx="281"
            cy="225"
            rx="43"
            ry="66"
            fill="#c6d5e1"
            opacity="0.09"
          />
          <ellipse
            cx="210"
            cy="254"
            rx="88"
            ry="9"
            fill="#fff"
            opacity="0.34"
          />
        </g>
        <ellipse cx="210" cy="43" rx="28" ry="6" fill={`url(#${id}-glass)`} />
        <g className={styles.vesselSpark}>
          <circle cx="210" cy="197" r="40" fill={`url(#${id}-glow)`} />
          <circle cx="210" cy="197" r="6" fill="#f4d244" />
          <circle cx="210" cy="197" r="2" fill="#fffbea" />
        </g>
      </svg>
    </div>
  );
}
