"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// Restaura el fons i la secció activa abans del primer pintat quan es
// recarrega la landing. Només cal a l'HTML del servidor: en una navegació
// client (p. ex. tornant des d'una altra pàgina) React no executa scripts
// inline i avisa per consola, així que llavors no es renderitza.
export function LandingReloadScript() {
  const fromServerHtml = useSyncExternalStore(subscribe, () => false, () => true);
  if (!fromServerHtml) return null;
  return (
    <script
      id="landing-reload-appearance"
      dangerouslySetInnerHTML={{
        __html: `(() => {
  try {
    if (performance.getEntriesByType('navigation')[0]?.type !== 'reload') return;
    const saved = JSON.parse(sessionStorage.getItem('physics-stars:landing-scroll:v1') || 'null');
    const colors = { idea: '#080a18', sobre: '#f8f7fb', equip: '#eee9f5', pilot: '#f8f7fb' };
    if (!saved || !Object.hasOwn(colors, saved.section)) return;
    const style = document.createElement('style');
    style.id = 'landing-reload-style';
    style.textContent =
      'body:has(main[data-landing-ready]), :has(> main[data-landing-ready]) { background: ' + colors[saved.section] + ' !important; }' +
      'header [data-landing-nav] { transition: none !important; color: #b1aec4 !important; }' +
      'header [data-landing-nav]::before { opacity: 0 !important; }' +
      'header [data-landing-nav][href="#' + saved.section + '"] { color: #f0f6f6 !important; }' +
      'header [data-landing-nav][href="#' + saved.section + '"]::before { opacity: 1 !important; }';
    document.head.appendChild(style);
  } catch {}
})();`,
      }}
    />
  );
}
