import {
  AbsoluteFill,
  Audio,
  Composition,
  Easing,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { colors } from "../themes/colors";
import { TextReveal } from "../components/TextReveal";
import { BackgroundPulse } from "../components/BackgroundPulse";
import { StickFigure } from "../components/StickFigure";
import { ChannelWatermark } from "../components/ChannelWatermark";
import { EndCardScene } from "../components/EndCardScene";

export type DnaLengthProps = {
  /** The nine narrated sentences before the end card, in order (see CAPTION_CUES_S). */
  captionLines: string[];
  buttonText: string;
  audioFile?: string;
  channelName?: string;
};

const defaultProps: DnaLengthProps = {
  captionLines: Array.from({ length: 9 }, (_, i) => `Line ${i + 1}`),
  buttonText: "Button line goes here",
};

const FPS = 30;

// Scene start times in seconds, aligned to the `say` clips mixed into
// assets/audio/016-dna-two-meters.m4a by episodes/016-dna-two-meters/mix.sh:
// cell + DNA, taller than you, hair vs nucleus, tennis ball, packing,
// all your cells + the Sun, end card.
const STARTS_S = [0, 5.5, 9.8, 13.8, 17.9, 27.6, 35.8];
const STARTS = STARTS_S.map((s) => Math.round(s * FPS));
const TOTAL_FRAMES = Math.round(40.5 * FPS);

// When each narrated sentence starts, in seconds from the start of the video.
const CAPTION_CUES_S = [0.15, 3.9, 5.5, 9.8, 13.8, 17.9, 22.9, 27.6, 31.6];

const DARK = colors.background;
const RED = "#FF3B3B";
const TEAL = "#19E0F0";
const GREEN = "#2ED573";
const PURPLE = colors.accent;
const GOLD = colors.accentAlt;
// Base-pair rung colours (A, T, G, C).
const BASES = [GOLD, TEAL, "#FF6B9A", GREEN];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ramp = (t: number, from: number, to: number) => interpolate(t, [from, to], [0, 1], clamp);
const ease = (t: number, from: number, to: number) =>
  interpolate(t, [from, to], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
const pop = (t: number, at: number) =>
  t < at ? 0 : spring({ frame: (t - at) * FPS, fps: FPS, config: { damping: 11, mass: 0.6, stiffness: 140 } });
const mix = (a: number, b: number, k: number) => a + (b - a) * k;

// "2 meters of DNA in every cell": hook -> it's DNA -> taller than you ->
// nucleus thinner than a hair -> 20 km in a tennis ball -> protein spools ->
// coils -> all your cells -> to the Sun and back -> end card.
export const DnaLengthComposition = () => {
  return (
    <Composition
      id="DnaLength"
      component={DnaLength}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
    />
  );
};

const Caption: React.FC<{ lines: string[]; t: number; offsetS: number }> = ({ lines, t, offsetS }) => {
  let current = -1;
  CAPTION_CUES_S.forEach((cue, i) => {
    if (t >= cue) current = i;
  });
  if (current < 0) return null;
  return (
    <div style={{ position: "absolute", top: 150, left: 0, right: 0, padding: "0 70px" }}>
      <TextReveal
        key={current}
        fontSize={58}
        delay={Math.max(0, Math.round((CAPTION_CUES_S[current] - offsetS) * FPS))}
        stagger
        style={{ color: colors.foreground }}
      >
        {lines[current] ?? ""}
      </TextReveal>
    </div>
  );
};

const Stamp: React.FC<{ text: string; appear: number; color: string; size?: number }> = ({
  text,
  appear,
  color,
  size = 84,
}) => {
  if (appear <= 0) return null;
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: 900,
        color,
        border: `8px solid ${color}`,
        borderRadius: 18,
        padding: "4px 28px",
        transform: `rotate(-3deg) scale(${1.5 - 0.5 * Math.min(appear, 1.15)})`,
        opacity: Math.min(1, appear),
        whiteSpace: "nowrap",
        backgroundColor: "rgba(11, 11, 20, 0.6)",
      }}
    >
      {text}
    </div>
  );
};

