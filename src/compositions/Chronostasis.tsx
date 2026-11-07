import {
  AbsoluteFill,
  Audio,
  Composition,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { colors } from "../themes/colors";
import { TextReveal } from "../components/TextReveal";
import { BackgroundPulse } from "../components/BackgroundPulse";
import { ChannelWatermark } from "../components/ChannelWatermark";
import { EndCardScene } from "../components/EndCardScene";

export type ChronostasisProps = {
  hookText: string;
  setupText: string;
  snapText: string;
  commentText: string;
  jumpText: string;
  rewindText: string;
  buttonText: string;
  audioFile?: string;
  channelName?: string;
};

const defaultProps: ChronostasisProps = {
  hookText: "Hook text goes here",
  setupText: "Setup beat text goes here",
  snapText: "Snap beat text goes here",
  commentText: "Comment prompt goes here",
  jumpText: "Jump beat text goes here",
  rewindText: "Rewind beat text goes here",
  buttonText: "Button line goes here",
};

// Scene start times in seconds: hook, setup, snap, jump, rewind, button (the
// button scene doubles as the end card). Aligned to the `say` voiceover clips
// (assets/audio/010-chronostasis.m4a).
const FPS = 30;
const STARTS = [0, 4.4, 10.8, 18.6, 26.1, 33.9].map((s) => Math.round(s * FPS));
const TOTAL_FRAMES = 41 * FPS;

// Where "Comment frozen." lands inside the snap scene (frames).
const COMMENT_AT = 195;

const ROW = 1000;
const DOT_X = 150;
const DOT_R = 44;

const DARK = "#0B0B14";
const DOT_RED = "#FF3B3B";
const TEAL = "#19E0F0";
const GOLD = colors.accentAlt;

// "The clock that freezes" self-test: hook clock -> stare at the dot with the
// clock in peripheral vision -> snap eyes to the clock -> saccade explainer
// (eyes jump, vision off) -> backdating timeline -> shared end card.
export const ChronostasisComposition = () => {
  return (
    <Composition
      id="Chronostasis"
      component={Chronostasis}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
    />
  );
};

const ramp = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const Stamp: React.FC<{
  text: string;
  appear: number;
  color: string;
  size?: number;
  rotate?: number;
}> = ({ text, appear, color, size = 74, rotate = -8 }) => {
  if (appear <= 0) return null;
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: 900,
        color,
        border: `8px solid ${color}`,
        borderRadius: 18,
        padding: "4px 26px",
        transform: `rotate(${rotate}deg) scale(${1.6 - 0.6 * appear})`,
        opacity: appear,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

// Second-hand angle in degrees: steps once per second with a quick snap and a
// tiny overshoot, like a real ticking clock. Clock time is the scene frame
// plus `offset` so ticks stay on a steady 1s beat across scenes.
const handAngle = (frame: number, hold?: { at: number; frames: number }) => {
  let f = frame;
  if (hold && frame > hold.at + 30) f = frame - hold.frames;
  else if (hold && frame > hold.at) f = hold.at;
  const sec = Math.floor(f / FPS);
  const into = f - sec * FPS;
  const snap = interpolate(into, [0, 3, 5], [-5, 1.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return sec * 6 + snap;
};

const Clock: React.FC<{
  cx: number;
  cy: number;
  r: number;
  angle: number;
  glow?: number;
}> = ({ cx, cy, r, angle, glow = 0 }) => {
  const marks = Array.from({ length: 12 }, (_, i) => i);
  const rad = ((angle - 90) * Math.PI) / 180;
  return (
    <g>
      {glow > 0 ? (
        <circle cx={cx} cy={cy} r={r + 22} fill="none" stroke={GOLD} strokeWidth={10} opacity={glow} />
      ) : null}
      <circle cx={cx} cy={cy} r={r} fill="#F5F5F7" stroke="#fff" strokeWidth={r * 0.05} />
      {marks.map((i) => {
        const a = (i * 30 * Math.PI) / 180;
        const long = i % 3 === 0;
        return (
          <line
            key={i}
            x1={cx + Math.sin(a) * r * (long ? 0.8 : 0.88)}
            y1={cy - Math.cos(a) * r * (long ? 0.8 : 0.88)}
            x2={cx + Math.sin(a) * r * 0.95}
            y2={cy - Math.cos(a) * r * 0.95}
            stroke="#16162A"
            strokeWidth={long ? r * 0.045 : r * 0.025}
            strokeLinecap="round"
          />
        );
      })}
      <line x1={cx} y1={cy} x2={cx + r * 0.45} y2={cy - r * 0.35} stroke="#16162A" strokeWidth={r * 0.06} strokeLinecap="round" />
      <line
        x1={cx - Math.cos(rad) * r * 0.15}
        y1={cy - Math.sin(rad) * r * 0.15}
        x2={cx + Math.cos(rad) * r * 0.88}
        y2={cy + Math.sin(rad) * r * 0.88}
        stroke={DOT_RED}
        strokeWidth={r * 0.035}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={r * 0.06} fill={DOT_RED} />
    </g>
  );
};

const HookScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  // One tick (at 2s) gets held to show the "freeze" the video is about.
  const hold = { at: 60, frames: 21 };
  const freeze = ramp(frame, 62, 70) * (1 - ramp(frame, 80, 84));
  return (
    <AbsoluteFill style={{ backgroundColor: DARK, alignItems: "center" }}>
      <BackgroundPulse color={colors.accent} size={900} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <Clock cx={540} cy={900} r={330} angle={handAngle(frame, hold)} glow={freeze} />
      </svg>
      <div style={{ position: "absolute", top: 1330 }}>
        <Stamp text="WHY IS IT STUCK?" appear={ramp(frame, 66, 78)} color={GOLD} size={64} rotate={-3} />
      </div>
      <div style={{ position: "absolute", top: 160, padding: "0 80px" }}>
        <TextReveal fontSize={60} delay={4} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

const SetupScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const pulse = (frame % 45) / 45;
  return (
    <AbsoluteFill style={{ backgroundColor: DARK, alignItems: "center" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <circle
          cx={DOT_X}
          cy={ROW}
          r={DOT_R + 20 + 40 * pulse}
          fill="none"
          stroke="#fff"
          strokeWidth={6}
          opacity={0.6 * (1 - pulse)}
        />
        <circle cx={DOT_X} cy={ROW} r={DOT_R} fill={DOT_RED} />
        <Clock cx={840} cy={ROW} r={120} angle={handAngle(frame + 10)} />
      </svg>
      <div style={{ position: "absolute", top: 220 }}>
        <Stamp text="EYES ON THE DOT" appear={ramp(frame, 6, 18)} color="#fff" size={72} rotate={-2} />
      </div>
      <div style={{ position: "absolute", top: ROW + 190, left: 640, opacity: ramp(frame, 50, 62) }}>
        <Stamp text="DON'T LOOK YET" appear={ramp(frame, 50, 62)} color={GOLD} size={44} rotate={3} />
      </div>
      <div style={{ position: "absolute", bottom: 240, padding: "0 90px" }}>
        <TextReveal fontSize={54} delay={10} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

const SnapScene: React.FC<{ text: string; comment: string }> = ({ text, comment }) => {
  const frame = useCurrentFrame();
  // "Now!" lands ~3 frames in: flash, dot fades, clock jumps to the centre.
  const jump = ramp(frame, 4, 9);
  const flash = ramp(frame, 3, 5) * (1 - ramp(frame, 5, 14));
  const cx = 840 + (540 - 840) * jump;
  const r = 120 + (300 - 120) * jump;
  const cy = ROW + (900 - ROW) * jump;
  return (
    <AbsoluteFill style={{ backgroundColor: DARK, alignItems: "center" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <circle cx={DOT_X} cy={ROW} r={DOT_R} fill={DOT_RED} opacity={1 - jump} />
        {jump < 1 ? (
          <line x1={DOT_X + 70} y1={ROW} x2={cx - r - 20} y2={cy} stroke={GOLD} strokeWidth={10} strokeDasharray="22 16" opacity={jump} />
        ) : null}
        <Clock cx={cx} cy={cy} r={r} angle={handAngle(frame + 3)} />
      </svg>
      <div style={{ position: "absolute", top: 200 }}>
        <Stamp text="NOW! LOOK!" appear={ramp(frame, 3, 12)} color={GOLD} size={96} rotate={-3} />
      </div>
      <div style={{ position: "absolute", top: 1330, padding: "0 90px" }}>
        <TextReveal fontSize={54} delay={90} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
      <div style={{ position: "absolute", bottom: 330 }}>
        <Stamp text={comment} appear={ramp(frame, COMMENT_AT, COMMENT_AT + 10)} color={TEAL} size={60} rotate={2} />
      </div>
      <AbsoluteFill style={{ backgroundColor: "#fff", opacity: 0.7 * flash }} />
    </AbsoluteFill>
  );
};

// Eyes jump from the dot to the clock; vision is cut mid-jump.
const JumpScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const FROM = 190;
  const TO = 890;
  const Y = 560;
  const go = ramp(frame, 70, 82); // the jump itself is fast
  const eyeX = FROM + (TO - FROM) * go;
  const jumping = go > 0 && go < 1;
  const BAR_X = 140;
  const BAR_W = 800;
  const cut0 = BAR_X + BAR_W * 0.38;
  const cut1 = BAR_X + BAR_W * 0.5;
  const scan = BAR_X + BAR_W * ramp(frame, 40, 160);
  return (
    <AbsoluteFill style={{ backgroundColor: DARK, alignItems: "center" }}>
      <BackgroundPulse color={colors.accent} size={900} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <circle cx={FROM} cy={Y} r={34} fill={DOT_RED} />
        <Clock cx={TO} cy={Y} r={90} angle={handAngle(frame + 3)} />
        <line
          x1={FROM + 50}
          y1={Y}
          x2={FROM + 50 + (TO - FROM - 190) * go}
          y2={Y}
          stroke={GOLD}
          strokeWidth={10}
          strokeDasharray="22 16"
        />
        <g transform={`translate(${eyeX}, ${Y - 190})`} opacity={ramp(frame, 20, 30)}>
          <path d="M -70 0 Q 0 -60 70 0 Q 0 60 -70 0 Z" fill="#fff" />
          <circle cx={0} cy={0} r={24} fill="#2F3BFF" />
          <circle cx={0} cy={0} r={11} fill="#000" />
        </g>
        <text x={540} y={1010} textAnchor="middle" fontSize={44} fontWeight={900} fill={colors.muted} opacity={ramp(frame, 90, 100)}>
          WHAT YOU SEE
        </text>
        <g opacity={ramp(frame, 90, 100)}>
          <rect x={BAR_X} y={1040} width={BAR_W} height={60} fill={TEAL} opacity={0.25} />
          <rect x={BAR_X} y={1040} width={Math.max(0, Math.min(scan, cut0) - BAR_X)} height={60} fill={TEAL} />
          <rect x={cut0} y={1034} width={cut1 - cut0} height={72} fill="none" stroke={DOT_RED} strokeWidth={5} strokeDasharray="10 8" />
          <rect x={cut1} y={1040} width={Math.max(0, scan - cut1)} height={60} fill={TEAL} />
        </g>
      </svg>
      <div style={{ position: "absolute", top: 220 }}>
        <Stamp text="EYES JUMP" appear={ramp(frame, 14, 26)} color="#fff" size={84} rotate={-3} />
      </div>
      <div style={{ position: "absolute", top: 1170 }}>
        <Stamp text="VISION OFF" appear={jumping || frame > 82 ? ramp(frame, 74, 86) : 0} color={DOT_RED} size={64} rotate={2} />
      </div>
      <div style={{ position: "absolute", bottom: 240, padding: "0 90px" }}>
        <TextReveal fontSize={46} delay={100} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

const TL_X = 140;
const GAP_W = 130;
const TICK_W = 135;

// Two timelines: what actually happened (jump gap, then even ticks) vs what
// you feel (first tick stretched back over the gap).
const RewindScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const stretch = ramp(frame, 120, 150);
  const first = TL_X + GAP_W;
  const ticks = [0, 1, 2, 3, 4];
  const tickX = (i: number) => first + i * TICK_W;
  return (
    <AbsoluteFill style={{ backgroundColor: DARK, alignItems: "center" }}>
      <BackgroundPulse color={colors.accent} size={900} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <text x={TL_X} y={500} fontSize={44} fontWeight={900} fill={colors.muted} opacity={ramp(frame, 8, 20)}>
          WHAT HAPPENED
        </text>
        <g opacity={ramp(frame, 8, 20)}>
          <rect x={TL_X} y={530} width={GAP_W} height={70} fill="none" stroke={DOT_RED} strokeWidth={5} strokeDasharray="10 8" />
          <text x={TL_X + GAP_W / 2} y={575} textAnchor="middle" fontSize={30} fontWeight={900} fill={DOT_RED}>
            GAP
          </text>
          {ticks.map((i) => (
            <rect key={i} x={tickX(i) + 4} y={530} width={TICK_W - 8} height={70} fill={i === 0 ? GOLD : TEAL} />
          ))}
        </g>
        <text x={TL_X} y={800} fontSize={44} fontWeight={900} fill={colors.muted} opacity={ramp(frame, 90, 102)}>
          WHAT YOU FEEL
        </text>
        <g opacity={ramp(frame, 90, 102)}>
          <rect
            x={first - GAP_W * stretch + 4}
            y={830}
            width={TICK_W - 8 + GAP_W * stretch}
            height={70}
            fill={GOLD}
          />
          {ticks.slice(1).map((i) => (
            <rect key={i} x={tickX(i) + 4} y={830} width={TICK_W - 8} height={70} fill={TEAL} />
          ))}
        </g>
        <g opacity={ramp(frame, 150, 162)}>
          <text x={540} y={1010} textAnchor="middle" fontSize={50} fontWeight={900} fill={GOLD}>
            FIRST TICK = LONGER
          </text>
        </g>
      </svg>
      <div style={{ position: "absolute", top: 210 }}>
        <Stamp text="BRAIN REWINDS" appear={ramp(frame, 100, 112)} color={GOLD} size={80} rotate={-3} />
      </div>
      <div style={{ position: "absolute", bottom: 240, padding: "0 90px" }}>
        <TextReveal fontSize={46} delay={10} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

export const Chronostasis: React.FC<ChronostasisProps> = ({
  hookText,
  setupText,
  snapText,
  commentText,
  jumpText,
  rewindText,
  buttonText,
  audioFile,
  channelName,
}) => {
  const bounds = [...STARTS, TOTAL_FRAMES];
  const dur = (i: number) => bounds[i + 1] - bounds[i];

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      {audioFile ? <Audio src={staticFile(audioFile)} /> : null}

      <Sequence from={STARTS[0]} durationInFrames={dur(0)}>
        <HookScene text={hookText} />
      </Sequence>
      <Sequence from={STARTS[1]} durationInFrames={dur(1)}>
        <SetupScene text={setupText} />
      </Sequence>
      <Sequence from={STARTS[2]} durationInFrames={dur(2)}>
        <SnapScene text={snapText} comment={commentText} />
      </Sequence>
      <Sequence from={STARTS[3]} durationInFrames={dur(3)}>
        <JumpScene text={jumpText} />
      </Sequence>
      <Sequence from={STARTS[4]} durationInFrames={dur(4)}>
        <RewindScene text={rewindText} />
      </Sequence>
      <Sequence from={STARTS[5]} durationInFrames={dur(5)}>
        <EndCardScene text={buttonText} />
      </Sequence>

      <ChannelWatermark text={channelName} />
    </AbsoluteFill>
  );
};
