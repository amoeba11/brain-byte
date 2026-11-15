import {
  AbsoluteFill,
  Audio,
  Composition,
  Easing,
  Sequence,
  interpolate,
  interpolateColors,
  random,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { colors } from "../themes/colors";
import { TextReveal } from "../components/TextReveal";
import { BackgroundPulse } from "../components/BackgroundPulse";
import { ChannelWatermark } from "../components/ChannelWatermark";
import { EndCardScene } from "../components/EndCardScene";

export type PopcornPopProps = {
  /** The ten narrated sentences before the end card, in order (see CAPTION_CUES_S). */
  captionLines: string[];
  buttonText: string;
  audioFile?: string;
  channelName?: string;
};

const defaultProps: PopcornPopProps = {
  captionLines: Array.from({ length: 10 }, (_, i) => `Line ${i + 1}`),
  buttonText: "Button line goes here",
};

const FPS = 30;

// Scene start times in seconds: the kernel heating up, the pop and the
// popcorn, the duds in the bowl, the end card. Aligned to the `say` clips
// mixed into assets/audio/015-popcorn-pressure-bomb.m4a by mix.sh.
const POP_S = 19.9;
const STARTS_S = [0, POP_S, 30.3, 36.2];
const STARTS = STARTS_S.map((s) => Math.round(s * FPS));
const TOTAL_FRAMES = Math.round(40.0 * FPS);

// When each narrated sentence starts, in seconds from the start of the video.
const CAPTION_CUES_S = [0.15, 3.4, 7.7, 10.6, 12.5, 15.9, 19.9, 21.3, 26.0, 30.3];

const DARK = "#0B0B14";
const RED = "#FF4D4D";
const TEAL = "#19E0F0";
const GOLD = colors.accentAlt;
const KERNEL = "#FFB627";
const KERNEL_HOT = "#FF6B3D";
const KERNEL_EDGE = "#B85C00";
const FLUFF = "#FFF7E6";
const FLUFF_EDGE = "#E9CF9C";
const BUTTER = "#FFE08A";
const INK = "#2B1A0E";
const BLUSH = "#FF8FA3";
const WATER = "#5CC8FF";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ramp = (t: number, from: number, to: number) => interpolate(t, [from, to], [0, 1], clamp);
const ease = (t: number, from: number, to: number) =>
  interpolate(t, [from, to], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
const pop = (t: number, at: number) =>
  t < at ? 0 : spring({ frame: (t - at) * FPS, fps: FPS, config: { damping: 11, mass: 0.6, stiffness: 140 } });
const blinkAt = (t: number, phase = 0) => {
  const c = (t + phase) % 3.1;
  return c > 2.95 ? 0.12 : 1;
};

// "Popcorn is a tiny pressure bomb": a cute kernel -> water sealed inside ->
// heat turns it to steam -> the shell holds it in -> pressure builds -> POP ->
// starch foam -> 40x bigger and a flip -> the duds leak -> end card.
export const PopcornPopComposition = () => {
  return (
    <Composition
      id="PopcornPop"
      component={PopcornPop}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
    />
  );
};

type Expression = "happy" | "flat" | "nervous" | "squeeze" | "joy" | "sad" | "wow";

// A cute face, centred between the eyes at (0, 0). Eyes sit 50 apart from centre.
const Face: React.FC<{ expr: Expression; blink?: number; t: number }> = ({ expr, blink = 1, t }) => {
  const eye = (x: number) => {
    if (expr === "squeeze") {
      const d = x < 0 ? 1 : -1;
      return (
        <path
          key={x}
          d={`M ${x - 18 * d} -16 L ${x + 14 * d} 0 L ${x - 18 * d} 16`}
          fill="none"
          stroke={INK}
          strokeWidth={9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }
    if (expr === "joy") {
      return (
        <path
          key={x}
          d={`M ${x - 20} 8 Q ${x} -22 ${x + 20} 8`}
          fill="none"
          stroke={INK}
          strokeWidth={9}
          strokeLinecap="round"
        />
      );
    }
    const ry = (expr === "flat" ? 12 : expr === "wow" ? 30 : 26) * blink;
    return (
      <g key={x}>
        <ellipse cx={x} cy={expr === "flat" ? 6 : 0} rx={20} ry={ry} fill={INK} />
        {blink > 0.5 ? <circle cx={x + 7} cy={expr === "flat" ? 2 : -9} r={7} fill="#FFFFFF" /> : null}
        {expr === "flat" ? (
          <path d={`M ${x - 26} -8 L ${x + 26} -8`} stroke={INK} strokeWidth={8} strokeLinecap="round" />
        ) : null}
        {expr === "sad" ? (
          <path
            d={`M ${x - 22} ${x < 0 ? -24 : -38} L ${x + 22} ${x < 0 ? -38 : -24}`}
            stroke={INK}
            strokeWidth={7}
            strokeLinecap="round"
          />
        ) : null}
      </g>
    );
  };

  let mouth: React.ReactNode;
  if (expr === "happy") {
    mouth = <path d="M -26 48 Q 0 76 26 48" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />;
  } else if (expr === "flat") {
    mouth = <path d="M -20 58 L 20 58" stroke={INK} strokeWidth={8} strokeLinecap="round" />;
  } else if (expr === "nervous" || expr === "squeeze") {
    const j = expr === "squeeze" ? 7 : 5;
    mouth = (
      <path
        d={`M -32 58 q 8 ${-j} 16 0 t 16 0 t 16 0 t 16 0`}
        fill="none"
        stroke={INK}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  } else if (expr === "sad") {
    mouth = <path d="M -24 66 Q 0 44 24 66" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />;
  } else if (expr === "wow") {
    mouth = <ellipse cx={0} cy={60} rx={14} ry={18} fill={INK} />;
  } else {
    mouth = (
      <g>
        <path d="M -34 40 Q 0 100 34 40 Z" fill={INK} />
        <path d="M -16 66 Q 0 56 16 66 Q 0 84 -16 66 Z" fill={BLUSH} />
      </g>
    );
  }

  // Sweat drop slides down when nervous; a tear when sad.
  const drip = (t * 0.9) % 1;
  return (
    <g>
      <ellipse cx={-88} cy={42} rx={26} ry={15} fill={BLUSH} opacity={0.65} />
      <ellipse cx={88} cy={42} rx={26} ry={15} fill={BLUSH} opacity={0.65} />
      {eye(-50)}
      {eye(50)}
      {mouth}
      {expr === "nervous" || expr === "squeeze" ? (
        <path
          d="M 0 -22 Q 14 0 0 8 Q -14 0 0 -22 Z"
          transform={`translate(${108} ${-40 + drip * 50})`}
          fill={WATER}
          opacity={1 - drip * 0.6}
        />
      ) : null}
      {expr === "sad" ? (
        <path
          d="M 0 -18 Q 12 0 0 7 Q -12 0 0 -18 Z"
          transform={`translate(-58 ${32 + drip * 60})`}
          fill={WATER}
          opacity={1 - drip}
        />
      ) : null}
    </g>
  );
};

// Kernel outline in its own 400 x 460 box (wide round top, pointed tip at the bottom).
const KERNEL_PATH =
  "M200 20 C330 20 390 120 380 230 C370 330 290 420 220 452 Q200 460 180 452 C110 420 30 330 20 230 C10 120 70 20 200 20 Z";

const Kernel: React.FC<{
  id: string;
  t: number;
  expr: Expression;
  heat?: number;
  inside?: number;
  crack?: number;
  dry?: number;
  blinkPhase?: number;
  children?: React.ReactNode;
}> = ({ id, t, expr, heat = 0, inside = 0, crack = 0, dry = 0, blinkPhase = 0, children }) => {
  const fill = interpolateColors(heat, [0, 1], [KERNEL, KERNEL_HOT]);
  const body = dry > 0 ? interpolateColors(dry, [0, 1], [fill, "#C9A36A"]) : fill;
  return (
    <g>
      <defs>
        <clipPath id={`clip-${id}`}>
          <path d={KERNEL_PATH} />
        </clipPath>
      </defs>
      <path d={KERNEL_PATH} fill={body} opacity={1 - 0.72 * inside} />
      {inside > 0 ? (
        <g clipPath={`url(#clip-${id})`} opacity={inside}>
          <path d={KERNEL_PATH} fill={interpolateColors(heat, [0, 1], ["#3A1E0A", "#5A140A"])} opacity={0.55} />
          {children}
        </g>
      ) : null}
      <path d={KERNEL_PATH} fill="none" stroke={interpolateColors(heat, [0, 1], [KERNEL_EDGE, "#E8321E"])} strokeWidth={inside > 0 ? 14 + 6 * inside : 10} />
      {/* Shiny highlight and the pale tip cap. */}
      <ellipse cx={130} cy={110} rx={46} ry={24} fill="#FFFFFF" opacity={0.45 * (1 - inside)} transform="rotate(-30 130 110)" />
      <path d="M176 446 Q200 410 224 446 Q200 462 176 446 Z" fill="#FFF0C8" opacity={0.9} />
      {crack > 0 ? (
        <path
          d="M 300 90 L 270 140 L 300 170 L 262 222 L 290 252"
          fill="none"
          stroke={INK}
          strokeWidth={9}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - crack}
        />
      ) : null}
      <g transform="translate(200 175)">
        <Face expr={expr} blink={blinkAt(t, blinkPhase)} t={t} />
      </g>
    </g>
  );
};

// One fluffy popcorn puff, centred on (0, 0) and about 600 wide at scale 1.
const BLOBS = [
  { x: 0, y: 0, r: 150 },
  { x: -150, y: 30, r: 115 },
  { x: 150, y: 30, r: 115 },
  { x: -95, y: -120, r: 105 },
  { x: 95, y: -125, r: 110 },
  { x: 0, y: -175, r: 95 },
  { x: -200, y: -70, r: 80 },
  { x: 205, y: -60, r: 80 },
  { x: -70, y: 130, r: 95 },
  { x: 80, y: 130, r: 95 },
];

const Popcorn: React.FC<{
  t: number;
  appearFrom?: number;
  face?: Expression;
  wobble?: number;
  seed?: string;
}> = ({ t, appearFrom = -10, face, wobble = 0, seed = "p" }) => (
  <g>
    {/* Hull flake left over from the burst kernel, tucked under the fluff. */}
    <path d="M -70 175 Q 0 250 70 175 Q 40 215 0 222 Q -40 215 -70 175 Z" fill={KERNEL} stroke={KERNEL_EDGE} strokeWidth={6} />
    {BLOBS.map((b, i) => {
      const a = Math.min(1.12, pop(t, appearFrom + i * 0.05));
      if (a <= 0) return null;
      const breathe = 1 + wobble * 0.04 * Math.sin(t * 7 + i * 1.7);
      return (
        <circle key={`e${i}`} cx={b.x} cy={b.y} r={b.r * a * breathe + 6} fill={FLUFF_EDGE} />
      );
    })}
    {BLOBS.map((b, i) => {
      const a = Math.min(1.12, pop(t, appearFrom + i * 0.05));
      if (a <= 0) return null;
      const breathe = 1 + wobble * 0.04 * Math.sin(t * 7 + i * 1.7);
      return <circle key={`f${i}`} cx={b.x} cy={b.y} r={b.r * a * breathe} fill={FLUFF} />;
    })}
    {/* Butter splotches and soft highlights. */}
    {[0, 1, 2, 3].map((i) => {
      const b = BLOBS[(i * 3 + 1) % BLOBS.length];
      const a = Math.min(1, pop(t, appearFrom + 0.4 + i * 0.05));
      return (
        <ellipse
          key={`b${i}`}
          cx={b.x + (random(`${seed}-bx${i}`) - 0.5) * 50}
          cy={b.y + 20}
          rx={34 * a}
          ry={22 * a}
          fill={BUTTER}
          opacity={0.85}
        />
      );
    })}
    {face ? (
      <g transform="translate(0 -20)" opacity={Math.min(1, pop(t, appearFrom + 0.3))}>
        <Face expr={face} blink={blinkAt(t, 0.7)} t={t} />
      </g>
    ) : null}
  </g>
);

const Check: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M4 13 L10 19 L21 6" fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Stamp: React.FC<{ text: string; appear: number; color: string; size?: number; check?: boolean }> = ({
  text,
  appear,
  color,
  size = 84,
  check,
}) => {
  if (appear <= 0) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        fontSize: size,
        fontWeight: 900,
        color,
        border: `8px solid ${color}`,
        borderRadius: 18,
        padding: "4px 28px",
        backgroundColor: "rgba(11, 11, 20, 0.7)",
        transform: `rotate(-3deg) scale(${1.5 - 0.5 * Math.min(appear, 1.15)})`,
        opacity: Math.min(1, appear),
        whiteSpace: "nowrap",
      }}
    >
      {text}
      {check ? <Check size={size} color={color} /> : null}
    </div>
  );
};