type StampSpec = { from: number; to: number; text: string; color: string; size?: number };

// Shows whichever stamp is live at scene-local time `s`.
const StampSlot: React.FC<{ stamps: StampSpec[]; s: number; top?: number }> = ({ stamps, s, top = 1580 }) => {
  const stamp = stamps.find((st) => s >= st.from && s < st.to);
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      {stamp ? (
        <Stamp key={stamp.text} text={stamp.text} appear={pop(s, stamp.from)} color={stamp.color} size={stamp.size} />
      ) : null}
    </div>
  );
};

// A horizontal double helix from x0 to x1 around y, drawn as two strands plus
// coloured base-pair rungs. Rotate the wrapping <g> for other directions.
const Helix: React.FC<{
  x0: number;
  x1: number;
  y: number;
  amp: number;
  wavelength: number;
  phase: number;
  width?: number;
  rungs?: boolean;
}> = ({ x0, x1, y, amp, wavelength, phase, width = 10, rungs = true }) => {
  const step = 6;
  const pts = (offset: number) => {
    let d = "";
    for (let x = x0; x <= x1 + 0.1; x += step) {
      const yy = y + amp * Math.sin(((x - x0) / wavelength) * Math.PI * 2 + phase + offset);
      d += `${x === x0 ? "M" : "L"} ${x.toFixed(1)} ${yy.toFixed(1)} `;
    }
    return d;
  };
  const rungEvery = wavelength / 10;
  const rungXs: number[] = [];
  for (let x = x0 + rungEvery / 2; x < x1; x += rungEvery) rungXs.push(x);
  return (
    <g>
      {rungs
        ? rungXs.map((x, i) => {
            const a = ((x - x0) / wavelength) * Math.PI * 2 + phase;
            return (
              <line
                key={i}
                x1={x}
                x2={x}
                y1={y + amp * Math.sin(a)}
                y2={y + amp * Math.sin(a + Math.PI)}
                stroke={BASES[Math.floor(random(`base-${i}`) * 4)]}
                strokeWidth={width * 0.7}
                strokeLinecap="round"
              />
            );
          })
        : null}
      <path d={pts(0)} fill="none" stroke={colors.foreground} strokeWidth={width} strokeLinecap="round" />
      <path d={pts(Math.PI)} fill="none" stroke={PURPLE} strokeWidth={width} strokeLinecap="round" />
    </g>
  );
};

// A long wandering thread that leaves the nucleus: points sampled once.
const THREAD_PTS = (() => {
  const pts: [number, number][] = [[540, 1000]];
  let x = 540;
  let y = 1000;
  let a = -Math.PI / 2;
  for (let i = 0; i < 90; i++) {
    a += (random(`thread-${i}`) - 0.5) * 1.3;
    x += Math.cos(a) * 34;
    y += Math.sin(a) * 34;
    // Keep it on screen, below the caption, by steering back toward the middle.
    if (x < 90 || x > 990 || y < 420 || y > 1500) {
      a = Math.atan2(950 - y, 540 - x) + (random(`steer-${i}`) - 0.5);
      x = Math.min(990, Math.max(90, x));
      y = Math.min(1500, Math.max(420, y));
    }
    pts.push([x, y]);
  }
  return pts;
})();
const toPath = (pts: [number, number][]) =>
  pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
const pathLength = (pts: [number, number][]) =>
  pts.reduce((sum, p, i) => (i === 0 ? 0 : sum + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1])), 0);
const THREAD_LEN = pathLength(THREAD_PTS);

