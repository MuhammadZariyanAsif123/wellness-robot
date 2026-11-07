import type { Face } from "./expressions";

/** Face parameters plus the live, per-frame values the motion layer drives. */
export interface Live extends Face {
  gazeX: number;
  gazeY: number;
  /** 0 closed .. 1 wide open */
  mouthOpen: number;
  /** 0 eyes open .. 1 eyelids shut */
  blink: number;
}

export const FACE_W = 512;
export const FACE_H = 384;

export interface Ellipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface FaceLayout {
  eyes: [Ellipse, Ellipse];
  /** Brow strokes: center, half-length, rotation in degrees */
  brows: { cx: number; cy: number; half: number; deg: number }[];
  mouth: { x1: number; x2: number; y: number; cpY: number };
  mouthOpen: Ellipse;
  blush: { cx: number; cy: number; r: number; alpha: number }[];
}

/** Pixels per face unit, so the numeric Face model keeps the same scale as before. */
const K = FACE_W / 165;

/** Pure layout math (no canvas), so it can be unit tested. */
export function faceLayout(f: Live, w = FACE_W, h = FACE_H): FaceLayout {
  const k = (w / FACE_W) * K;
  const eyeY = h * 0.42;
  const dx = w * 0.24;
  const open = 1 - 0.92 * f.blink;
  const eye = (side: 1 | -1): Ellipse => ({
    cx: w / 2 + side * dx + f.gazeX * k * 0.6,
    cy: eyeY + f.gazeY * k * 0.6,
    rx: f.eyeRx * k,
    ry: Math.max(f.eyeRy * k * open, 1),
  });
  const browY = eyeY - 30 * k - f.browLift * k;
  const my = h * 0.72;
  const half = (f.mouthWidth * k * 1.5) / 2;
  return {
    eyes: [eye(-1), eye(1)],
    brows: [
      { cx: w / 2 - dx, cy: browY, half: 15 * k, deg: -f.browTilt },
      { cx: w / 2 + dx, cy: browY, half: 15 * k, deg: f.browTilt },
    ],
    mouth: { x1: w / 2 - half, x2: w / 2 + half, y: my, cpY: my + f.mouthCurve * k * 1.6 },
    mouthOpen: {
      cx: w / 2,
      cy: my + 3 * k + f.mouthOpen * 3 * k,
      rx: (f.mouthWidth * k * 1.5) / 3,
      ry: Math.max(f.mouthOpen * 7 * k * 0.8, 0),
    },
    blush: [-1, 1].map((s) => ({
      cx: w / 2 + s * w * 0.36,
      cy: h * 0.62,
      r: 15 * k,
      alpha: f.blush * 0.5,
    })),
  };
}

export interface LedTint {
  led: string;
  blush: string;
}

/** Paints the LED face onto a 2D canvas (used as the visor texture). */
export function drawFace(
  ctx: CanvasRenderingContext2D,
  f: Live,
  tint: LedTint,
  w = FACE_W,
  h = FACE_H,
): void {
  const L = faceLayout(f, w, h);
  const k = (w / FACE_W) * K;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#0b0d10";
  ctx.fillRect(0, 0, w, h);

  // Faint screen vignette so the visor reads as glass, not a flat rectangle.
  const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, w * 0.7);
  vg.addColorStop(0, "rgba(255,255,255,0.05)");
  vg.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  for (const b of L.blush) {
    if (b.alpha <= 0.01) continue;
    const g = ctx.createRadialGradient(b.cx, b.cy, 0, b.cx, b.cy, b.r * 1.6);
    g.addColorStop(0, withAlpha(tint.blush, b.alpha));
    g.addColorStop(1, withAlpha(tint.blush, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(b.cx, b.cy, b.r * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowColor = tint.led;
  ctx.shadowBlur = 26 * (w / FACE_W);
  ctx.fillStyle = tint.led;
  ctx.strokeStyle = tint.led;
  ctx.lineCap = "round";

  for (const e of L.eyes) {
    ctx.beginPath();
    ctx.ellipse(e.cx, e.cy, e.rx, e.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.lineWidth = 4 * k;
  for (const b of L.brows) {
    ctx.save();
    ctx.translate(b.cx, b.cy);
    ctx.rotate((b.deg * Math.PI) / 180);
    ctx.beginPath();
    ctx.moveTo(-b.half, 0);
    ctx.lineTo(b.half, 0);
    ctx.stroke();
    ctx.restore();
  }

  ctx.lineWidth = 4 * k;
  ctx.beginPath();
  ctx.moveTo(L.mouth.x1, L.mouth.y);
  ctx.quadraticCurveTo(w / 2, L.mouth.cpY, L.mouth.x2, L.mouth.y);
  ctx.stroke();

  if (L.mouthOpen.ry > 0.5) {
    const m = L.mouthOpen;
    ctx.beginPath();
    ctx.ellipse(m.cx, m.cy, m.rx, m.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
}

/** "#rrggbb" + alpha -> "rgba(...)". */
function withAlpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
