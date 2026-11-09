import type { CSSProperties } from "react";
import styles from "./starfield.module.css";

// Fixed coordinates keep the sky quiet and avoid a repeating dotted texture.
const distantStars = [
  [6, 12, 1, 0.36], [29, 8, 1.4, 0.52], [54, 13, 1, 0.3],
  [68, 7, 1.2, 0.46], [94, 11, 1, 0.35], [12, 29, 1.4, 0.6],
  [39, 24, 1, 0.34], [61, 31, 1.2, 0.48], [85, 35, 1, 0.38],
  [97, 45, 1.4, 0.48], [4, 48, 1, 0.32], [26, 42, 1, 0.26],
  [47, 38, 1.4, 0.4], [72, 46, 1, 0.3], [16, 61, 1.2, 0.4],
  [36, 58, 1, 0.28], [58, 65, 1.4, 0.5], [81, 55, 1, 0.35],
  [96, 77, 1, 0.32], [23, 83, 1.4, 0.48], [42, 91, 1, 0.3],
  [64, 85, 1.2, 0.42], [78, 92, 1, 0.28], [9, 94, 1, 0.36],
];

const glints = [
  [18, 17, 13, -1], [77, 20, 17, -8], [91, 65, 19, -12],
  [48, 80, 23, -6], [7, 73, 29, -23],
];

export function VoyageStarfield() {
  return (
    <div className={styles.field} aria-hidden="true">
      {distantStars.map(([x, y, size, opacity], index) => (
        <span
          key={`distant-${index}`}
          className={styles.star}
          style={{
            left: `${x}%`, top: `${y}%`,
            width: size, height: size, opacity,
          }}
        />
      ))}
      {glints.map(([x, y, period, delay], index) => (
        <span
          key={`glint-${index}`}
          className={`${styles.star} ${styles.glint}`}
          style={{
            left: `${x}%`, top: `${y}%`,
            "--twinkle-period": `${period}s`,
            "--twinkle-delay": `${delay}s`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