// 0–5.5s: a cell, a thread pulled out of its nucleus, then a zoom into the helix.
const CellScene: React.FC<{ lines: string[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const s = frame / FPS;
  const cell = pop(s, 0.05);
  const pull = ease(s, 0.7, 3.4);
  const zoom = ease(s, 3.75, 4.3);
  const helixIn = ramp(s, 3.95, 4.3);

  return (
    <AbsoluteFill style={{ backgroundColor: DARK }}>
      <BackgroundPulse color={PURPLE} size={1100} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 1 - helixIn,
          transform: `scale(${1 + 3 * zoom})`,
          transformOrigin: "540px 1000px",
        }}
      >
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          <g transform={`translate(540 1000) scale(${Math.min(cell, 1.1)}) translate(-540 -1000)`}>
            <ellipse cx={540} cy={1000} rx={330} ry={300} fill={PURPLE} fillOpacity={0.18} stroke={PURPLE} strokeWidth={10} />
            <circle cx={540} cy={1000} r={110} fill={PURPLE} fillOpacity={0.55} stroke={colors.foreground} strokeWidth={6} />
          </g>
          {pull > 0 ? (
            <path
              d={toPath(THREAD_PTS)}
              fill="none"
              stroke={GOLD}
              strokeWidth={9}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${THREAD_LEN * pull} ${THREAD_LEN}`}
              style={{ filter: `drop-shadow(0 0 10px ${GOLD})` }}
            />
          ) : null}
        </svg>
      </div>

      {helixIn > 0 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", opacity: helixIn }}>
          <g transform={`rotate(-12 540 980)`}>
            <Helix x0={-200} x1={1280} y={980} amp={150} wavelength={520} phase={s * 3} width={22} />
          </g>
        </svg>
      ) : null}

      <Caption lines={lines} t={s} offsetS={0} />
      <StampSlot
        s={s}
        stamps={[
          { from: 2.1, to: 3.8, text: "2 METERS", color: GOLD, size: 100 },
          { from: 4.15, to: 5.6, text: "DNA", color: TEAL, size: 120 },
        ]}
      />
    </AbsoluteFill>
  );
};

// 5.5–9.8s: a 2 m strand of DNA rises next to a person, with a ruler.
const HeightScene: React.FC<{ lines: string[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const s = frame / FPS;
  const floor = 1450;
  const pxPerM = 480 / 1.75; // stick figure is drawn 480 px tall = 1.75 m
  const grow = ease(s, 0.4, 2.4);
  const top = floor - 2 * pxPerM * grow;
  const figure = pop(s, 0.1);

  return (
    <AbsoluteFill style={{ backgroundColor: DARK }}>
      <BackgroundPulse color={PURPLE} size={1100} />
      <Caption lines={lines} t={STARTS_S[1] + s} offsetS={STARTS_S[1]} />

      <div
        style={{
          position: "absolute",
          left: 150,
          top: floor - 480,
          transform: `scale(${Math.min(figure, 1.1)})`,
          transformOrigin: "bottom center",
        }}
      >
        <StickFigure width={300} />
      </div>

      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {/* Floor */}
        <line x1={60} x2={815} y1={floor} y2={floor} stroke={colors.muted} strokeWidth={8} strokeLinecap="round" />

        {/* Ruler */}
        {[0, 0.5, 1, 1.5, 2].map((m) => {
          const y = floor - m * pxPerM;
          return (
            <g key={m} opacity={ramp(s, 0.2 + m * 0.3, 0.5 + m * 0.3)}>
              <line x1={930} x2={980} y1={y} y2={y} stroke={colors.muted} strokeWidth={6} />
              <text x={920} y={y + 14} textAnchor="end" fontSize={40} fontWeight={800} fill={colors.muted} fontFamily="Inter, sans-serif">
                {`${m} m`}
              </text>
            </g>
          );
        })}
        <line x1={980} x2={980} y1={floor} y2={floor - 2 * pxPerM} stroke={colors.muted} strokeWidth={6} />

        {/* The DNA strand from one cell, growing upward */}
        <defs>
          <clipPath id="dna-grow">
            <rect x={500} y={top} width={300} height={floor - top} />
          </clipPath>
        </defs>
        <g clipPath="url(#dna-grow)">
          <g transform={`rotate(-90 650 ${floor})`}>
            <Helix x0={650} x1={650 + 2 * pxPerM} y={floor} amp={70} wavelength={170} phase={s * 2.5} width={14} />
          </g>
        </g>

        {/* Height markers: the person, then the DNA */}
        <g opacity={ramp(s, 2.4, 2.7)}>
          <line x1={140} x2={810} y1={floor - 2 * pxPerM} y2={floor - 2 * pxPerM} stroke={GOLD} strokeWidth={6} strokeDasharray="22 14" />
          <line x1={140} x2={480} y1={floor - 480} y2={floor - 480} stroke={colors.foreground} strokeWidth={5} strokeDasharray="14 12" opacity={0.6} />
          <text x={300} y={floor - 480 - 22} textAnchor="middle" fontSize={40} fontWeight={800} fill={colors.foreground} fontFamily="Inter, sans-serif">
            YOU
          </text>
        </g>
      </svg>

      <StampSlot s={s} stamps={[{ from: 2.6, to: 4.4, text: "TALLER THAN YOU", color: GOLD, size: 84 }]} />
    </AbsoluteFill>
  );
};

// 9.8–13.8s: a giant cross-section of a hair beside a nucleus ten times thinner.
const HairScene: React.FC<{ lines: string[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const s = frame / FPS;
  const hairIn = ease(s, 0, 0.6);
  const nucleus = pop(s, 1.1);
  const arrow = pop(s, 1.6);
  const hx0 = 110;
  const hx1 = 710;

  return (
    <AbsoluteFill style={{ backgroundColor: DARK }}>
      <BackgroundPulse color={PURPLE} size={1100} />
      <Caption lines={lines} t={STARTS_S[2] + s} offsetS={STARTS_S[2]} />

      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="hair" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#5A3A22" />
            <stop offset="0.45" stopColor="#A9744A" />
            <stop offset="1" stopColor="#5A3A22" />
          </linearGradient>
        </defs>
        {/* The hair, seen up close: slides up from the bottom */}
        <g transform={`translate(0 ${(1 - hairIn) * 1200})`}>
          <rect x={hx0} y={420} width={hx1 - hx0} height={1200} fill="url(#hair)" />
          {Array.from({ length: 14 }).map((_, i) => (
            <path
              key={i}
              d={`M ${hx0} ${470 + i * 85} Q ${(hx0 + hx1) / 2} ${430 + i * 85} ${hx1} ${470 + i * 85}`}
              fill="none"
              stroke="#3B2414"
              strokeWidth={5}
              opacity={0.6}
            />
          ))}
          <text x={(hx0 + hx1) / 2} y={1010} textAnchor="middle" fontSize={78} fontWeight={900} fill={colors.foreground} fontFamily="Inter, sans-serif" opacity={0.9}>
            1 HAIR
          </text>
        </g>

        {/* Width bracket on the hair */}
        <g opacity={ramp(s, 0.7, 1.0)}>
          <path d={`M ${hx0} 1290 L ${hx0} 1330 L ${hx1} 1330 L ${hx1} 1290`} fill="none" stroke={GOLD} strokeWidth={6} />
          <text x={(hx0 + hx1) / 2} y={1395} textAnchor="middle" fontSize={44} fontWeight={800} fill={GOLD} fontFamily="Inter, sans-serif">
            10×
          </text>
        </g>

        {/* The nucleus, one tenth of the hair's width */}
        {nucleus > 0 ? (
          <g transform={`translate(880 980) scale(${Math.min(nucleus, 1.15)})`}>
            <circle r={60} fill={PURPLE} opacity={0.35} style={{ filter: "blur(10px)" }} />
            <circle r={30} fill={PURPLE} stroke={colors.foreground} strokeWidth={4} />
          </g>
        ) : null}
        {arrow > 0 ? (
          <g opacity={Math.min(1, arrow)}>
            <path d="M 880 820 L 880 920" stroke={TEAL} strokeWidth={8} strokeLinecap="round" />
            <path d="M 858 895 L 880 925 L 902 895" fill="none" stroke={TEAL} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
            <text x={880} y={790} textAnchor="middle" fontSize={40} fontWeight={800} fill={TEAL} fontFamily="Inter, sans-serif">
              NUCLEUS
            </text>
            <text x={880} y={1080} textAnchor="middle" fontSize={34} fontWeight={700} fill={colors.foreground} fontFamily="Inter, sans-serif">
              2 m of DNA
            </text>
            <text x={880} y={1120} textAnchor="middle" fontSize={34} fontWeight={700} fill={colors.foreground} fontFamily="Inter, sans-serif">
              in here
            </text>
          </g>
        ) : null}
      </svg>

      <StampSlot s={s} stamps={[{ from: 2.0, to: 4.1, text: "10× THINNER", color: TEAL, size: 96 }]} />
    </AbsoluteFill>
  );
};

// A tangled ball of thread inside a circle (random walk, bounced off the edge).
const YARN_PTS = (() => {
  const cx = 540;
  const cy = 960;
  const R = 230;
  const pts: [number, number][] = [[-60, 560]];
  let x = 260;
  let y = 760;
  pts.push([x, y]);
  let a = 0.6;
  for (let i = 0; i < 260; i++) {
    a += (random(`yarn-${i}`) - 0.5) * 1.6;
    let nx = x + Math.cos(a) * 30;
    let ny = y + Math.sin(a) * 30;
    if (Math.hypot(nx - cx, ny - cy) > R) {
      a = Math.atan2(cy - y, cx - x) + (random(`yb-${i}`) - 0.5) * 1.4;
      nx = x + Math.cos(a) * 30;
      ny = y + Math.sin(a) * 30;
    }
    x = nx;
    y = ny;
    pts.push([x, y]);
  }
  return pts;
})();
const YARN_LEN = pathLength(YARN_PTS);

// 13.8–17.9s: 20 km of thread stuffed into a tennis ball.
const TennisScene: React.FC<{ lines: string[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const s = frame / FPS;
  const ball = pop(s, 0.05);
  const fill = ease(s, 0.3, 3.4);
  const km = Math.round(20 * fill);

  return (
    <AbsoluteFill style={{ backgroundColor: DARK }}>
      <BackgroundPulse color={PURPLE} size={1100} />
      <Caption lines={lines} t={STARTS_S[3] + s} offsetS={STARTS_S[3]} />

      <div
        style={{
          position: "absolute",
          top: 1260,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 150,
          fontWeight: 900,
          color: GOLD,
          opacity: ramp(s, 0.3, 0.6),
        }}
      >
        {`${km} km`}
      </div>

      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <g transform={`translate(540 960) scale(${Math.min(ball, 1.1)}) translate(-540 -960)`}>
          <circle cx={540} cy={960} r={260} fill="#C8E62E" />
          <path d="M 300 860 Q 470 960 300 1060" fill="none" stroke="#FFFFFF" strokeWidth={14} strokeLinecap="round" />
          <path d="M 780 860 Q 610 960 780 1060" fill="none" stroke="#FFFFFF" strokeWidth={14} strokeLinecap="round" />
        </g>
        {fill > 0 ? (
          <path
            d={toPath(YARN_PTS)}
            fill="none"
            stroke={RED}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${YARN_LEN * fill} ${YARN_LEN}`}
            opacity={0.9}
          />
        ) : null}
      </svg>

      <StampSlot s={s} stamps={[{ from: 2.0, to: 4.2, text: "IN A TENNIS BALL", color: GREEN, size: 84 }]} top={1500} />
    </AbsoluteFill>
  );
};

