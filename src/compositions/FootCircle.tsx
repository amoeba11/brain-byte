import {
  AbsoluteFill,
  Audio,
  Composition,
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
import { ChannelWatermark } from "../components/ChannelWatermark";
import { EndCardScene } from "../components/EndCardScene";

export type FootCircleProps = {
  /** The two narrated instructions of the hook, in order. */
  hookLines: string[];
  tryText: string;
  /** "Did it flip?" line, then the comment prompt. */
  revealLines: string[];
  /** The four narrated sentences of the "why" beat, in order. */
  explainLines: string[];
  /** Name-drop line, then the "try your left hand" line. */
  nameLines: string[];
  buttonText: string;
  audioFile?: string;
  channelName?: string;
};

const defaultProps: FootCircleProps = {
  hookLines: ["Hook line 1", "Hook line 2"],
  tryText: "TRY IT!",
  revealLines: ["Reveal line", "Comment prompt"],
  explainLines: ["Line 1", "Line 2", "Line 3", "Line 4"],
  nameLines: ["Name line", "Left hand line"],
  buttonText: "Button line goes here",
};

const FPS = 30;

// Scene start times in seconds: hook, try-it countdown, flip reveal, why,
// name-drop + left hand, end card. Aligned to the `say` voiceover clips mixed
// into assets/audio/013-foot-circle-six.m4a.
const STARTS_S = [0, 5.85, 9.0, 13.6, 26.6, 31.4];
const STARTS = STARTS_S.map((s) => Math.round(s * FPS));
const TOTAL_FRAMES = Math.round(35.0 * FPS);

// When each narrated line starts, in seconds relative to its own scene.
const HOOK_CUES_S = [0.15, 3.25];
const REVEAL_CUES_S = [0, 2.9];
const WHY_CUES_S = [0, 3.45, 7.1, 10.05];
const NAME_CUES_S = [0, 1.8];

const DARK = "#0B0B14";
const RED = "#FF3B3B";
const TEAL = "#19E0F0";
const PINK = "#FF7AB6";
const GOLD = colors.accentAlt;
const FONT = "Inter, sans-serif";

// One full circle of the foot / one loop of the hand, in seconds.
const LAP_S = 1.6;
const OMEGA = (2 * Math.PI) / LAP_S;

// "Circle your foot, draw a 6" self-test: hook -> try-it countdown -> the foot
// flips -> why (one brain half, two opposite spins) -> name-drop + left hand ->
// end card.
export const FootCircleComposition = () => {
  return (
    <Composition
      id="FootCircle"
      component={FootCircle}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
    />
  );
};

const ramp = (v: number, from: number, to: number) =>
  interpolate(v, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// Bouncy 0 -> 1 pop that starts at second `at`.
const pop = (s: number, at: number) =>
  s < at
    ? 0
    : spring({
        frame: (s - at) * FPS,
        fps: FPS,
        config: { damping: 9, mass: 0.6, stiffness: 170 },
      });

type Pt = [number, number];

const cubic = (p: Pt[], u: number): Pt => {
  const v = 1 - u;
  const a = v * v * v;
  const b = 3 * v * v * u;
  const c = 3 * v * u * u;
  const d = u * u * u;
  return [
    a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0],
    a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1],
  ];
};

