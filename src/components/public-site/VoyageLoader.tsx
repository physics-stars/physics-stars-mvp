import styles from "./voyage.module.css";

export type VoyageSceneState = "loading" | "ready" | "unavailable";

export function VoyageLoader({ state }: { state: VoyageSceneState }) {
  return (
    <div
      className={styles.sceneLoader}
      data-voyage-loader
      data-state={state}
      aria-hidden="true"
    >
      <span className={styles.loadingOrbit} />
    </div>
  );
}
