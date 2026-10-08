'use client';
import { useMemo } from 'react';
import { postcardSvg } from '@/lib/scenes';

// The place a dish comes from, drawn behind its card: the country's landmark, its food culture, the dish on a table
// (lib/scenes.js postcardSvg). Our own static art only: no player text goes into the SVG.
export default function Postcard({ iso, cuisine, title }) {
  const html = useMemo(() => postcardSvg({ iso, cuisine, title }, (c) => `/tw/${c}.svg`), [iso, cuisine, title]);
  return <div className="rcard-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
}