// Spool (histone) positions while laid out in a line, and once coiled up.
const SPOOLS = 9;
const SPOOL_R = 34;
const lineX = (i: number) => 120 + i * 105;
// Coiled: the spools close up into a ring (a loop of the coil, seen end-on).
const coilPos = (i: number) => {
  const a = -Math.PI / 2 + (i / SPOOLS) * Math.PI * 2;
  return { x: 540 + 150 * Math.cos(a), y: 980 + 150 * Math.sin(a), z: Math.sin(a) };
};

// 17.9–27.6s: DNA wraps around protein spools, the spools coil, and coil again
// into a chromosome.
const PackScene: React.FC<{ lines: string[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const s = frame / FPS;
  const Y = 980;

  const helixOut = ramp(s, 1.3, 1.9);
  const coil = ease(s, 5.1, 6.3);
  const coil2 = ease(s, 6.6, 7.5);
  const chromo = pop(s, 7.5);
  const beadsOut = ramp(s, 7.4, 7.8);

  const beadPos = (i: number) => {
    const c = coilPos(i);
    return { x: mix(lineX(i), c.x, coil), y: mix(Y, c.y, coil), z: c.z * coil };
  };
  const beads = Array.from({ length: SPOOLS }, (_, i) => ({ i, ...beadPos(i) }));
  // Draw back beads first so the coil reads as 3D.
  const order = [...beads].sort((a, b) => a.z - b.z);

  // Linker DNA between neighbouring spools.
  const linker = beads
    .map((b, k) => {
      if (k === 0) return `M ${b.x - 70 * (1 - coil)} ${b.y}`;
      const p = beads[k - 1];
      const mx = (p.x + b.x) / 2;
      const my = (p.y + b.y) / 2 + 26 * (1 - coil) * (k % 2 ? 1 : -1);
      return `Q ${mx} ${my} ${b.x} ${b.y}`;
    })
    .join(" ");

  return (
    <AbsoluteFill style={{ backgroundColor: DARK }}>
      <BackgroundPulse color={PURPLE} size={1100} />
      <Caption lines={lines} t={STARTS_S[4] + s} offsetS={STARTS_S[4]} />

      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {helixOut < 1 ? (
          <g opacity={(1 - helixOut) * ramp(s, 0, 0.3)}>
            <Helix x0={40} x1={1040} y={Y} amp={50} wavelength={190} phase={s * 3} width={10} />
          </g>
        ) : null}

        {beadsOut < 1 ? (
          <g
            opacity={1 - beadsOut}
            transform={`translate(540 980) scale(${1 - 0.45 * coil2}) rotate(${-25 * coil2}) translate(-540 -980)`}
          >
            <path d={linker} fill="none" stroke={GOLD} strokeWidth={8} opacity={ramp(s, 1.3, 1.9)} />
            {order.map((b) => {
              const a = pop(s, 1.0 + b.i * 0.08);
              if (a <= 0) return null;
              const r = SPOOL_R * Math.min(a, 1.15);
              const wrap = ramp(s, 1.5 + b.i * 0.08, 2.3 + b.i * 0.08);
              const circ = 2 * Math.PI * (r + 8);
              const shade = 0.75 + 0.25 * b.z;
              return (
                <g key={b.i} opacity={shade}>
                  <circle cx={b.x} cy={b.y} r={r} fill={PURPLE} />
                  <circle
                    cx={b.x}
                    cy={b.y}
                    r={r + 8}
                    fill="none"
                    stroke={GOLD}
                    strokeWidth={7}
                    strokeDasharray={`${circ * wrap} ${circ}`}
                    transform={`rotate(-90 ${b.x} ${b.y})`}
                  />
                  <circle
                    cx={b.x}
                    cy={b.y}
                    r={Math.max(0, r - 3)}
                    fill="none"
                    stroke={GOLD}
                    strokeWidth={6}
                    strokeDasharray={`${circ * 0.7 * ramp(s, 2.0 + b.i * 0.08, 2.6 + b.i * 0.08)} ${circ}`}
                    transform={`rotate(90 ${b.x} ${b.y})`}
                  />
                </g>
              );
            })}
          </g>
        ) : null}

        {/* The finished bundle: a chromosome */}
        {chromo > 0 ? (
          <g transform={`translate(540 980) scale(${Math.min(chromo, 1.12)})`}>
            {[-22, 22].map((deg) => (
              <g key={deg} transform={`rotate(${deg})`}>
                <rect x={-62} y={-300} width={124} height={600} rx={62} fill={PURPLE} />
                {[-220, -130, -60, 70, 150, 230].map((by, k) => (
                  <rect key={k} x={-62} y={by} width={124} height={k % 2 ? 22 : 34} fill={k % 3 ? GOLD : TEAL} opacity={0.85} />
                ))}
              </g>
            ))}
            <circle r={34} fill={colors.foreground} />
          </g>
        ) : null}
      </svg>

      <StampSlot
        s={s}
        stamps={[
          { from: 1.6, to: 3.3, text: "PROTEIN SPOOLS", color: PURPLE, size: 84 },
          { from: 3.3, to: 5.0, text: "THREAD ON A BOBBIN", color: GOLD, size: 76 },
          { from: 5.2, to: 6.6, text: "COIL…", color: TEAL, size: 96 },
          { from: 6.6, to: 7.9, text: "…AND COIL AGAIN", color: TEAL, size: 86 },
          { from: 7.9, to: 9.8, text: "PACKED!", color: GREEN, size: 110 },
        ]}
      />
    </AbsoluteFill>
  );
};

// Fixed starfield for the space beat.
const STARS = Array.from({ length: 70 }, (_, i) => ({
  x: random(`sx-${i}`) * 1080,
  y: 330 + random(`sy-${i}`) * 1400,
  r: 1.5 + random(`sr-${i}`) * 2.5,
}));
const TRIPS = 12;
const TRIPS_FROM = 4.3;
const TRIPS_TO = 6.6;

// 27.6–35.8s: cells multiply into trillions, then all that DNA zips between
// the Earth and the Sun, more than a dozen round trips.
const SunScene: React.FC<{ lines: string[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const s = frame / FPS;

  // Cells doubling: 1, 2, 4, ... 1024.
  const k = Math.min(10, Math.floor(Math.max(0, s - 0.2) / 0.3));
  const n = 2 ** k;
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const size = Math.min(820 / cols, 820 / rows);
  const cellsOut = ramp(s, 3.8, 4.2);
  const space = ramp(s, 3.9, 4.3);

  const earth = { x: 540, y: 1470 };
  const sun = { x: 540, y: 560 };
  const trips = ramp(s, TRIPS_FROM, TRIPS_TO) * TRIPS;
  const done = Math.floor(trips);
  const frac = trips - done;

  // One string per finished round trip, fanned out a little; plus the one in flight.
  const xAt = (j: number) => 540 + (j - (TRIPS - 1) / 2) * 7;
  const legs: { x: number; y0: number; y1: number }[] = [];
  for (let j = 0; j < Math.min(done + 1, TRIPS); j++) {
    const p = j < done ? 1 : frac;
    // Up leg then down leg.
    const up = Math.min(1, p * 2);
    const down = Math.max(0, p * 2 - 1);
    legs.push({ x: xAt(j) - 3, y0: earth.y, y1: mix(earth.y, sun.y, up) });
    if (down > 0) legs.push({ x: xAt(j) + 3, y0: sun.y, y1: mix(sun.y, earth.y, down) });
  }
  const shown = Math.min(TRIPS, done);

  return (
    <AbsoluteFill style={{ backgroundColor: DARK }}>
      <BackgroundPulse color={PURPLE} size={1100} />

      {cellsOut < 1 ? (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - cellsOut }}>
          <svg width={1080} height={1920} style={{ position: "absolute" }}>
            {Array.from({ length: n }).map((_, i) => {
              const cx = 540 + ((i % cols) - (cols - 1) / 2) * size;
              const cy = 1000 + (Math.floor(i / cols) - (rows - 1) / 2) * size;
              return (
                <g key={i}>
                  <circle cx={cx} cy={cy} r={size * 0.42} fill={PURPLE} fillOpacity={0.45} />
                  <circle cx={cx} cy={cy} r={size * 0.15} fill={GOLD} />
                </g>
              );
            })}
          </svg>
          <div style={{ position: "absolute", top: 1440, left: 0, right: 0, textAlign: "center", fontSize: 70, fontWeight: 900, color: colors.foreground }}>
            {k >= 10 ? "TRILLIONS OF CELLS" : `${n.toLocaleString("en-US")} ${n === 1 ? "cell" : "cells"}`}
          </div>
        </div>
      ) : null}

      {space > 0 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", opacity: space }}>
          {STARS.map((st, i) => (
            <circle key={i} cx={st.x} cy={st.y} r={st.r} fill={colors.foreground} opacity={0.35 + 0.3 * Math.sin(frame / 9 + i)} />
          ))}
          {legs.map((l, i) => (
            <line
              key={i}
              x1={l.x}
              x2={l.x}
              y1={l.y0}
              y2={l.y1}
              stroke={TEAL}
              strokeWidth={4}
              opacity={0.9}
              style={{ filter: `drop-shadow(0 0 6px ${TEAL})` }}
            />
          ))}
          <circle cx={sun.x} cy={sun.y} r={210} fill={GOLD} opacity={0.25} style={{ filter: "blur(30px)" }} />
          <circle cx={sun.x} cy={sun.y} r={150} fill={GOLD} />
          <text x={sun.x} y={sun.y + 18} textAnchor="middle" fontSize={52} fontWeight={900} fill={DARK} fontFamily="Inter, sans-serif">
            SUN
          </text>
          <circle cx={earth.x} cy={earth.y} r={62} fill="#2F7BFF" />
          <path d="M 505 1450 Q 525 1425 550 1440 Q 560 1470 530 1490 Z" fill={GREEN} />
          <path d="M 560 1500 Q 585 1480 595 1505 Q 580 1525 560 1515 Z" fill={GREEN} />
          <text x={earth.x} y={earth.y + 120} textAnchor="middle" fontSize={44} fontWeight={900} fill={colors.foreground} fontFamily="Inter, sans-serif">
            EARTH
          </text>
        </svg>
      ) : null}

      {/* Round-trip counter */}
      {s >= TRIPS_FROM ? (
        <div
          style={{
            position: "absolute",
            top: 900,
            left: 640,
            fontSize: 130,
            fontWeight: 900,
            color: TEAL,
            textShadow: `0 0 24px ${TEAL}`,
          }}
        >
          {`×${shown}${s >= TRIPS_TO ? "+" : ""}`}
        </div>
      ) : null}

      <Caption lines={lines} t={STARTS_S[5] + s} offsetS={STARTS_S[5]} />
      <StampSlot
        s={s}
        top={1660}
        stamps={[
          { from: 0.4, to: 3.9, text: "ADD THEM UP", color: GOLD, size: 76 },
          { from: TRIPS_TO, to: 8.3, text: "12+ ROUND TRIPS", color: TEAL, size: 80 },
        ]}
      />
    </AbsoluteFill>
  );
};

export const DnaLength: React.FC<DnaLengthProps> = ({ captionLines, buttonText, audioFile, channelName }) => {
  const bounds = [...STARTS, TOTAL_FRAMES];
  const dur = (i: number) => bounds[i + 1] - bounds[i];
  const scenes = [CellScene, HeightScene, HairScene, TennisScene, PackScene, SunScene];

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background, fontFamily: "Inter, sans-serif" }}>
      {audioFile ? <Audio src={staticFile(audioFile)} /> : null}

      {scenes.map((Scene, i) => (
        <Sequence key={i} from={STARTS[i]} durationInFrames={dur(i)}>
          <Scene lines={captionLines} />
        </Sequence>
      ))}
      <Sequence from={STARTS[6]} durationInFrames={dur(6)}>
        <EndCardScene text={buttonText} />
      </Sequence>

      <ChannelWatermark text={channelName} />
    </AbsoluteFill>
  );
};
