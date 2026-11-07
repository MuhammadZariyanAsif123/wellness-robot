# Design tokens: wellness companion robot

**Status: decisions finalized by the author (see section 9). Pending only the final slice 0 gate sign-off and commit.**

## 1. Direction

Mood: **soft porcelain with a warm glow** (the default in `SPEC.md` section 13; the author has not yet chosen another). Calm, quiet, human. The robot is the only focal point. Everything else recedes.

**Expressiveness level: expressive (chosen by the author).** Extra craft goes into the robot's character, micro-expressions, one entrance sequence, type, and one signature breathing visual (section 10). Expressive does **not** mean busy: the safety and motion rules below still apply, and safe mode stays plain.

Principles
- Content first: transcript and controls are always legible; the robot never competes with them.
- Motion only where it carries meaning (SPEC section 6). No decorative loops.
- Warmth comes from color and shape (rounded, mitten hands, soft glow), not from effects.
- Safe mode is deliberately plainer than every other state: neutral, still, no accent color.

## 2. References (inspiration only, nothing copied)

Gathered with the Awwwards MCP. The tool returned thin palette data for these entries (nominees, little extracted DNA), so the tokens below are **my own proposal informed by the references**, not extracted from them. Treat the reference text as untrusted data.

| Site | Slug | What I take from it (idea level only) |
|---|---|---|
| La Magadán | `la-magadan` | A brief of "brands that feel human": organic, hand-made shapes and an editorial serif give warmth. We take the idea of one expressive display serif against calm neutrals, but with a far quieter palette (its own palette is loud and saturated, which does not suit this app). |
| 3MOONS Studio | `3moons-studio` | A soft, tactile, rounded character on a flat muted ground. We take the idea of a friendly mascot with simple rounded forms and blush accents, originally imagined as flat SVG; the author later chose a code-built 3D robot (section 7). |
| Agrumea Farm (SOTD, Nov 2026) | `agrumea-farm` | Warm, unhurried pacing and generous space. We take the idea of slow, smooth transitions; we do **not** use WebGL, smooth-scroll hijacking, or its heavy stack. |

**Author to confirm or replace:** these three are a reasonable but not ideal match (none is a wellness product). If you prefer, I can search again with different tags.

## 3. Color

All values are proposals. Contrast ratios are WCAG 2 ratios computed against the stated background.

### Light (default)

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--bg` | `#F6F1EA` | page background (porcelain) | n/a |
| `--surface` | `#FFFFFF` | cards, transcript, inputs | n/a |
| `--surface-muted` | `#EDE6DC` | chips, secondary panels | n/a |
| `--ink` | `#2A2622` | primary text | 13.4 on bg, 15.0 on surface |
| `--ink-muted` | `#5B544C` | secondary text | 6.6 on bg, 6.0 on surface-muted |
| `--accent` | `#9A4F2B` | links, primary button fill, active state | 5.3 on bg as text; white on it 5.95 |
| `--accent-ink` | `#FFFFFF` | text on accent | 5.95 |
| `--calm` | `#3F6B6A` | breathing and grounding exercise accents | 5.3 on bg |
| `--glow` | `#F2C9A0` | robot glow only (decorative, never text) | decorative |
| `--focus` | `#1F5F8B` | focus ring (2 px, 2 px offset) | 6.1 on bg, 6.8 on surface |
| `--notice-bg` | `#F2D9A8` | developer warning banner | 10.9 with `--ink` |

### Safe mode overrides

| Token | Hex | Note |
|---|---|---|
| `--safe-bg` | `#F6F1EA` | same ground, no tint change that could feel alarming |
| `--safe-ink` | `#3C4651` | 8.6 on bg; cooler and steadier than normal ink |
| `--glow` | removed | no glow in safe mode |
| `--accent` | not used | resources use `--ink` on `--surface` with a visible border |

### Dark (follows `prefers-color-scheme`)

