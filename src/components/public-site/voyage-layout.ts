/** The stage, text and camera use the same portrait decision. Desktop geometry
 * is deliberately unchanged unless the viewport needs a stacked composition. */
export function voyageComposition(width: number, height: number, copyHeight = 0) {
  const stacked = width / height < (width <= 760 ? 1.5 : 1.15);
  const short = height < 545;
  const sceneHeight = stacked
    ? Math.max(128, Math.min(height * 0.52, width * 1.1, height - copyHeight - 96))
    : height;
  return { stacked, short, sceneHeight, copyTop: sceneHeight + 22 };
}
