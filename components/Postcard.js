'use client';
import { useMemo } from 'react';
import { postcardSvg } from '@/lib/scenes';

// The place a dish comes from, drawn behind its card: the country's landmark, its food culture, and the dish itself
// (lib/scenes.js postcardSvg, all Whisk's own drawings). No player text goes into the SVG.
export default function Postcard({ iso, cuisine, title, ingredients }) {
  const html = useMemo(() => postcardSvg({ iso, cuisine, title, ingredients }), [iso, cuisine, title, ingredients]);
  return <div className="rcard-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
}