type StampSpec = { from: number; to: number; text: string; color: string; size?: number; check?: boolean };
const STAMPS: StampSpec[] = [
  { from: 1.6, to: 3.4, text: "TINY BOMB", color: RED, size: 96 },
  { from: 4.6, to: 7.7, text: "SEALED IN", color: TEAL, size: 92 },
  { from: 9.0, to: 10.6, text: "STEAM!", color: FLUFF, size: 100 },
  { from: 11.0, to: 12.5, text: "SHELL: NOPE", color: GOLD, size: 92 },
  { from: 13.4, to: 15.9, text: "9× AIR PRESSURE", color: RED, size: 76 },
  { from: 16.4, to: 18.1, text: "ALMOST…", color: GOLD, size: 96 },
  { from: 18.1, to: 18.7, text: "3", color: RED, size: 150 },
  { from: 18.7, to: 19.3, text: "2", color: RED, size: 150 },
  { from: 19.3, to: 19.9, text: "1", color: RED, size: 150 },
  { from: 21.3, to: 23.3, text: "SHELL BURSTS", color: KERNEL, size: 88 },
  { from: 23.3, to: 26.0, text: "STARCH FOAM", color: FLUFF, size: 92 },
  { from: 26.6, to: 28.2, text: "40× BIGGER", color: GOLD, size: 100 },
  { from: 28.3, to: 30.3, text: "FLIP!", color: TEAL, size: 110, check: true },
  { from: 30.8, to: 32.6, text: "THE DUDS", color: colors.muted, size: 96 },
  { from: 32.6, to: 34.4, text: "CRACKED", color: RED, size: 100 },
  { from: 34.4, to: 36.2, text: "TOO DRY", color: GOLD, size: 100 },
];

