import type { ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { colors } from "../themes/colors";

type Point = [number, number];

// Airway centreline, larynx -> pharynx -> nasal passage -> nostril -> outside.
const AIRWAY: Point[] = [
  [315, 615],
  [315, 450],
  [328, 398],
  [400, 386],
  [500, 386],
  [545, 392],
  [610, 380],
];

const segLengths = AIRWAY.slice(1).map((p, i) =>
  Math.hypot(p[0] - AIRWAY[i][0], p[1] - AIRWAY[i][1])
);
const TOTAL = segLengths.reduce((a, b) => a + b, 0);
// Arclength of the pinch point (inside the nose, just before the nostril).
const WALL = segLengths[0] + segLengths[1] + segLengths[2] + segLengths[3] + 60;

const pointAt = (s: number): Point => {
  let rest = Math.max(0, Math.min(TOTAL, s));
  for (let i = 0; i < segLengths.length; i++) {
    if (rest <= segLengths[i]) {
      const t = rest / segLengths[i];
      return [
        AIRWAY[i][0] + (AIRWAY[i + 1][0] - AIRWAY[i][0]) * t,
        AIRWAY[i][1] + (AIRWAY[i + 1][1] - AIRWAY[i][1]) * t,
      ];
    }
    rest -= segLengths[i];
  }
  return AIRWAY[AIRWAY.length - 1];
};

const HEAD_PATH =
  "M 150 700 C 130 560 90 420 120 270 C 150 120 300 40 420 90 C 480 115 500 170 500 240 " +
  "C 505 290 540 340 565 375 C 572 395 545 405 520 402 C 510 420 512 440 505 452 " +
  "C 515 460 508 470 500 478 C 505 500 495 530 480 548 C 450 585 410 610 370 620 L 360 700 Z";

const PARTICLES = 24;
const NOTES = ["♪", "♫", "♪"];

type HeadCutawayProps = {
  /** 0 = nose free, 1 = fully pinched. */
  pinch?: number;
  /** 0 = soft palate closed against the throat wall, 1 = swung open. */
  velum?: number;
  /** 0..1 how strongly air is being pushed up from the larynx. */
  flow?: number;
  /** Highlight the sealed lips. */
  lipsGlow?: number;
  /** Highlight the vocal cords buzzing. */
  cordsGlow?: number;
  /** SVG overlay drawn in head coordinates (labels, arrows). */
  children?: ReactNode;
  width?: number;
};

// Side-on cutaway of a head humming: air from the vocal cords has to leave
// through the nose because the lips are shut. Pinching the nose blocks the
// only exit, so the air piles up and the sound dies.
export const HeadCutaway: React.FC<HeadCutawayProps> = ({
  pinch = 0,
  velum = 1,
  flow = 1,
  lipsGlow = 0,
  cordsGlow = 0,
  children,
  width = 900,
}) => {
  const frame = useCurrentFrame();
  const height = (width * 700) / 600;

  // Soft palate: pivots at the back of the hard palate. Open = hangs down
  // (nasal passage connected), closed = swings back against the throat wall.
  const pivot: Point = [345, 418];
  const velumRad = ((200 - velum * 100) * Math.PI) / 180;
  const velumTip: Point = [
    pivot[0] + Math.cos(velumRad) * 80,
    pivot[1] + Math.sin(velumRad) * 80,
  ];

  const speed = 3.2 * flow;
  const particles = Array.from({ length: PARTICLES }, (_, i) => {
    const flowS = (frame * speed + (i * TOTAL) / PARTICLES) % TOTAL;
    const queuedS = WALL - i * ((WALL - 20) / PARTICLES);
    const beyond = flowS > WALL;
    // Particles already past the pinch point fade out; the rest queue up.
    const s = beyond && pinch > 0 ? flowS : flowS + (queuedS - flowS) * pinch;
    const settled = Math.min(1, pinch * 1.4);
    const jitter = Math.sin(frame * 1.7 + i * 2.1) * 3 * settled;
    const [x, y] = pointAt(beyond && pinch > 0 ? WALL - 0.01 : s);
    const op = beyond && pinch > 0 ? 1 - pinch : 1;
    const pileScale = 1 + settled * 0.5;
    return { x: x + jitter, y: y + jitter * 0.4, op, pileScale, i };
  });

  const fingerGap = 70 - pinch * 62;

  return (
    <svg width={width} height={height} viewBox="40 0 600 700" style={{ overflow: "visible" }}>
      <path d={HEAD_PATH} fill="#1B1B2E" stroke={colors.foreground} strokeOpacity={0.55} strokeWidth={4} />

      {/* Airway tube */}
      <polyline
        points={AIRWAY.slice(0, 6)
          .map((p) => p.join(","))
          .join(" ")}
        fill="none"
        stroke={colors.accent}
        strokeOpacity={0.28}
        strokeWidth={34}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={AIRWAY.slice(0, 6)
          .map((p) => p.join(","))
          .join(" ")}
        fill="none"
        stroke={colors.background}
        strokeOpacity={0.5}
        strokeWidth={22}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Mouth cavity with a sealed lip line */}
      <path d="M 345 448 L 496 462 L 490 505 L 405 528 L 345 505 Z" fill="#5A2540" opacity={0.85} />
      <path d="M 360 500 Q 420 470 490 492 Q 450 520 400 522 Z" fill="#E06B8B" opacity={0.9} />
      <line
        x1={500}
        y1={452}
        x2={500}
        y2={480}
        stroke="#E06B8B"
        strokeWidth={9 + lipsGlow * 5}
        strokeLinecap="round"
      />
      {lipsGlow > 0 && (
        <circle cx={500} cy={466} r={26 + lipsGlow * 10} fill="none" stroke={colors.accentAlt} strokeWidth={4} opacity={lipsGlow} />
      )}

      {/* Soft palate */}
      <line
        x1={pivot[0]}
        y1={pivot[1]}
        x2={velumTip[0]}
        y2={velumTip[1]}
        stroke="#E06B8B"
        strokeWidth={16}
        strokeLinecap="round"
      />

      {/* Vocal cords */}
      {[-1, 1].map((side) => (
        <rect
          key={side}
          x={side < 0 ? 290 : 322}
          y={610 + Math.sin(frame * 1.4) * 4 * (0.4 + flow * (1 - pinch * 0.3))}
          width={22}
          height={7}
          rx={3}
          fill={colors.accentAlt}
        />
      ))}
      {cordsGlow > 0 && (
        <circle
          cx={316}
          cy={614}
          r={24 + Math.sin(frame / 2) * 6 * cordsGlow}
          fill={colors.accentAlt}
          opacity={0.25 * cordsGlow}
        />
      )}

      {/* Air particles */}
      {particles.map((p) => (
        <circle
          key={p.i}
          cx={p.x}
          cy={p.y}
          r={5.5 * p.pileScale}
          fill={pinch > 0.5 ? colors.accentAlt : colors.foreground}
          opacity={p.op * (0.55 + 0.4 * Math.sin(frame / 6 + p.i))}
        />
      ))}

      {/* Notes floating out of the nostril while the hum escapes */}
      {NOTES.map((note, i) => {
        const cycle = (frame / 45 + i / NOTES.length) % 1;
        const strength = flow * (1 - pinch);
        return (
          <text
            key={i}
            x={575 + cycle * 45}
            y={380 - cycle * 150 + i * 14}
            fontSize={44}
            fill={colors.accentAlt}
            opacity={Math.sin(cycle * Math.PI) * strength}
          >
            {note}
          </text>
        );
      })}

      {/* Pressure glow building at the pinch point */}
      {pinch > 0 && (
        <circle
          cx={pointAt(WALL)[0]}
          cy={pointAt(WALL)[1]}
          r={18 + pinch * 34 + Math.sin(frame / 3) * 5 * pinch}
          fill={colors.accent}
          opacity={pinch * 0.55}
        />
      )}

      {/* Pinching fingers */}
      <g opacity={pinch > 0 ? 1 : 0}>
        <rect x={545} y={375 - fingerGap / 2 - 26} width={95} height={44} rx={22} fill="#F2B38C" transform="rotate(-6 545 375)" />
        <rect x={545} y={377 + fingerGap / 2 - 18} width={95} height={44} rx={22} fill="#E8A27C" transform="rotate(6 545 377)" />
      </g>

      {children}
    </svg>
  );
};
