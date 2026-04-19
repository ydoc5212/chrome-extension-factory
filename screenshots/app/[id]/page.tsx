import { notFound } from 'next/navigation';
import { BrowserFrame } from '../../components/BrowserFrame';
import { CopyOverlay } from '../../components/CopyOverlay';
import { RealBuildIframe } from '../../components/RealBuildIframe';
import { ConceptCard } from '../../components/ConceptCard';
import { StubWatermark } from '../../components/StubWatermark';
import { screenshots } from '../../config';
import type { Rung } from '../../ladder';

/**
 * Dedicated route per screenshot. The capture script visits
 *   http://localhost:3535/<id>?rung=<rung>&...
 * and screenshots the viewport at 1280×800. Manual-override shots never
 * hit this page (capture.ts copies them directly).
 *
 * Rungs the page handles (docs/07-fallback-ladders.md):
 *   - rung=real-build      → iframe loading the built extension surface
 *                            (capture script also passes iframeSrc).
 *                            Ship-acceptable.
 *   - rung=concept-card    → typographic concept card with extension
 *                            name + tagline. Stub-watermarked.
 *                            Default if `rung` is omitted.
 *
 * The capture script is the authority on which rung this shot landed at;
 * the page is a dumb renderer of whatever rung query param it receives.
 */

type RenderableRung = Extract<Rung, 'real-build' | 'concept-card'>;

function parseRung(value: string | undefined): RenderableRung {
  return value === 'real-build' ? 'real-build' : 'concept-card';
}

export function generateStaticParams() {
  return screenshots.map((s) => ({ id: s.id }));
}

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

function firstParam(
  v: string | string[] | undefined,
): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ScreenshotPage({
  params,
  searchParams,
}: PageProps) {
  const resolved = await Promise.resolve(params);
  const search = (await Promise.resolve(searchParams ?? {})) ?? {};
  const shot = screenshots.find((s) => s.id === resolved.id);
  if (!shot) notFound();

  const rung = parseRung(firstParam(search.rung));
  const iframeSrc = firstParam(search.iframeSrc);
  const extensionName = firstParam(search.name) ?? 'Your extension';
  const tagline =
    firstParam(search.tagline) ?? 'A short description of what it does.';
  const isStub = rung !== 'real-build';

  const content =
    rung === 'real-build' && iframeSrc ? (
      <RealBuildIframe surface={shot.surface} src={iframeSrc} />
    ) : (
      <ConceptCard
        surface={shot.surface}
        theme={shot.theme}
        extensionName={extensionName}
        tagline={tagline}
      />
    );

  return (
    <div style={{ width: 1280, height: 800 }}>
      <div style={{ position: 'relative', width: 1280, height: 800 }}>
        <BrowserFrame
          theme={shot.theme}
          surface={shot.surface}
          browserUrl={shot.browserUrl}
        >
          {content}
        </BrowserFrame>
        <CopyOverlay
          theme={shot.theme}
          headline={shot.headline}
          subhead={shot.subhead}
        />
        {isStub && <StubWatermark />}
      </div>
    </div>
  );
}
