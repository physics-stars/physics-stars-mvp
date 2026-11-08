export type ScrollBridge = {
  start: number;
  end: number;
  exit: number;
  entry: number;
  origin?: 0 | 1;
};

export function bridgeLength(bridge: ScrollBridge) {
  return bridge.exit + bridge.end - bridge.start + bridge.entry;
}

/** One scroll coordinate owns the exit, page movement and arrival. */
export function bridgeFrame(bridge: ScrollBridge, offset: number) {
  const span = bridge.end - bridge.start;
  const page = Math.max(0, Math.min(span, offset - bridge.exit));
  const y = bridge.start + page;
  if (bridge.exit > 0 && offset < bridge.exit)
    return { y, phase: "departure" as const, amount: Math.max(0, offset / bridge.exit) };
  if (bridge.entry > 0 && offset > bridge.exit + span)
    return { y, phase: "entry" as const, amount: Math.min(1, (offset - bridge.exit - span) / bridge.entry) };
  return { y, phase: "flight" as const, amount: span > 0 ? page / span : 1 };
}

/** Letting go during an exit returns to that container. Between sections,
 * whichever occupies more of the viewport wins. */
export function bridgeStop(
  bridge: ScrollBridge,
  offset: number,
  pageY = bridgeFrame(bridge, offset).y,
) {
  const middle = (bridge.start + bridge.end) / 2;
  const after = pageY > middle + 0.5
    ? true
    : pageY < middle - 0.5
      ? false
      : bridge.origin === 1;
  return after ? bridgeLength(bridge) : 0;
}