const StampLayer: React.FC<{ t: number }> = ({ t }) => {
  const stamp = STAMPS.find((s) => t >= s.from && t < s.to);
  return (
    <div style={{ position: "absolute", top: 1470, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      {stamp ? (
        <Stamp
          key={stamp.text}
          text={stamp.text}
          appear={pop(t, stamp.from)}
          color={stamp.color}
          size={stamp.size}
          check={stamp.check}
        />
      ) : null}
    </div>
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
        style={{ color: colors.foreground, textShadow: "0 4px 18px rgba(0,0,0,0.95), 0 0 4px #000" }}
      >
        {lines[current] ?? ""}
      </TextReveal>
    </div>
  );
};

// A flickering cartoon flame, base centred at (0, 0), pointing up.
const Flame: React.FC<{ t: number; i: number; power: number }> = ({ t, i, power }) => {
  const f = 1 + 0.18 * Math.sin(t * 19 + i * 2.1) + 0.08 * Math.sin(t * 31 + i);
  const h = (70 + 70 * power) * f;
  return (
    <g>
      <path d={`M -38 0 Q -44 ${-h * 0.5} 0 ${-h} Q 44 ${-h * 0.5} 38 0 Q 0 22 -38 0 Z`} fill="#FF7A1A" />
      <path d={`M -20 0 Q -24 ${-h * 0.35} 0 ${-h * 0.62} Q 24 ${-h * 0.35} 20 0 Q 0 12 -20 0 Z`} fill="#FFD84D" />
    </g>
  );
};

// Steam puffs bouncing around inside the kernel, faster as the heat rises.
const STEAM = Array.from({ length: 9 }, (_, i) => ({
  w1: 1.3 + random(`w1-${i}`) * 1.4,
  w2: 1.1 + random(`w2-${i}`) * 1.6,
  p1: random(`p1-${i}`) * 6.28,
  p2: random(`p2-${i}`) * 6.28,
  at: 8.7 + i * 0.12,
}));

// Starch granules packed inside the kernel.
const GRANULES = Array.from({ length: 16 }, (_, i) => ({
  x: 90 + random(`gx-${i}`) * 220,
  y: 250 + random(`gy-${i}`) * 150,
  r: 16 + random(`gr-${i}`) * 12,
}));

const KernelStage: React.FC<{ lines: string[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  const intro = pop(t, 0.05);
  const inside = ease(t, 3.4, 4.1);
  const flames = pop(t, 7.7);
  const toSteam = ease(t, 8.5, 9.6);
  const pressure = interpolate(t, [10.0, 12.5, 15.9, 19.8], [0, 0.3, 0.7, 1], clamp);
  const heat = interpolate(t, [7.7, 15.9, 19.8], [0, 0.35, 1], clamp);
  const temp = Math.round(interpolate(t, [7.7, 15.9, 19.5], [20, 150, 180], clamp));

  let expr: Expression = "happy";
  if (t >= 10.6) expr = "flat";
  if (t >= 12.5) expr = "nervous";
  if (t >= 15.9) expr = "squeeze";

  // The kernel hops in, then shakes harder and bulges as the steam pushes.
  const hop = Math.abs(Math.sin(t * 5)) * 30 * (1 - ramp(t, 1.2, 1.6));
  const shake = Math.sin(t * 55) * (4 + 22 * pressure * pressure) * ramp(t, 10.6, 11);
  const bulgeX = 1 + 0.07 * pressure + 0.025 * pressure * Math.sin(t * 24);
  const bulgeY = 1 + 0.05 * pressure - 0.02 * pressure * Math.sin(t * 24);
  const S = 1.35 * (0.4 + 0.6 * intro);
  const kx = 540 + shake;
  const ky = 905 - hop;

  // The fuse on top (hook only): a sparkly little bomb fuse.
  const fuse = pop(t, 1.0) * (1 - ramp(t, 3.2, 3.5));

  const gauge = pop(t, 12.5);
  const needle = interpolate(pressure, [0, 1], [-90, 90]) + Math.sin(t * 40) * 3 * pressure;
  const thermo = pop(t, 7.9);
  const fillFrac = interpolate(temp, [20, 180], [0.08, 1], clamp);

  const labels = pop(t, 4.0) * (1 - ramp(t, 7.4, 7.7));

  return (
    <AbsoluteFill style={{ backgroundColor: DARK }}>
      <BackgroundPulse color={interpolateColors(heat, [0, 1], [colors.accent, KERNEL_HOT])} size={1200} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
        {/* Pan and flames. */}
        <g opacity={Math.min(1, flames * 1.5)} transform={`translate(0 ${(1 - Math.min(1, flames)) * 60})`}>
          {[300, 420, 540, 660, 780].map((x, i) => (
            <g key={i} transform={`translate(${x} 1400)`}>
              <Flame t={t} i={i} power={heat} />
            </g>
          ))}
        </g>
        <g opacity={Math.min(1, intro)}>
          <rect x={210} y={1226} width={660} height={44} rx={22} fill="#3B3B4F" />
          <rect x={860} y={1236} width={190} height={24} rx={12} fill="#2A2A3A" />
        </g>

        {/* The kernel. */}
        <g transform={`translate(${kx} ${ky}) scale(${S * bulgeX} ${S * bulgeY}) translate(-200 -240)`}>
          {fuse > 0 ? (
            <g opacity={Math.min(1, fuse)}>
              <path d="M 200 22 Q 215 -30 250 -50" fill="none" stroke="#6B4A2B" strokeWidth={10} strokeLinecap="round" />
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const a = (i / 6) * Math.PI * 2 + t * 6;
                const r = 18 + 8 * Math.sin(t * 30 + i);
                return (
                  <line
                    key={i}
                    x1={250}
                    y1={-50}
                    x2={250 + Math.cos(a) * r}
                    y2={-50 + Math.sin(a) * r}
                    stroke={GOLD}
                    strokeWidth={6}
                    strokeLinecap="round"
                  />
                );
              })}
              <circle cx={250} cy={-50} r={9} fill="#FFFFFF" />
            </g>
          ) : null}
          <Kernel id="hero" t={t} expr={expr} heat={heat} inside={inside}>
            {GRANULES.map((g, i) => (
              <circle key={i} cx={g.x} cy={g.y} r={g.r} fill="#FFF3D1" opacity={0.55} />
            ))}
            {/* The water droplet, which turns into steam puffs. */}
            {toSteam < 1 ? (
              <g transform={`translate(200 330) scale(${1 - toSteam})`}>
                <path d="M 0 -62 Q 46 -6 40 18 Q 30 54 0 54 Q -30 54 -40 18 Q -46 -6 0 -62 Z" fill={WATER} stroke="#1F7FB8" strokeWidth={6} />
                <circle cx={-13} cy={10} r={6} fill={INK} />
                <circle cx={13} cy={10} r={6} fill={INK} />
                <path d="M -9 26 Q 0 34 9 26" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
              </g>
            ) : null}
            {STEAM.map((p, i) => {
              const a = Math.min(1.1, pop(t, p.at));
              if (a <= 0) return null;
              const speed = 1 + 2.5 * pressure;
              const reach = 1 + 0.25 * pressure;
              const x = 200 + 110 * reach * Math.sin(t * p.w1 * speed + p.p1);
              const y = 345 + 58 * reach * Math.sin(t * p.w2 * speed + p.p2);
              const r = (26 + 8 * pressure) * a;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r={r} fill="#FFFFFF" opacity={0.92} />
                  <circle cx={x - r * 0.32} cy={y - r * 0.1} r={r * 0.14} fill={INK} />
                  <circle cx={x + r * 0.32} cy={y - r * 0.1} r={r * 0.14} fill={INK} />
                </g>
              );
            })}
          </Kernel>
        </g>

        {/* Labels during the cutaway. */}
        {labels > 0 ? (
          <g opacity={Math.min(1, labels)} fontFamily="Inter, sans-serif" fontWeight={900}>
            <path d="M 150 1180 Q 300 1150 490 1050" fill="none" stroke={WATER} strokeWidth={7} strokeLinecap="round" />
            <text x={60} y={1215} fontSize={52} fill={WATER}>WATER</text>
            <path d="M 930 700 Q 860 700 790 760" fill="none" stroke={GOLD} strokeWidth={7} strokeLinecap="round" />
            <text x={1040} y={665} fontSize={46} fill={GOLD} textAnchor="end">TOUGH</text>
            <text x={1040} y={712} fontSize={46} fill={GOLD} textAnchor="end">SHELL</text>
          </g>
        ) : null}

        {/* Thermometer. */}
        {thermo > 0 ? (
          <g transform={`translate(965 ${1120 + (1 - Math.min(1, thermo)) * 80})`} opacity={Math.min(1, thermo)}>
            <rect x={-26} y={-440} width={52} height={440} rx={26} fill="#FFFFFF" />
            <rect x={-14} y={-428 + (1 - fillFrac) * 400} width={28} height={30 + fillFrac * 400} rx={14} fill={interpolateColors(fillFrac, [0, 1], [GOLD, RED])} />
            <circle cx={0} cy={18} r={44} fill="#FFFFFF" />
            <circle cx={0} cy={18} r={32} fill={interpolateColors(fillFrac, [0, 1], [GOLD, RED])} />
            <text
              x={-6}
              y={-470}
              textAnchor="end"
              fontSize={t >= 15.9 ? 64 + 8 * Math.abs(Math.sin(t * 8)) : 52}
              fontWeight={900}
              fontFamily="Inter, sans-serif"
              fill={t >= 15.9 ? RED : FLUFF}
              style={{ paintOrder: "stroke" }}
              stroke={DARK}
              strokeWidth={10}
            >
              {`${temp}°C`}
            </text>
          </g>
        ) : null}

        {/* Pressure gauge. */}
        {gauge > 0 ? (
          <g transform={`translate(135 820) scale(${Math.min(1.1, gauge)})`}>
            <circle r={105} fill="#FFFFFF" stroke="#3B3B4F" strokeWidth={10} />
            <path d="M -80 0 A 80 80 0 0 1 80 0" fill="none" stroke="#E6E6EE" strokeWidth={18} />
            <path d="M 40 -69 A 80 80 0 0 1 80 0" fill="none" stroke={RED} strokeWidth={18} />
            {Array.from({ length: 10 }, (_, i) => {
              const a = ((-180 + i * 20) * Math.PI) / 180;
              return (
                <line
                  key={i}
                  x1={Math.cos(a) * 62}
                  y1={Math.sin(a) * 62}
                  x2={Math.cos(a) * 72}
                  y2={Math.sin(a) * 72}
                  stroke={INK}
                  strokeWidth={4}
                />
              );
            })}
            <g transform={`rotate(${needle})`}>
              <path d="M -7 0 L 0 -78 L 7 0 Z" fill={RED} />
            </g>
            <circle r={12} fill={INK} />
            <text y={56} textAnchor="middle" fontSize={34} fontWeight={900} fontFamily="Inter, sans-serif" fill={INK}>
              {`${(1 + 8 * pressure).toFixed(0)}×`}
            </text>
          </g>
        ) : null}
      </svg>

      <Caption lines={lines} t={t} offsetS={0} />
      <StampLayer t={t} />
    </AbsoluteFill>
  );
};