// A hand-drawn "6" in a 300x400 box, starting at the top and curling
// counterclockwise, as three cubic segments.
const SIX: Pt[][] = [
  [[215, 40], [120, 60], [70, 170], [75, 260]],
  [[75, 260], [80, 350], [215, 360], [225, 270]],
  [[225, 270], [232, 200], [110, 180], [78, 250]],
];
const SIX_SAMPLES = 72;
const sixPoint = (p: number): Pt => {
  const t = Math.min(0.9999, Math.max(0, p)) * SIX.length;
  const i = Math.floor(t);
  return cubic(SIX[i], t - i);
};
const sixPath = (p: number) => {
  const n = Math.max(1, Math.round(SIX_SAMPLES * p));
  let d = "";
  for (let k = 0; k <= n; k++) {
    const [x, y] = sixPoint(k / SIX_SAMPLES);
    d += `${k === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d;
};

// The hand draws the 6, holds it for a beat, then starts over.
const sixLoop = (s: number) => Math.min(1, ((s % LAP_S) + LAP_S) % LAP_S / (LAP_S * 0.8));

const Floaties: React.FC = () => {
  const frame = useCurrentFrame();
  const tints = [TEAL, GOLD, PINK, colors.accent];
  return (
    <AbsoluteFill>
      {Array.from({ length: 18 }).map((_, i) => {
        const size = 12 + random(`size${i}`) * 30;
        const speed = 2 + random(`speed${i}`) * 4;
        const y = 1960 - ((frame * speed + random(`y${i}`) * 2000) % 2000);
        const x = random(`x${i}`) * 1080 + Math.sin(frame / 25 + i) * 30;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: tints[i % tints.length],
              opacity: 0.22,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Stamp: React.FC<{
  text: string;
  appear: number;
  color: string;
  size?: number;
  rotate?: number;
}> = ({ text, appear, color, size = 84, rotate = -4 }) => {
  if (appear <= 0) return null;
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: 900,
        color,
        border: `8px solid ${color}`,
        borderRadius: 20,
        padding: "4px 28px",
        backgroundColor: "rgba(11,11,20,0.85)",
        transform: `rotate(${rotate}deg) scale(${0.3 + 0.7 * appear})`,
        opacity: Math.min(1, appear * 2),
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

const Chip: React.FC<{ text: string; color: string; appear: number }> = ({ text, color, appear }) => (
  <div
    style={{
      fontSize: 40,
      fontWeight: 900,
      letterSpacing: 2,
      color: DARK,
      backgroundColor: color,
      borderRadius: 999,
      padding: "6px 26px",
      whiteSpace: "nowrap",
      opacity: Math.min(1, appear * 2),
      transform: `scale(${0.4 + 0.6 * appear})`,
    }}
  >
    {text}
  </div>
);

type Mood = "happy" | "dizzy";

// Cartoon foot seen from above, with a face so it can react.
const FootGuy: React.FC<{ size: number; color: string; mood: Mood; look: number }> = ({
  size,
  color,
  mood,
  look,
}) => {
  const px = Math.cos(look) * 6;
  const py = Math.sin(look) * 6;
  const dizzy = mood === "dizzy";
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 200 260">
      <ellipse cx={100} cy={166} rx={64} ry={86} fill={color} />
      <circle cx={50} cy={64} r={25} fill={color} />
      <circle cx={90} cy={46} r={18} fill={color} />
      <circle cx={121} cy={50} r={16} fill={color} />
      <circle cx={146} cy={62} r={14} fill={color} />
      <circle cx={165} cy={82} r={12} fill={color} />
      <circle cx={76} cy={150} r={dizzy ? 22 : 18} fill="#fff" />
      <circle cx={124} cy={150} r={dizzy ? 22 : 18} fill="#fff" />
      <circle cx={76 + px} cy={150 + py} r={dizzy ? 5 : 9} fill={DARK} />
      <circle cx={124 + px} cy={150 + py} r={dizzy ? 5 : 9} fill={DARK} />
      {dizzy ? (
        <ellipse cx={100} cy={204} rx={13} ry={16} fill={DARK} />
      ) : (
        <path d="M76 194 Q100 220 124 194" stroke={DARK} strokeWidth={8} strokeLinecap="round" fill="none" />
      )}
    </svg>
  );
};

// The foot running laps around a dashed ring. `dir` is +1 clockwise, -1
// counterclockwise; `angle` is where the foot is on the ring, in radians.
const FootOrbit: React.FC<{
  cx: number;
  cy: number;
  r: number;
  angle: number;
  dir: 1 | -1;
  color: string;
  mood?: Mood;
  appear?: number;
  footSize?: number;
  children?: React.ReactNode;
}> = ({ cx, cy, r, angle, dir, color, mood = "happy", appear = 1, footSize = 170, children }) => {
  if (appear <= 0) return null;
  const box = r * 2 + 80;
  const half = box / 2;
  const deg = (angle * 180) / Math.PI;
  const circ = 2 * Math.PI * r;
  const fx = half + Math.cos(angle) * r;
  const fy = half + Math.sin(angle) * r;
  return (
    <div
      style={{
        position: "absolute",
        left: cx - half,
        top: cy - half,
        width: box,
        height: box,
        transform: `scale(${0.3 + 0.7 * appear})`,
        opacity: Math.min(1, appear * 2),
      }}
    >
      <svg width={box} height={box} style={{ position: "absolute", overflow: "visible" }}>
        <circle
          cx={half}
          cy={half}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth={8}
          strokeDasharray="6 22"
          strokeLinecap="round"
        />
        <circle
          cx={half}
          cy={half}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={16}
          strokeLinecap="round"
          strokeDasharray={`${circ * 0.3} ${circ}`}
          opacity={0.75}
          transform={`rotate(${dir === 1 ? deg - 108 : deg} ${half} ${half})`}
        />
        {[150, 270].map((off) => (
          <g key={off} transform={`rotate(${deg + off * dir} ${half} ${half}) translate(${half + r} ${half})`}>
            <polygon
              points="-20,-14 0,18 20,-14 0,-4"
              fill={color}
              transform={dir === 1 ? undefined : "scale(1,-1)"}
            />
          </g>
        ))}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          left: fx - footSize / 2,
          top: fy - (footSize * 1.3) / 2,
          transform: `rotate(${Math.sin(angle * 2) * 10}deg) scale(${1 + Math.sin(angle * 4) * 0.05})`,
        }}
      >
        <FootGuy size={footSize} color={color} mood={mood} look={angle + (dir * Math.PI) / 2} />
      </div>
    </div>
  );
};

// The hand (a glowing pen dot) drawing a 6.
const SixDraw: React.FC<{
  cx: number;
  cy: number;
  scale: number;
  progress: number;
  color: string;
  appear?: number;
}> = ({ cx, cy, scale, progress, color, appear = 1 }) => {
  if (appear <= 0) return null;
  const [x, y] = sixPoint(progress);
  return (
    <div
      style={{
        position: "absolute",
        left: cx - 150,
        top: cy - 200,
        width: 300,
        height: 400,
        transform: `scale(${scale * (0.3 + 0.7 * appear)})`,
        opacity: Math.min(1, appear * 2),
      }}
    >
      <svg width={300} height={400} viewBox="0 0 300 400" style={{ overflow: "visible" }}>
        <path d={sixPath(1)} stroke="rgba(255,255,255,0.14)" strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d={sixPath(progress)} stroke={color} strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx={x} cy={y} r={36} fill={color} opacity={0.35} />
        <circle cx={x} cy={y} r={20} fill="#fff" />
      </svg>
    </div>
  );
};

// Cartoon brain seen from above: two halves that can light up separately.
const Brain: React.FC<{
  cx: number;
  cy: number;
  left: string;
  right: string;
  stress: number;
  appear: number;
  frame: number;
  scale?: number;
}> = ({ cx, cy, left, right, stress, appear, frame, scale = 1 }) => {
  if (appear <= 0) return null;
  const shake = Math.sin(frame * 2.1) * 10 * stress;
  const fold = "rgba(11,11,20,0.28)";
  return (
    <div
      style={{
        position: "absolute",
        left: cx - 210,
        top: cy - 150,
        width: 420,
        height: 300,
        transform: `translateX(${shake}px) scale(${scale * (0.3 + 0.7 * appear) * (1 + Math.sin(frame / 6) * 0.02)})`,
        opacity: Math.min(1, appear * 2),
      }}
    >
      <svg width={420} height={300} viewBox="0 0 420 300" style={{ overflow: "visible" }}>
        <path d="M202 30 C120 0 30 50 40 150 C30 240 130 290 202 265 Z" fill={left} />
        <path d="M218 30 C300 0 390 50 380 150 C390 240 290 290 218 265 Z" fill={right} />
        <path d="M80 110 Q120 80 150 115 M70 200 Q110 235 150 205 M120 60 Q150 70 165 50" stroke={fold} strokeWidth={9} strokeLinecap="round" fill="none" />
        <path d="M340 110 Q300 80 270 115 M350 200 Q310 235 270 205 M300 60 Q270 70 255 50" stroke={fold} strokeWidth={9} strokeLinecap="round" fill="none" />
        <circle cx={150} cy={150} r={24} fill="#fff" />
        <circle cx={270} cy={150} r={24} fill="#fff" />
        <circle cx={150 + shake * 0.5} cy={152} r={stress > 0.5 ? 7 : 11} fill={DARK} />
        <circle cx={270 + shake * 0.5} cy={152} r={stress > 0.5 ? 7 : 11} fill={DARK} />
        {stress > 0.5 ? (
          <>
            <path d="M120 112 L178 128 M300 112 L242 128" stroke={DARK} strokeWidth={9} strokeLinecap="round" />
            <path d="M175 222 Q192 204 210 222 Q228 240 245 222" stroke={DARK} strokeWidth={9} strokeLinecap="round" fill="none" />
            {[0, 1, 2].map((i) => {
              const fall = ((frame * 5 + i * 30) % 90) / 90;
              return (
                <ellipse
                  key={i}
                  cx={i === 1 ? 400 : 20 + i * 5}
                  cy={50 + i * 25 + fall * 80}
                  rx={9}
                  ry={14}
                  fill={TEAL}
                  opacity={1 - fall}
                />
              );
            })}
          </>
        ) : (
          <path d="M180 212 Q210 240 240 212" stroke={DARK} strokeWidth={9} strokeLinecap="round" fill="none" />
        )}
      </svg>
    </div>
  );
};

// A nerve from the brain down to a limb, with a signal dot running along it.
const Wire: React.FC<{ from: Pt; to: Pt; color: string; draw: number; frame: number; offset?: number }> = ({
  from,
  to,
  color,
  draw,
  frame,
  offset = 0,
}) => {
  if (draw <= 0) return null;
  const pts: Pt[] = [from, [from[0], from[1] + 150], [to[0], to[1] - 150], to];
  const u = ((frame + offset) % 24) / 24;
  const [x, y] = cubic(pts, u);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <path
        d={`M${pts[0][0]} ${pts[0][1]} C${pts[1][0]} ${pts[1][1]} ${pts[2][0]} ${pts[2][1]} ${pts[3][0]} ${pts[3][1]}`}
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
        fill="none"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
        opacity={0.55}
      />
      {draw >= 1 ? <circle cx={x} cy={y} r={18} fill={color} /> : null}
    </svg>
  );
};

const Caption: React.FC<{ lines: string[]; cuesS: number[]; bottom?: number }> = ({ lines, cuesS, bottom = 230 }) => {
  const frame = useCurrentFrame();
  const cues = cuesS.map((c) => Math.round(c * FPS));
  if (frame < cues[0]) return null;
  let current = 0;
  cues.forEach((c, i) => {
    if (frame >= c) current = i;
  });
  return (
    <div style={{ position: "absolute", bottom, left: 0, right: 0, padding: "0 80px" }}>
      <TextReveal key={current} fontSize={60} delay={cues[current]} stagger style={{ color: colors.foreground }}>
        {lines[current] ?? ""}
      </TextReveal>
    </div>
  );
};

const Label: React.FC<{ x: number; y: number; children: React.ReactNode }> = ({ x, y, children }) => (
  <div style={{ position: "absolute", left: x - 300, width: 600, top: y, display: "flex", justifyContent: "center" }}>
    {children}
  </div>
);

// Hook + try-it share one layout: the 6 on top, the circling foot below.
const HookScene: React.FC<{ lines: string[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const s = frame / FPS;
  const handIn = pop(s, HOOK_CUES_S[1]);
  const slide = ramp(s, HOOK_CUES_S[1] - 0.15, HOOK_CUES_S[1] + 0.2);
  const footY = interpolate(slide, [0, 1], [900, 1170]);
  return (
    <AbsoluteFill>
      <BackgroundPulse color={colors.accent} size={1000} />
      <SixDraw cx={540} cy={500} scale={0.95} progress={sixLoop(s - HOOK_CUES_S[1])} color={GOLD} appear={handIn} />
      <Label x={540} y={720}>
        <Chip text="RIGHT HAND" color={GOLD} appear={handIn} />
      </Label>
      <FootOrbit cx={540} cy={footY} r={210} angle={OMEGA * s - Math.PI / 2} dir={1} color={TEAL} appear={pop(s, 0.1)}>
        <Chip text="RIGHT FOOT" color={TEAL} appear={pop(s, 0.5)} />
      </FootOrbit>
      <Caption lines={lines} cuesS={HOOK_CUES_S} />
    </AbsoluteFill>
  );
};

const TryScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const s = frame / FPS;
  const t = STARTS_S[1] + s;
  const left = Math.max(1, 3 - Math.floor(s));
  const tick = pop(s, Math.min(2, Math.floor(s)));
  return (
    <AbsoluteFill>
      <BackgroundPulse color={colors.accent} size={1000} />
      <SixDraw cx={540} cy={500} scale={0.95} progress={sixLoop(t - HOOK_CUES_S[1])} color={GOLD} />
      <Label x={540} y={720}>
        <Chip text="RIGHT HAND" color={GOLD} appear={1} />
      </Label>
      <FootOrbit cx={540} cy={1170} r={210} angle={OMEGA * t - Math.PI / 2} dir={1} color={TEAL}>
        <div style={{ fontSize: 210, fontWeight: 900, color: colors.foreground, transform: `scale(${0.5 + 0.5 * tick})` }}>
          {left}
        </div>
      </FootOrbit>
      <div style={{ position: "absolute", bottom: 250, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Stamp text={text} appear={pop(s, 0.05)} color={GOLD} size={110} rotate={-3 + Math.sin(frame / 4) * 2} />
      </div>
    </AbsoluteFill>
  );
};

// The foot stalls, wobbles, and starts circling the wrong way.
const RevealScene: React.FC<{ lines: string[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const s = frame / FPS;
  const stall = 0.3;
  const a0 = OMEGA * STARTS_S[2] - Math.PI / 2;
  const angle = s < stall ? a0 + Math.sin(s * 60) * 0.15 : a0 - OMEGA * (s - stall);
  const flipped = s >= stall;
  const shake = Math.sin(frame * 2.4) * 16 * (1 - ramp(s, stall, stall + 0.6)) * (flipped ? 1 : 0.4);
  const burst = ramp(s, stall, stall + 0.9);
  return (
    <AbsoluteFill style={{ transform: `translateX(${shake}px)` }}>
      <BackgroundPulse color={flipped ? RED : colors.accent} size={1100} />
      <div style={{ position: "absolute", top: 210, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Stamp text="IT FLIPPED!" appear={pop(s, stall)} color={RED} size={112} rotate={-4} />
      </div>
      <FootOrbit
        cx={540}
        cy={900}
        r={250}
        angle={angle}
        dir={flipped ? -1 : 1}
        color={flipped ? RED : TEAL}
        mood={flipped ? "dizzy" : "happy"}
        footSize={200}
      >
        <div style={{ fontSize: 230, fontWeight: 900, color: GOLD, transform: `scale(${pop(s, stall)}) rotate(${Math.sin(frame / 5) * 8}deg)` }}>
          ?!
        </div>
      </FootOrbit>
      {flipped
        ? Array.from({ length: 10 }).map((_, i) => {
            const a = (i / 10) * Math.PI * 2 + 0.3;
            const d = 280 + burst * 330;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 540 + Math.cos(a) * d - 30,
                  top: 900 + Math.sin(a) * d - 50,
                  fontSize: 90,
                  fontWeight: 900,
                  color: i % 2 ? GOLD : TEAL,
                  opacity: 1 - burst,
                  transform: `rotate(${burst * 180 * (i % 2 ? 1 : -1)}deg)`,
                }}
              >
                ?
              </div>
            );
          })
        : null}
      <Caption lines={lines} cuesS={REVEAL_CUES_S} bottom={300} />
    </AbsoluteFill>
  );
};

// Why: the 6 runs counterclockwise, one brain half drives both right limbs, and
// it can't send two opposite spins at once, so the hand wins.
const WhyScene: React.FC<{ lines: string[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const s = frame / FPS;
  const [, brainAt, clashAt, winAt] = WHY_CUES_S;

  const move = ramp(s, brainAt - 0.35, brainAt + 0.05);
  const sixX = interpolate(move, [0, 1], [540, 280]);
  const sixY = interpolate(move, [0, 1], [760, 1120]);
  const sixScale = interpolate(move, [0, 1], [1.5, 0.8]);

  const won = s >= winAt;
  const stress = s >= clashAt && !won ? 1 : 0;
  const footAngle = won ? OMEGA * winAt - OMEGA * (s - winAt) : OMEGA * s;
  const glow = 0.75 + Math.sin(frame / 3) * 0.25;
  const lit = ramp(s, brainAt + 1.7, brainAt + 2.0);
  const leftHalf = lit > 0 ? GOLD : PINK;
  const wires = ramp(s, brainAt + 0.5, brainAt + 1.3);

  return (
    <AbsoluteFill style={{ transform: `translateX(${Math.sin(frame * 2.2) * 6 * stress}px)` }}>
      <BackgroundPulse color={stress ? RED : colors.accent} size={1000} />

      <Wire from={[455, 600]} to={[280, 930]} color={GOLD} draw={wires} frame={frame} />
      <Wire from={[500, 610]} to={[790, 900]} color={won ? GOLD : TEAL} draw={wires} frame={frame} offset={12} />
      <Brain
        cx={540}
        cy={460}
        left={leftHalf}
        right={PINK}
        stress={stress}
        appear={pop(s, brainAt)}
        frame={frame}
        scale={1 + lit * (glow - 0.75) * 0.12}
      />
      <Label x={380} y={240}>
        <Chip text="SAME HALF" color={GOLD} appear={pop(s, brainAt + 1.8) * (stress ? 0 : 1)} />
      </Label>

      {s < brainAt - 0.35 ? (
        <>
          <svg width={1080} height={1920} style={{ position: "absolute" }}>
            <path
              d="M 800 560 A 330 330 0 1 0 800 960"
              stroke={TEAL}
              strokeWidth={14}
              strokeLinecap="round"
              fill="none"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - ramp(s, 1.3, 2.3)}
            />
            <polygon points="770,930 830,990 838,912" fill={TEAL} opacity={ramp(s, 2.2, 2.35)} />
          </svg>
          <Label x={540} y={1180}>
            <Chip text="COUNTERCLOCKWISE" color={TEAL} appear={pop(s, 1.5)} />
          </Label>
        </>
      ) : null}

      <SixDraw cx={sixX} cy={sixY} scale={sixScale} progress={sixLoop(s - 0.3)} color={GOLD} appear={pop(s, 0.05)} />
      <FootOrbit
        cx={790}
        cy={1120}
        r={150}
        angle={footAngle}
        dir={won ? -1 : 1}
        color={won ? GOLD : TEAL}
        mood={stress ? "dizzy" : "happy"}
        footSize={125}
        appear={pop(s, brainAt + 0.15)}
      />

      {stress ? (
        <>
          <Label x={280} y={1340}>
            <Chip text="SPIN LEFT" color={GOLD} appear={pop(s, clashAt)} />
          </Label>
          <Label x={790} y={1340}>
            <Chip text="SPIN RIGHT" color={TEAL} appear={pop(s, clashAt + 0.15)} />
          </Label>
          <Label x={540} y={1070}>
            <div style={{ fontSize: 90, fontWeight: 900, color: RED, transform: `scale(${pop(s, clashAt + 0.3) * (1 + Math.sin(frame / 2) * 0.08)})` }}>
              VS
            </div>
          </Label>
        </>
      ) : null}
      {won ? (
        <Label x={540} y={1330}>
          <Stamp text="HAND WINS" appear={pop(s, winAt + 0.1)} color={GOLD} size={96} rotate={-3} />
        </Label>
      ) : null}

      <Caption lines={lines} cuesS={WHY_CUES_S} />
    </AbsoluteFill>
  );
};

// Name-drop (hand and foot chained together), then the left-hand fix: each
// brain half gets its own limb and both spin happily.
const NameScene: React.FC<{ lines: string[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const s = frame / FPS;
  const leftAt = NAME_CUES_S[1];
  const freed = s >= leftAt;
  const footAngle = freed ? -OMEGA * leftAt + OMEGA * (s - leftAt) : -OMEGA * s;
  const brainIn = pop(s, leftAt);
  const wires = ramp(s, leftAt + 0.3, leftAt + 0.9);
  const y = interpolate(ramp(s, leftAt - 0.1, leftAt + 0.25), [0, 1], [960, 1150]);
  return (
    <AbsoluteFill>
      <BackgroundPulse color={colors.accent} size={1000} />
      <div style={{ position: "absolute", top: 200, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: freed ? 0 : 1 }}>
        <Stamp text="LIMB COUPLING" appear={pop(s, 0.1)} color={TEAL} size={92} rotate={-3} />
      </div>

      {/* Nerves cross over: the right half drives the left hand, the left half the right foot. */}
      <Wire from={[630, 590]} to={[280, y - 190]} color={GOLD} draw={wires} frame={frame} />
      <Wire from={[450, 590]} to={[790, y - 220]} color={TEAL} draw={wires} frame={frame} offset={12} />
      <Brain cx={540} cy={450} left={TEAL} right={GOLD} stress={0} appear={brainIn} frame={frame} />

      {!freed ? (
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          <line
            x1={400}
            y1={y}
            x2={640}
            y2={y}
            stroke={GOLD}
            strokeWidth={16}
            strokeLinecap="round"
            strokeDasharray="34 26"
            strokeDashoffset={-frame * 4}
            opacity={pop(s, 0.3)}
          />
        </svg>
      ) : null}
      <SixDraw cx={280} cy={y} scale={0.8} progress={sixLoop(s)} color={GOLD} appear={pop(s, 0.05)} />
      <Label x={280} y={y + 200}>
        <Chip text={freed ? "LEFT HAND" : "RIGHT HAND"} color={GOLD} appear={pop(s, freed ? leftAt : 0.2)} />
      </Label>
      <FootOrbit
        cx={790}
        cy={y}
        r={150}
        angle={footAngle}
        dir={freed ? 1 : -1}
        color={freed ? TEAL : GOLD}
        footSize={125}
        appear={pop(s, 0.1)}
      />
      <Label x={790} y={y + 250}>
        <Chip text="RIGHT FOOT" color={freed ? TEAL : GOLD} appear={pop(s, freed ? leftAt : 0.3)} />
      </Label>

      <Caption lines={lines} cuesS={NAME_CUES_S} />
    </AbsoluteFill>
  );
};

export const FootCircle: React.FC<FootCircleProps> = ({
  hookLines,
  tryText,
  revealLines,
  explainLines,
  nameLines,
  buttonText,
  audioFile,
  channelName,
}) => {
  const bounds = [...STARTS, TOTAL_FRAMES];
  const dur = (i: number) => bounds[i + 1] - bounds[i];

  return (
    <AbsoluteFill style={{ backgroundColor: DARK, fontFamily: FONT }}>
      {audioFile ? <Audio src={staticFile(audioFile)} /> : null}
      <Floaties />

      <Sequence from={STARTS[0]} durationInFrames={dur(0)}>
        <HookScene lines={hookLines} />
      </Sequence>
      <Sequence from={STARTS[1]} durationInFrames={dur(1)}>
        <TryScene text={tryText} />
      </Sequence>
      <Sequence from={STARTS[2]} durationInFrames={dur(2)}>
        <RevealScene lines={revealLines} />
      </Sequence>
      <Sequence from={STARTS[3]} durationInFrames={dur(3)}>
        <WhyScene lines={explainLines} />
      </Sequence>
      <Sequence from={STARTS[4]} durationInFrames={dur(4)}>
        <NameScene lines={nameLines} />
      </Sequence>
      <Sequence from={STARTS[5]} durationInFrames={dur(5)}>
        <EndCardScene text={buttonText} />
      </Sequence>

      <ChannelWatermark text={channelName} />
    </AbsoluteFill>
  );
};
