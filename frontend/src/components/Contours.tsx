/**
 * Faint topographic contour lines behind the page: a calm texture, our own procedural waves
 * (nothing traced from any site). Static, decorative, hidden from assistive tech, removed in safe mode.
 */
const W = 1200;
const H = 800;
const LINES = 16;

function wave(i: number): string {
  const base = 40 + (i * (H - 80)) / (LINES - 1);
  const amp = 26 + (i % 5) * 9;
  const phase = i * 0.7;
  const points: string[] = [];
  for (let x = 0; x <= W; x += 30) {
    const y = base + amp * Math.sin(x / 150 + phase) + (amp / 2) * Math.sin(x / 63 + phase * 1.9);
    points.push(`${x === 0 ? "M" : "L"}${x},${y.toFixed(1)}`);
  }
  return points.join(" ");
}

const PATHS = Array.from({ length: LINES }, (_, i) => wave(i));

export function Contours() {
  return (
    <svg className="contours" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {PATHS.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
