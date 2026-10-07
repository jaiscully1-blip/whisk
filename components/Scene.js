'use client';
import { useMemo } from 'react';
import { sceneSvg, sceneName } from '@/lib/scenes';

// The restaurant a dish belongs to, drawn across the top of its card (see lib/scenes.js). Our own static art only:
// no player text goes into the SVG.
const src = (c) => `/tw/${c}.svg`;
export default function Scene({ iso, cuisine, title, height = 170, className = '' }) {
  const html = useMemo(() => sceneSvg({ iso, cuisine, title }, src), [iso, cuisine, title]);
  return (
    <div className={`scene ${className}`} style={{ height }}>
      <div className="scene-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
      <span className="scene-name">{sceneName(iso, cuisine)}</span>
    </div>
  );
}
