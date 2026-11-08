export type SectionBounds = { top: number; bottom: number };

/** Only the space between reading ranges attracts. A tall section's whole
 * interior is free to scroll, including its last screen of content. */
export function sectionTransition(
  y: number,
  sections: SectionBounds[],
  height: number,
  header: number,
) {
  for (let index = 0; index < sections.length - 1; index++) {
    const section = sections[index];
    const start = Math.max(section.top - header, section.bottom - height);
    const end = sections[index + 1].top - header;
    if (end > start && y > start + 1 && y < end - 1)
      return { index, start, end, amount: (y - start) / (end - start) };
  }
  return null;
}

