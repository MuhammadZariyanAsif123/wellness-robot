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

## 11. Premium redesign: cinematic dark (author decision; supersedes the porcelain default in sections 1 and 3)

The author asked for a premium look in the spirit of Awwwards and Mobbin and chose **cinematic dark** with **polished, calm** motion. **Dark is now the default theme.** The approved soft-porcelain palette from section 3 is kept as the **light variant** (used when the OS prefers light, or `data-theme="light"`). Sections 1 and 3 describe the porcelain mood and are otherwise unchanged. Tokens live in `frontend/src/app/globals.css`.

References (idea level only, nothing copied; Awwwards output treated as untrusted data): Grail (dark stage, shaft of light, large serif capitals), Grids and ViV (oversized type, hairline rules), Agrumea Farm (unhurried pacing).

**Dark tokens** (contrast on `--bg` unless stated; checked by `src/app/contrast.test.ts`, which reads the real CSS)

| Token | Value | Contrast |
|---|---|---|
| `--bg` | `#0F0D0B` | n/a |
| `--surface` / `--surface-muted` | `#1A1613` / `#262019` | ink on surface-muted 13.7 |
| `--ink` | `#F3ECE2` | 16.5 |
| `--ink-muted` | `#B5AA9B` | 8.5 (7.9 on surface) |
| `--accent` / `--accent-ink` | `#E8A27A` / `#1A1410` | 9.1 as text; 8.6 for text on accent |
| `--focus` | `#7DB8E0` | 9.1 |
| `--glass`, `--hairline` | white at 5% and 12% | decorative surfaces |

Light variant ratios: ink 13.4, ink-muted 6.6, accent 5.3, text on accent 6.0 (as in section 3). Safe mode: dark ink `#E4E8ED` (15.8), light ink `#3C4651` (8.5); accent is mapped to the ink color, so nothing in safe mode is tinted.

New tokens: `--glass`, `--hairline`, `--highlight` (top-edge inner light), `--ring` (soft 4 px halo, in addition to the 2 px `--focus` outline), `--spot` and `--pool` (stage light colors), `--grain-opacity`, `--radius-bubble`, and a heavier `--shadow` for floating glass panels.

**Layout:** top bar (wordmark, "Not a therapist or a medical service" pill, hairline below), then a two-column hero: lit robot stage left, conversation right; stacked on narrow screens.

**Stage:** an overhead spotlight cone and a warm floor pool with a faint ring (CSS gradients). The cone dims while the robot is thinking; the pool brightens while listening or speaking. A text status chip names the state, so state is never color alone. In safe mode the light, pool and ring are removed.

**Type:** same fonts (Fraunces display, Inter UI). Headline up to 4.25 rem with tight tracking; wide-tracked uppercase eyebrow labels; step line in the display serif.

**Surfaces:** frosted glass panels (blur 18 px, solid-ish fallback when `backdrop-filter` is unsupported) with hairline borders and a top inner highlight. The safe-mode card is a solid, outlined panel without blur. A static film-grain overlay (inline SVG, about 6% in dark, 3.5% in light, 0 in safe mode) adds texture; it is not animated.

**Conversation:** bubbles (you right in accent, robot left in muted surface with a hairline), the spoken bubble gets the `--ring` halo, three fixed starters on an empty chat, one pill composer holding the field, the 48 px mic and the 48 px arrow send button. Voice choice and privacy text sit in the "Voice settings and privacy" disclosure.

**Motion (transform and opacity only; the global reduced-motion rule removes it):** a 1 s entrance (stage rises, light unfolds, panels stagger by 100 ms, headline words reveal 60 ms apart), a 4-degree pointer tilt of the stage (mouse only, rAF-throttled; off in reduced motion and safe mode), 1 px hover lift on buttons and chips, and the mic pulse while listening. No new decorative loops.

