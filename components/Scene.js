'use client';
import { useMemo } from 'react';
import { postcardSvg, placeName } from '@/lib/scenes';

// The top of a recipe or dish card: a postcard of where it comes from with the dish drawn on the table
// (lib/scenes.js postcardSvg, all Whisk's own drawings — no emoji). No player text goes into the SVG.
export default function Scene({ iso, cuisine, title, ingredients, height = 170, className = '' }) {
  const html = useMemo(() => postcardSvg({ iso, cuisine, title, ingredients }), [iso, cuisine, title, ingredients]);
  return (
    <div className={`scene ${className}`} style={{ height }}>
      <div className="scene-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
      <span className="scene-name">{placeName(iso, cuisine)}</span>
    </div>
  );
}