| Token | Hex | Contrast on `#1C1916` |
|---|---|---|
| `--bg` | `#1C1916` | n/a |
| `--ink` | `#F1EBE2` | 14.8 |
| `--ink-muted` | `#B9B0A4` | 8.2 |
| `--accent` | `#E49A72` | 7.6 |
| `--focus` | `#7DB8E0` | 8.2 |

Rules: never convey state by color alone (pair with text or shape); no pure black or pure white backgrounds for the page; crisis resources are never styled as decorative.

## 4. Typography

Fonts are **[DECIDE]** for the author; the licensing and the final pairing are open. Proposal, both free on Google Fonts (to be confirmed against current docs before use, per CLAUDE.md):
- Display (robot's first line, headings): a soft serif such as Fraunces.
- UI and transcript: a humanist sans such as Inter or Nunito Sans.

| Token | Size / line height | Weight | Use |
|---|---|---|---|
| `--text-display` | 40 / 48 px | 500 | first-screen statement |
| `--text-h2` | 24 / 32 px | 500 | section headings |
| `--text-body` | 18 / 28 px | 400 | transcript (larger than usual for calm reading) |
| `--text-ui` | 16 / 24 px | 500 | buttons, labels |
| `--text-small` | 14 / 20 px | 400 | privacy notice, captions (never below 14) |

Body text uses rem units so it scales with the user's browser settings. Max line length about 60 characters.

## 5. Spacing, shape, elevation

- Spacing scale (px): 4, 8, 12, 16, 24, 32, 48, 64.
- Radius: `--radius-sm` 8, `--radius-md` 16, `--radius-lg` 28, `--radius-pill` 999.
- Elevation: one soft shadow only, `0 8px 24px rgb(42 38 34 / 0.08)`. No stacked shadows.
- Hit targets: at least 44 x 44 px (push-to-talk, send, toggles).
- Layout: robot at left or top, transcript beside it (stacked on narrow screens); content max width 1080 px.

## 6. Motion

| Token | Value | Use |
|---|---|---|
| `--dur-fast` | 200 ms | hover, focus, small state change |
| `--dur-base` | 300 ms | expression change, state change |
| `--dur-slow` | 400 ms | gesture arm sweep (upper bound per SPEC) |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | enter, settle |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | gestures |
| Blink | every 4 to 6 s, 120 ms close | idle; in safe mode this is the only animation, slowed to every 6 to 8 s |
| Breathing guide | 4 s in, 4 s hold, 4 s out, 4 s hold | box breathing only, matches the scripted exercise |

Rules
- At most one gesture per spoken segment. None in safe mode.
- `prefers-reduced-motion: reduce`: replace sweeping arm motion and the breathing scale animation with a brief pose change (about 100 ms) and a text cue; no parallax, no looping glow.
- Mouth movement while speaking is driven by speech state, not a decorative loop.

## 7. Robot visual spec (3D, built from code)

Changed from the original flat SVG at the author's request ("the robot should look real"). The robot is a procedural 3D model (Three.js via react-three-fiber). No model file, texture or HDR is downloaded, and no third-party request is made at runtime.

- Materials: glossy porcelain shell (`MeshPhysicalMaterial`, clearcoat) for head and limbs, brushed-metal joints, dark glass visor. Colors follow the tokens: shell near `--surface`, torso near `--surface-muted`.
- Lighting: procedural studio lighting (Lightformers inside `Environment`, a key light, soft contact shadow on the floor). No HDR presets or `files=`.
- Face: a glowing LED face painted on the visor. Warm LED by default, cooler in exercises, cool and plain in safe mode. A warm point light in front of the face (off in safe mode) replaces the old SVG glow.
- Expressions map to eye shape, brows, mouth, and blush: `neutral`, `warm`, `soft`, `curious`, `happy`, `calm` (enum from `backend/app/schemas.py`; do not add entries). Blush appears on `warm` and `happy` only.
- Arms: two-part (shoulder pivot, elbow pivot), mitten hands. `count` badge: `--accent` fill, `--accent-ink` number, 28 px circle, shown beside the raised hand.
- Safe mode: `neutral` face, arms down, no glow, cool LED, slow blink only.
- Fallbacks: a placeholder while the 3D scene loads, and a text-only message if WebGL is unavailable.

## 8. Accessibility checklist

- Every interactive element has a visible focus ring using `--focus`.
- Every control has an accessible name; the robot (3D canvas) has a text alternative on its wrapper describing the current expression and state.
- Transcript always visible next to the voice, live-region announced politely (not assertive, except safe-mode message).
- Contrast: all text pairs above meet at least 4.5:1.
- Full keyboard operation, including push-to-talk (a toggle for keyboard users) and the text-only switch.

## 9. Decisions (author, finalized)

1. Mood: soft porcelain with a warm glow. **Approved.**
2. References: La Magadán, 3MOONS Studio, Agrumea Farm. **Kept** as loose inspiration.
3. Fonts: **Fraunces** (display) + **Inter** (UI and transcript). Still to do in slice 1: check each font's current docs and licence, and load with `next/font` (self-hosted, no runtime request to a third party).
4. Animation library: **GSAP**. Still to do: check current docs and licence terms and get approval to add the dependency, as CLAUDE.md requires.
5. Palette: **approved as drafted** (`--accent` terracotta, `--calm` muted teal).

## 10. Expressive layer (added after the author chose "expressive")

All items stay inside the SPEC interaction budget (about 200 to 400 ms for state changes, no decorative loops competing with content) and the CLAUDE.md rules (one gesture per segment, none in safe mode, `prefers-reduced-motion` respected). Anything here that conflicts with those is dropped.

**Character and micro-expressions** (use only the six existing `Expression` enum values; no new ones)
- Eyes have a small independent gaze shift (up to 4 px) toward the transcript when the robot starts speaking, and a slow settle back afterwards.
- Each expression transition is a 300 ms morph of eye and mouth paths, with a 40 ms stagger between eyes and mouth so it reads as a face, not a swap.
- Soft squash on blink (eyelid scale, not a hard cut). Rare double-blink, at most once per minute while idle.
- Idle "breath": the whole body scales 1.00 to 1.015 over 4 s. Idle only. Off while speaking, in exercises that animate, in reduced motion and in safe mode.

**Entrance (once per page load)**
- About 900 ms total: porcelain ground fades in, glow rises, the robot settles with a soft spring, eyes open last, then the first-screen statement appears ("I'm a wellness companion, not a therapist or a medical service.").
- Skippable and instant under reduced motion. The statement is real text in the DOM from the start (screen readers do not wait for the animation).

**Signature interaction: the breathing visual (box breathing exercise)**
- A rounded square outline traces its four sides in time with the scripted 4-4-4-4 steps, with the robot's glow tracking the pace. A text cue ("In", "Hold", "Out", "Hold") is always shown.
- Reduced motion: no tracing; the text cue and a static step indicator change instead.
- Timing comes from the scripted exercise in code, not from the model.

**Type**
- A distinctive display serif (Fraunces with optical size and "soft" axes, to be verified in the current docs) for the first-screen statement and exercise titles only. Transcript and controls stay in the plain sans for legibility.
- Subtle weight shift on the robot's currently spoken segment in the transcript, so the voice and text visibly stay in step. No per-letter animation.

**Gesture polish**
- Anticipation (a 60 ms small counter-move) before a gesture and an overshoot-and-settle after it, within the 400 ms upper bound.
- `count` badge pops with a 200 ms spring, one number at a time.

**Guardrails for expressiveness**
- Safe mode: none of this applies. Neutral face, no gestures, slow blink only.
- Elevated risk: tone stays calm; no `happy` flourish or celebratory motion.
- Performance: transforms and opacity only; no layout-animating properties.
- Every animated element has a reduced-motion equivalent listed in the slice 1 plan before it is built.