// Shards of shell flying off at the pop.
const SHARDS = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2 + 0.3;
  return { vx: Math.cos(a) * (700 + random(`sv-${i}`) * 400), vy: Math.sin(a) * 700 - 500, spin: (random(`ss-${i}`) - 0.5) * 900 };
});

// Little popcorn pieces raining down as the rest of the pan pops.
const RAIN = Array.from({ length: 16 }, (_, i) => ({
  at: 21.4 + i * 0.55,
  x: 80 + random(`rx-${i}`) * 920,
  s: 0.16 + random(`rs-${i}`) * 0.1,
  spin: (random(`rr-${i}`) - 0.5) * 500,
}));

const PopStage: React.FC<{ lines: string[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const t = POP_S + frame / FPS;
  const dt = t - POP_S;

  const flash = 1 - ramp(t, POP_S, POP_S + 0.3);
  const rays = pop(t, POP_S) * (1 - ramp(t, 20.8, 21.4));
  const popText = pop(t, POP_S + 0.02) * (1 - ease(t, 21.0, 21.35));
  const shakeY = Math.sin(dt * 70) * 30 * Math.max(0, 1 - dt / 0.5);

  // Foam inflates, then the size comparison, then the flip.
  const inflate = ease(t, 23.4, 24.4);
  const compare = ease(t, 26.0, 26.6);
  const flipU = ramp(t, 28.4, 29.3);
  const jump = Math.sin(Math.PI * flipU) * 420;
  const spin = 360 * interpolate(flipU, [0, 1], [0, 1], { easing: Easing.inOut(Easing.quad) });
  const landing = t > 29.3 ? Math.sin(Math.min(1, (t - 29.3) / 0.3) * Math.PI) * 0.12 : 0;
  const crouch = t > 28.15 && t < 28.4 ? Math.sin(((t - 28.15) / 0.25) * Math.PI) * 0.1 : 0;

  const scale = (0.78 + 0.22 * inflate) * (1 - 0.18 * compare);
  const px = 540 + 110 * compare;
  const py = 900 + 70 * compare - jump;
  const small = pop(t, 26.2);

  return (
    <AbsoluteFill style={{ backgroundColor: DARK }}>
      <BackgroundPulse color={KERNEL} size={1300} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
        {/* Popcorn raining behind. */}
        {RAIN.map((r, i) => {
          const u = (t - r.at) / 2.4;
          if (u < 0 || u > 1) return null;
          const y = -120 + u * 2100;
          return (
            <g key={i} transform={`translate(${r.x} ${y}) rotate(${r.spin * u}) scale(${r.s})`} opacity={0.9}>
              <Popcorn t={t} appearFrom={r.at - 0.3} seed={`r${i}`} />
            </g>
          );
        })}

        {/* Burst rays. */}
        {rays > 0 ? (
          <g transform={`translate(540 900) rotate(${dt * 40}) scale(${Math.min(1.2, rays) * 1.4})`} opacity={Math.min(1, rays)}>
            {Array.from({ length: 14 }, (_, i) => (
              <path key={i} d="M -26 -120 L 0 -520 L 26 -120 Z" fill={i % 2 ? GOLD : KERNEL} transform={`rotate(${(i * 360) / 14})`} />
            ))}
          </g>
        ) : null}

        {/* The hero popcorn. */}
        <g
          transform={`translate(${px} ${py + shakeY}) rotate(${spin}) scale(${scale * (1 + landing + crouch)} ${scale * (1 - landing - crouch)})`}
        >
          <Popcorn t={t} appearFrom={POP_S + 0.02} face={t >= 26.2 && t < 28.4 ? "happy" : "joy"} wobble={1} seed="hero" />
        </g>

        {/* Shell shards. */}
        {dt < 2 ? (
          SHARDS.map((s, i) => {
            const x = 540 + s.vx * dt;
            const y = 900 + s.vy * dt + 1500 * dt * dt;
            return (
              <path
                key={i}
                d="M -30 -18 Q 0 -34 30 -18 L 18 16 Q 0 24 -18 16 Z"
                fill={KERNEL}
                stroke={KERNEL_EDGE}
                strokeWidth={5}
                transform={`translate(${x} ${y}) rotate(${s.spin * dt})`}
              />
            );
          })
        ) : null}

        {/* Size comparison: the tiny kernel it came from. */}
        {small > 0 ? (
          <g transform={`translate(205 1135) scale(${0.36 * Math.min(1.1, small)}) translate(-200 -240)`}>
            <Kernel id="small" t={t} expr="wow" blinkPhase={1.3} />
          </g>
        ) : null}
        {small > 0 ? (
          <text
            x={205}
            y={1290}
            textAnchor="middle"
            fontSize={56}
            fontWeight={900}
            fontFamily="Inter, sans-serif"
            fill={FLUFF}
            opacity={Math.min(1, small)}
          >
            1×
          </text>
        ) : null}
      </svg>

      {/* Big comic POP! */}
      {popText > 0 ? (
        <div
          style={{
            position: "absolute",
            top: 760,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 300,
            fontWeight: 900,
            color: GOLD,
            WebkitTextStroke: `14px ${DARK}`,
            paintOrder: "stroke fill",
            transform: `rotate(-8deg) scale(${Math.min(1.2, popText)})`,
            textShadow: `0 16px 0 ${RED}`,
          }}
        >
          POP!
        </div>
      ) : null}

      <AbsoluteFill style={{ backgroundColor: "#FFFFFF", opacity: flash }} />
      <Caption lines={lines} t={t} offsetS={POP_S} />
      <StampLayer t={t} />
    </AbsoluteFill>
  );
};

// Popcorn pile in the bowl: row by row, top first.
const PILE = Array.from({ length: 22 }, (_, i) => {
  const row = Math.floor(i / 6);
  const col = i % 6;
  return {
    x: 200 + col * 136 + (row % 2 ? 60 : 0) + (random(`px-${i}`) - 0.5) * 30,
    y: 1010 + row * 85 + (random(`py-${i}`) - 0.5) * 20,
    r: (random(`pr-${i}`) - 0.5) * 60,
    s: 0.2 + random(`ps-${i}`) * 0.04,
  };
}).filter((p) => p.x < 900);

const DUDS = [
  { x: 400, y: 1385, phase: 0.4 },
  { x: 540, y: 1395, phase: 1.1 },
  { x: 680, y: 1385, phase: 2.0 },
];

const DudScene: React.FC<{ lines: string[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const t = STARTS_S[2] + frame / FPS;

  const intro = pop(t, STARTS_S[2]);
  const k = ease(t, 31.7, 32.5);
  const z = 1 + 0.9 * k;
  const crack = ramp(t, 32.5, 33.0);
  const dry = ease(t, 34.4, 35.0);
  const arrow = pop(t, 30.8) * (1 - ramp(t, 31.6, 31.8));
  const leak = t >= 32.9;
  const deflate = 1 - 0.06 * ramp(t, 32.9, 35.3);

  return (
    <AbsoluteFill style={{ backgroundColor: DARK }}>
      <BackgroundPulse color={colors.accent} size={1200} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
        <g transform={`translate(540 ${1380 - 200 * k}) scale(${z * (0.85 + 0.15 * Math.min(1, intro))}) translate(-540 -1380)`}>
          {/* Bowl back, pile, duds at the bottom, bowl front rim. */}
          <path d="M 110 1000 Q 120 1480 540 1480 Q 960 1480 970 1000 Z" fill="#2A2050" />
          {PILE.map((p, i) => (
            <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.r}) scale(${p.s})`}>
              <Popcorn t={t} seed={`pile${i}`} />
            </g>
          ))}
          {DUDS.map((d, i) => {
            const isCracked = i === 1;
            const isDry = i === 0;
            const sc = 0.24 * (isCracked ? deflate : 1);
            return (
              <g key={i} transform={`translate(${d.x} ${d.y}) rotate(${Math.sin(t * 2 + d.phase) * 4}) scale(${sc}) translate(-200 -240)`}>
                <Kernel
                  id={`dud${i}`}
                  t={t}
                  expr="sad"
                  blinkPhase={d.phase}
                  crack={isCracked ? crack : 0}
                  dry={isDry ? dry : 0}
                />
              </g>
            );
          })}
          {/* Steam leaking out of the crack. */}
          {leak
            ? [0, 1, 2, 3].map((i) => {
                const u = ((t - 32.9) * 0.9 + i * 0.25) % 1;
                return (
                  <circle
                    key={i}
                    cx={566 + u * 70 + Math.sin(u * 9 + i) * 6}
                    cy={1368 - u * 40}
                    r={6 + u * 12}
                    fill="#FFFFFF"
                    stroke={TEAL}
                    strokeWidth={3}
                    opacity={0.9 * (1 - u)}
                  />
                );
              })
            : null}
          {leak && t < 35.6 ? (
            <text
              x={608}
              y={1420}
              fontSize={28}
              fontStyle="italic"
              fontWeight={800}
              fontFamily="Inter, sans-serif"
              fill={TEAL}
              stroke={DARK}
              strokeWidth={6}
              style={{ paintOrder: "stroke" }}
              opacity={0.75 + 0.25 * Math.sin(t * 12)}
            >
              pssss…
            </text>
          ) : null}
          {/* Dry kernel: a tiny droplet that shrivels away. */}
          {t >= 34.4 ? (
            <g transform={`translate(400 1295) scale(${0.5 * (1 - ease(t, 34.8, 35.6))})`}>
              <path d="M 0 -40 Q 30 -4 26 12 Q 20 34 0 34 Q -20 34 -26 12 Q -30 -4 0 -40 Z" fill={WATER} />
            </g>
          ) : null}
          <path d="M 96 1000 L 984 1000" stroke="#7C5CFF" strokeWidth={26} strokeLinecap="round" />
        </g>

        {/* Arrow pointing down at the duds before the zoom. */}
        {arrow > 0 ? (
          <g transform={`translate(540 ${1235 + Math.sin(t * 10) * 12})`} opacity={Math.min(1, arrow)}>
            <path d="M -26 -90 L 26 -90 L 26 -30 L 60 -30 L 0 30 L -60 -30 L -26 -30 Z" fill={GOLD} stroke={DARK} strokeWidth={6} />
          </g>
        ) : null}
      </svg>

      {/* Darken the top so the caption stays readable over the zoomed-in pile. */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(${DARK} 0px, ${DARK} 380px, rgba(11,11,20,0) 640px)`,
          opacity: 0.9 * k,
        }}
      />
      <Caption lines={lines} t={t} offsetS={STARTS_S[2]} />
      <StampLayer t={t} />
    </AbsoluteFill>
  );
};

export const PopcornPop: React.FC<PopcornPopProps> = ({ captionLines, buttonText, audioFile, channelName }) => {
  const bounds = [...STARTS, TOTAL_FRAMES];
  const dur = (i: number) => bounds[i + 1] - bounds[i];

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background, fontFamily: "Inter, sans-serif" }}>
      {audioFile ? <Audio src={staticFile(audioFile)} /> : null}

      <Sequence from={STARTS[0]} durationInFrames={dur(0)}>
        <KernelStage lines={captionLines} />
      </Sequence>
      <Sequence from={STARTS[1]} durationInFrames={dur(1)}>
        <PopStage lines={captionLines} />
      </Sequence>
      <Sequence from={STARTS[2]} durationInFrames={dur(2)}>
        <DudScene lines={captionLines} />
      </Sequence>
      <Sequence from={STARTS[3]} durationInFrames={dur(3)}>
        <EndCardScene text={buttonText} />
      </Sequence>

      <ChannelWatermark text={channelName} />
    </AbsoluteFill>
  );
};
