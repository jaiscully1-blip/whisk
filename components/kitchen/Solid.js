// A food or thing as a real solid: the drawing stacked into layers that bulge toward the middle, so it has true thickness and
// volume as the kitchen turns. The front layer is the lit drawing; the ones behind are a shade darker.
const LAYERS = 12;
export default function Solid({ art, size, depth = 0.46, title }) {
  if (!art) return null;
  const T = size * depth;
  return (
    <span className="solid" style={{ width: size, height: size }} title={title} aria-hidden="true">
      {Array.from({ length: LAYERS }, (_, i) => {
        const t = i / (LAYERS - 1) * 2 - 1;                      // -1 (back) … +1 (front)
        const sc = 0.8 + 0.2 * Math.sqrt(Math.max(0, 1 - t * t * 0.92));
        const front = i === LAYERS - 1, back = i === 0;
        return <img key={i} src={back || !front ? art.dark : art.lit} alt="" draggable={false} style={{ transform: `translateZ(${(t * T / 2).toFixed(2)}px) scale(${sc.toFixed(3)})` }} />;
      })}
    </span>
  );
}
