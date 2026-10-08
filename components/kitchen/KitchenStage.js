'use client';
import { useMemo, useRef, useState } from 'react';
import * as K from '@/lib/kitchen/models';
import Kitchen3D, { frameOn, VIEW_CAM } from './Kitchen3D';
import Icon from '@/components/Icon';

// The 3D kitchen plus any storage you built away from it (pantry closet, spice cabinet). Swipe left/right beside
// the model, tap the arrows or the names to slide between them: each one comes front and centre.
export default function KitchenStage({ pieces, title = 'Kitchen', cam: camIn, onCam: onCamIn, scale = 1, className = '', ...rest }) {
  const [own, setOwn] = useState(VIEW_CAM);
  const cam = camIn || own, setCam = onCamIn || setOwn;
  const [at, setAt] = useState(0);
  const [glide, setGlide] = useState(false);
  const away = useMemo(() => pieces.filter((p) => K.isRoom(p) && (p.x < 0 || p.y < 0 || p.x + p.w > K.GW || p.y + p.d > K.GD)), [pieces]);
  const stops = [{ id: null, label: title }, ...away.map((p) => ({ id: p.id, label: K.MODEL[p.mid].nick, b: p }))];
  const swipe = useRef(null);
  const go = (i) => {
    const n = (i + stops.length) % stops.length; setAt(n);
    setGlide(true); setTimeout(() => setGlide(false), 560);
    setCam(frameOn(stops[n].b || null, { ...VIEW_CAM, rz: cam.rz, rx: cam.rx }, scale, stops[n].b ? 1.7 : 1));
  };
  const down = (e) => { if (stops.length < 2 || e.target.closest?.('.k3-floor, button')) return; swipe.current = { x: e.clientX, y: e.clientY }; };
  const up = (e) => {
    const s = swipe.current; swipe.current = null; if (!s) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(at + (dx < 0 ? 1 : -1));
  };
  return (
    <div className="kstage" onPointerDown={down} onPointerUp={up} onPointerCancel={() => { swipe.current = null; }}>
      <Kitchen3D {...rest} pieces={pieces} cam={cam} onCam={setCam} scale={scale} className={`${className} ${glide ? 'glide' : ''}`} />
      {stops.length > 1 && <>
        <button type="button" className="kstage-arrow l" onClick={() => go(at - 1)} aria-label={`Show ${stops[(at - 1 + stops.length) % stops.length].label}`}><Icon name="chevron" size={20} style={{ transform: 'rotate(180deg)' }} /></button>
        <button type="button" className="kstage-arrow r" onClick={() => go(at + 1)} aria-label={`Show ${stops[(at + 1) % stops.length].label}`}><Icon name="chevron" size={20} /></button>
        <div className="kstage-tabs" role="tablist" aria-label="Kitchen and storage">
          {stops.map((s, i) => <button key={s.id || 'k'} type="button" role="tab" aria-selected={i === at} className={`chip ${i === at ? 'on' : ''}`} onClick={() => go(i)}>{s.label}</button>)}
        </div>
      </>}
    </div>
  );
}