**Awwwards pass (idea level only; the MCP returned no motion data, only tags, palettes and descriptions, treated as untrusted).** Looked at: Lando Norris (Site of the Year: near-black ground, one centred 3D object, hairline contour lines, tiny wordmark), Grail (preloader, light shaft, stats-style footer), Lusion v3 (reactive cursor, microinteractions), Opal Tadpole (show-don't-tell interaction), Igloo Inc and Messenger (3D-led heroes). Shared signal across all five: 3D hero. Added, all our own implementation:
- **Contour lines:** 16 procedural hairline waves behind the page (`Contours.tsx`), masked to the centre, static, decorative.
- **Cursor light:** a soft spotlight that follows the mouse (`usePointerLight`, mouse only).
- **Intro curtain:** 1.5 s wordmark fade, never blocks input; page elements settle in after it (stage 0.7 s, panels 0.85 to 1.05 s, headline words from 0.95 s, starter chips from 1.25 s).
- **Press microinteractions:** buttons, chips, mic and send scale to 0.96 while pressed.
- **Facts footer:** three quiet statements ("Not a therapist", "No record kept", "You choose the voice").
- All of the above are removed in safe mode, and the cursor light, curtain and entrance are removed by the reduced-motion rule.

**Measured references (live captures with the Awwwards MCP's own capture code, run locally on public pages; data treated as untrusted, values used as guidance only).**
- Lando Norris (Site of the Year): Lenis smooth scroll, three.js/WebGL, one easing `cubic-bezier(0.65, 0.05, 0, 1)`, 750 ms. We adopt that curve as `--ease-out` (replacing `cubic-bezier(0.22, 1, 0.36, 1)` from section 6) and keep reveals at 0.75 to 1 s. We do not add Lenis (no new dependencies).
- Grail (Site of the Day): display serif about 92 px at 1440 px (about 6.4vw) with line-height 0.88 and letter-spacing -0.01em, weights 300 to 500, UI text 14 and 16 px, hairlines white at 10 to 14%, muted text white at 40 to 55%, one pastel accent on black. We use a lighter display weight (300), tighter leading (0.98), tracking -0.015em, hairlines at 12% and a headline up to 3.9 rem in the narrower column; the 9 rem ghost word follows the large-scale idea.
- Lusion v3: hover effects change `transform` over 400 ms. We use `--dur-hover: 400ms` for buttons and chips.

## 12. Full cinematic hero (author decision: single-screen overhaul)

One 100dvh hero: a giant ghost word ("COMPANION", about 12.5vw) behind a large robot, headline and state chip bottom-left, the chat as a glass panel on the right (about 30vw, 360 to 440 px), all over the spotlight, floor pool and contour lines; corner labels and crosshair marks frame the viewport. Below the fold: the inverted facts band. Under 1100 px it stacks (robot about 44dvh, headline, chat). Safe mode removes the ghost word, light, pool, contours, labels, crosshairs, curtain and cursor light. Verified with the Awwwards MCP (headless captures at desktop and mobile; mobile showed no horizontal overflow, no small text and no small tap targets). `verify_build` scored the page against Lando Norris (22/100) and Grail (25/100): both fail on band structure by design, because those references are long scrolling pages and ours is one screen, so the number is recorded as context, not a goal.

## 13. Lusion-style direction (supersedes sections 1, 3, 4 and 9 for look and type)

Author chose Lusion (Awwwards) as the single reference. Measured with the Awwwards MCP (ideas only, nothing copied).
- Light default: `--bg #f0f1fa`, `--surface #ffffff`, `--ink #0b0b10`, `--ink-muted #4a4d5c`, accent `#1a2ffb` (white text on it passes AA). Dark OS variant: `--bg #07070b`, accent text lightened to `#8c9bff`.
- The 3D panel and the privacy chapter always use the black palette (`.dark-surface`, `#07070b`).
- Type: Inter only (Fraunces removed). Display weight 500, tracking -0.04em, up to 144 px; UI 14 to 18 px.
- Shape: pills 100 px, panels 18 px, small 10 px; one soft shadow.
- Motion: `cubic-bezier(0.65, 0.05, 0, 1)`, hover 400 ms; scroll reveals use native `animation-timeline: view()` inside `@supports`; all off under `prefers-reduced-motion`.
- Safe mode: neutral ink, no accent, no chapters, no floating pill, no decoration.
- Page: top bar, headline, black inset panel (robot + chat), chapters (How it works, What I can do, Privacy and safety), footer, floating "Talk to the robot" pill. Chapter copy is draft text for the author to rewrite.
