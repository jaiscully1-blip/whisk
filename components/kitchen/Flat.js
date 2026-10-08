'use client';
import * as K from '@/lib/kitchen/models';
import { css } from './Kitchen3D';
import { itemUrl } from '@/lib/art/items';

// A flat front-on picture of one piece (search results, the paint sheet, thumbnails).
export default function Flat({ mid, w, h, fin, tfin, box = [80, 80] }) {
  const m = K.MODEL[mid]; if (!m) return null;
  if (m.thing) { const s = Math.min(box[0], box[1]); return <img className="kflat-thing" src={itemUrl(m.item)} alt="" width={s} height={s} draggable={false} aria-hidden="true" />; }
  const f = K.flat(m, w ?? m.w, h ?? m.h, fin || m.fin, tfin || m.tfin, box[0], box[1]);
  return (
    <div className="kflat" style={css(f.st)} aria-hidden="true">
      {f.comps.map((c, i) => <div key={i} className="kfp" style={css(c.st)}>{c.deco.map((d, j) => <span key={j} className="kdeco" style={css(d.st)} />)}</div>)}
      {f.face.map((d, i) => <span key={i} className="kdeco" style={css(d.st)} />)}
    </div>
  );
}
