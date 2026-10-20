'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { postcardSvg } from '@/lib/scenes';

// The place a dish comes from, drawn behind its card: the country's landmark, its food culture, and the dish itself
// (lib/scenes.js postcardSvg, all Yoke's own drawings). No player text goes into the SVG.
// lazy: draw it only when the card comes near the screen (each drawing is ~10 KB of SVG, so a long list drawn at once stutters).
export default function Postcard({ iso, cuisine, title, ingredients, lazy = false }) {
  const box = useRef(null);
  const [near, setNear] = useState(!lazy);
  useEffect(() => {
    if (near || !box.current || typeof IntersectionObserver === 'undefined') { if (!near) setNear(true); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); } }, { rootMargin: '700px 0px' });
    io.observe(box.current); return () => io.disconnect();
  }, [near]);
  const html = useMemo(() => (near ? postcardSvg({ iso, cuisine, title, ingredients }) : ''), [near, iso, cuisine, title, (ingredients || []).join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  return <div ref={box} className="rcard-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
}
