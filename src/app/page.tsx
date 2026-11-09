import type { Metadata } from "next";
import { Landing } from "@/components/public-site/Landing";
import { PublicShell } from "@/components/public-site/PublicShell";
import {
  getPublicLocale,
  type PublicSearchParams,
} from "@/components/public-site/locale.server";
import { publicCopy } from "@/components/public-site/copy";

type Props = { searchParams: PublicSearchParams };

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const locale = await getPublicLocale(searchParams);
  return { title: "Physics Stars", description: publicCopy[locale].meta };
}

export default async function LandingPage({ searchParams }: Props) {
  const locale = await getPublicLocale(searchParams);
  return (
    <>
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
      <noscript>
        <style>{'[data-landing-ready="false"] { opacity: 1 !important; }'}</style>
      </noscript>
      <PublicShell locale={locale}>
        <Landing />
      </PublicShell>
    </>
  );
}
