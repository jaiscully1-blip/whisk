'use client';
import { useEffect, useRef } from 'react';

// Renders the 3D Whisk wearing an outfit, in a pose. The engine (three.js) loads only in the browser.
export default function WhiskStage({ pose = 'default', outfit, interactive = true, height = 360, zoom = 1, label = 'Whisk, your chef', dancing = false, onDanceEnd }) {
  const ref = useRef(null);
  const stage = useRef(null);
  const endRef = useRef(onDanceEnd); endRef.current = onDanceEnd;
  useEffect(() => {
    let alive = true;
    import('@/lib/whisk3d/engine').then(({ mountStage }) => {
      if (!alive || !ref.current) return;
      stage.current = mountStage(ref.current, { pose, interactive, zoom, onDanceEnd: () => endRef.current?.() });
      if (dancing) stage.current.setDancing(true);
      stage.current.setOutfit(outfit || {});
    }).catch((e) => console.error('3D failed to load', e));
    return () => { alive = false; stage.current?.destroy(); stage.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { stage.current?.setPose(pose); }, [pose]);
  useEffect(() => { stage.current?.setDancing(dancing); }, [dancing]);
  useEffect(() => { stage.current?.setOutfit(outfit || {}); }, [outfit?.top, outfit?.hat, outfit?.glasses, outfit?.shoes, outfit?.acc]);
  return <div ref={ref} role="img" aria-label={label} style={{ width: '100%', height }} />;
}

export const outfitFrom = (lo) => ({ top: lo?.top_id || null, hat: lo?.hat_id || null, glasses: lo?.glasses_id || null, shoes: lo?.shoes_id || null, acc: lo?.acc_id || null });
