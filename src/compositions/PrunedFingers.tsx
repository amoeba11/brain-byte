import {
  AbsoluteFill,
  Audio,
  Composition,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors } from "../themes/colors";
import { TextReveal } from "../components/TextReveal";
import { BackgroundPulse } from "../components/BackgroundPulse";
import { ChannelWatermark } from "../components/ChannelWatermark";

export type PrunedFingersProps = {
  hookText: string;
  setupText: string;
  payoffText: string;
  bonusText: string;
  buttonText: string;
  audioFile?: string;
  channelName?: string;
};

const defaultProps: PrunedFingersProps = {
  hookText: "Hook text goes here",
  setupText: "Setup beat text goes here",
  payoffText: "Payoff beat text goes here",
  bonusText: "Bonus beat text goes here",
  buttonText: "Button line goes here",
};

// Scene start times in seconds: hook, setup, payoff, bonus, button, end card.
// Aligned to the `say` voiceover clips (assets/audio/006-pruned-fingers.m4a):
// hook, setup, payoff, bonus, button (the button scene doubles as the end card).
const FPS = 30;
const STARTS = [0, 5.25, 14.94, 23.56, 32.79].map((s) => Math.round(s * FPS));
const TOTAL_FRAMES = 38 * FPS;

const SKIN = "#F2B38C";
const SKIN_DARK = "#C98A66";
const PAD = "#E8957A";
const BLOOD = "#FF5C7A";
const WATER = "#5CC8FF";

// "Why do your fingers prune in water?" explainer: wrinkling-fingertip hook ->
// damaged-nerve setup -> vessel-squeeze cross-section payoff -> tire-tread
// theory bonus -> rain-tires button.
export const PrunedFingersComposition = () => {
  return (
    <Composition
      id="PrunedFingers"
      component={PrunedFingers}
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

// A wavy horizontal line from x0 to x1 at height y. Used for skin wrinkles and tread grooves.
const wavy = (x0: number, x1: number, y: number, amp: number, seg = 44) => {
  let d = `M ${x0} ${y}`;
  let up = -1;
  for (let x = x0; x < x1; x += seg) {
    d += ` Q ${x + seg / 2} ${y + up * amp} ${x + seg} ${y}`;
    up = -up;
  }
  return d;
};

// A smooth finger whose fingertip skin wrinkles as `wrinkle` goes 0 -> 1.
const Fingertip: React.FC<{ id: string; width: number; wrinkle: number }> = ({
  id,
  width,
  wrinkle,
}) => {
  const body = "M 60 520 L 60 150 Q 60 40 150 40 Q 240 40 240 150 L 240 520 Z";
  return (
    <svg width={width} height={width * (520 / 300)} viewBox="0 0 300 520">
      <defs>
        <clipPath id={id}>
          <path d={body} />
        </clipPath>
      </defs>
      <path d={body} fill={SKIN} stroke={SKIN_DARK} strokeWidth={6} />
      <g clipPath={`url(#${id})`}>
        {Array.from({ length: 11 }, (_, i) => (
          <path
            key={i}
            d={wavy(40, 270, 80 + i * 34, 3 + wrinkle * 11, 36)}
            fill="none"
            stroke={SKIN_DARK}
            strokeWidth={2 + wrinkle * 4}
            strokeLinecap="round"
            opacity={wrinkle}
          />
        ))}
      </g>
      <ellipse cx="120" cy="100" rx="22" ry="34" fill="#fff" opacity={0.25 * (1 - wrinkle)} />
    </svg>
  );
};

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

const WaterBand: React.FC<{ height?: number }> = ({ height = 220 }) => {
  const frame = useCurrentFrame();
  return (
    <svg
      width={1080}
      height={height}
      viewBox={`0 0 1080 ${height}`}
      style={{ position: "absolute", bottom: 0, left: 0 }}
    >
      <rect x="0" y="40" width="1080" height={height} fill={WATER} opacity={0.22} />
      <path
        d={wavy(-60 + ((frame * 2) % 88), 1200, 40, 12, 88)}
        fill="none"
        stroke={WATER}
        strokeWidth={6}
        opacity={0.8}
        strokeLinecap="round"
      />
    </svg>
  );
};

const HookScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 12, mass: 0.7 } });
  const wrinkle = ramp(frame, 14, 80);
  const myth = ramp(frame, 70, 82);
  const strike = ramp(frame, 90, 102);
  const truth = ramp(frame, 112, 124);

  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 100 }}>
      <BackgroundPulse color={colors.accentAlt} size={1100} />
      <div style={{ transform: `scale(${intro})` }}>
        <Fingertip id="hookClip" width={380} wrinkle={wrinkle} />
      </div>
      {Array.from({ length: 6 }, (_, i) => {
        const p = ((frame / 40 + i / 6) % 1);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 250 + i * 120,
              top: 80 + p * 520,
              width: 22,
              height: 34,
              borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%",
              background: WATER,
              opacity: Math.sin(p * Math.PI),
            }}
          />
        );
      })}
      <div style={{ position: "absolute", top: 860, display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
        <div style={{ position: "relative" }}>
          <Stamp text="SOAKING UP WATER" appear={myth} color={colors.muted} size={62} rotate={-3} />
          <div
            style={{
              position: "absolute",
              left: -10,
              top: "50%",
              height: 12,
              width: `${strike * 104}%`,
              background: colors.accent,
              borderRadius: 6,
              transform: "rotate(-3deg)",
            }}
          />
        </div>
        <Stamp text="ON PURPOSE" appear={truth} color={colors.accentAlt} size={96} rotate={4} />
      </div>
      <div style={{ position: "absolute", bottom: 190, padding: "0 90px" }}>
        <TextReveal fontSize={54} delay={20} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

const SetupScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 12, mass: 0.7 } });
  const wrinkle = ramp(frame, 30, 150);
  const nerveCut = ramp(frame, 20, 34);
  const note = ramp(frame, 170, 190);

  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 330 }}>
      <BackgroundPulse color={colors.accent} size={1000} />
      <div style={{ display: "flex", gap: 90, transform: `scale(${intro})` }}>
        {[
          { label: "NORMAL NERVES", w: wrinkle, id: "setupA", color: colors.accentAlt },
          { label: "DAMAGED NERVES", w: 0, id: "setupB", color: colors.muted },
        ].map((f) => (
          <div key={f.id} style={{ textAlign: "center" }}>
            <Fingertip id={f.id} width={330} wrinkle={f.w} />
            <div style={{ fontSize: 34, fontWeight: 800, color: f.color, marginTop: 14 }}>
              {f.label}
            </div>
          </div>
        ))}
      </div>
      {nerveCut > 0 && (
        <div
          style={{
            position: "absolute",
            left: 690,
            top: 560,
            fontSize: 150,
            fontWeight: 900,
            color: colors.accent,
            opacity: nerveCut,
            transform: `scale(${1.8 - 0.8 * nerveCut}) rotate(8deg)`,
          }}
        >
          ✂
        </div>
      )}
      <div style={{ position: "absolute", top: 1230, opacity: note }}>
        <Stamp text="NO SIGNAL = NO PRUNE" appear={note} color={colors.accent} size={58} rotate={-2} />
      </div>
      <WaterBand height={300} />
      <div style={{ position: "absolute", bottom: 150, padding: "0 90px" }}>
        <TextReveal fontSize={50} delay={12} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

// Fingertip cross-section: a nerve signal squeezes the vessel, the pad shrinks, the skin buckles.
const domePath = (cx: number, cy: number, r: number, bottom: number, amp: number) => {
  const pts: string[] = [];
  const side = 8;
  for (let i = 0; i <= side; i++) {
    pts.push(`${cx - r} ${bottom - (i / side) * (bottom - cy)}`);
  }
  const steps = 48;
  for (let i = 1; i < steps; i++) {
    const th = Math.PI - (i / steps) * Math.PI;
    const rr = r - amp * (0.5 - 0.5 * Math.cos(th * 10));
    pts.push(`${cx + rr * Math.cos(th)} ${cy - rr * Math.sin(th)}`);
  }
  for (let i = side; i >= 0; i--) {
    pts.push(`${cx + r} ${bottom - (i / side) * (bottom - cy)}`);
  }
  return `M ${pts.join(" L ")} Z`;
};

const PayoffScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 12, mass: 0.7 } });
  const signal = ramp(frame, 20, 40);
  const squeeze = ramp(frame, 100, 150);
  const shrink = ramp(frame, 140, 200);
  const buckle = ramp(frame, 190, 250);
  const vessel = 44 - 30 * squeeze;
  const padR = 160 - 50 * shrink;
  const skinR = 190 - 28 * shrink;
  const cx = 450;
  const cy = 300;

  // [appear, text, color, x, y, anchor]
  const labels: [number, string, string, number, number, "start" | "end"][] = [
    [signal, "nerve signal", colors.accentAlt, 480, 790, "start"],
    [squeeze, "vessels squeeze", BLOOD, 670, 430, "start"],
    [shrink, "pad shrinks", PAD, 240, 480, "end"],
    [buckle, "skin buckles", colors.foreground, 240, 220, "end"],
  ];

  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 260 }}>
      <BackgroundPulse color={squeeze > 0.4 ? colors.accent : colors.accentAlt} size={1000} />
      <svg width={920} height={820} viewBox="0 0 900 800" overflow="visible" style={{ transform: `scale(${intro})` }}>
        <path
          d={domePath(cx, cy, skinR, 760, 14 * buckle)}
          fill={SKIN}
          stroke={SKIN_DARK}
          strokeWidth={8}
          strokeLinejoin="round"
        />
        <path d={domePath(cx, cy + 30, padR, 760, 0)} fill={PAD} opacity={0.9} />
        {/* Blood vessels */}
        {[420, 560].map((y) => (
          <line
            key={y}
            x1={cx - padR + 20}
            x2={cx + padR - 20}
            y1={y}
            y2={y}
            stroke={BLOOD}
            strokeWidth={vessel}
            strokeLinecap="round"
          />
        ))}
        {/* Nerve running up from below, carrying pulses */}
        <line x1={cx} y1={800} x2={cx} y2={400} stroke={colors.accentAlt} strokeWidth={6} strokeDasharray="4 10" opacity={signal} />
        {signal > 0 &&
          [0, 1, 2].map((i) => {
            const p = (frame / 36 + i / 3) % 1;
            return (
              <circle
                key={i}
                cx={cx}
                cy={800 - p * 400}
                r={14}
                fill={colors.accentAlt}
                opacity={signal * (1 - ramp(frame, 160, 190))}
              />
            );
          })}
        {labels.map(([a, t, c, x, y, anchor]) =>
          a > 0 ? (
            <text
              key={t}
              x={x}
              y={y}
              fontSize={38}
              fontWeight={800}
              fill={c}
              opacity={a}
              textAnchor={anchor}
              stroke={colors.background}
              strokeWidth={6}
              paintOrder="stroke"
            >
              {t}
            </text>
          ) : null
        )}
      </svg>
      <div style={{ position: "absolute", bottom: 150, padding: "0 90px" }}>
        <TextReveal fontSize={46} delay={10} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

// A grooved block with water droplets running down the grooves.
const GroovePanel: React.FC<{
  label: string;
  base: string;
  groove: string;
  zigzag?: boolean;
  appear: number;
}> = ({ label, base, groove, zigzag, appear }) => {
  const frame = useCurrentFrame();
  const w = 420;
  const h = 560;
  const lines = [60, 140, 220, 300, 380].map((x) => x + (zigzag ? 0 : 0));
  return (
    <div style={{ textAlign: "center", opacity: appear, transform: `translateY(${(1 - appear) * 40}px)` }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <rect x="10" y="10" width={w - 20} height={h - 20} rx="50" fill={base} stroke={groove} strokeWidth={6} />
        {lines.map((x, i) => {
          const d = zigzag
            ? `M ${x} 40 L ${x + 26} 110 L ${x - 26} 180 L ${x + 26} 250 L ${x - 26} 320 L ${x + 26} 390 L ${x - 26} 460 L ${x} 520`
            : `M ${x} 40 Q ${x + 24} 120 ${x} 200 T ${x} 360 T ${x} 520`;
          return (
            <path key={i} d={d} fill="none" stroke={groove} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
          );
        })}
        {lines.map((x, i) => {
          const p = (frame / 45 + i * 0.21) % 1;
          return (
            <circle key={i} cx={x} cy={40 + p * 480} r={9} fill={WATER} opacity={Math.sin(p * Math.PI)} />
          );
        })}
      </svg>
      <div style={{ fontSize: 40, fontWeight: 800, color: colors.foreground, marginTop: 8 }}>{label}</div>
    </div>
  );
};

const BonusScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const left = ramp(frame, 8, 28);
  const right = ramp(frame, 40, 60);
  const theory = ramp(frame, 100, 112);
  const debated = ramp(frame, 170, 184);

  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 240 }}>
      <BackgroundPulse color={colors.accentAlt} size={1000} />
      <div style={{ display: "flex", gap: 60 }}>
        <GroovePanel label="PRUNED PAD" base={SKIN} groove={SKIN_DARK} appear={left} />
        <GroovePanel label="RAIN TIRE" base="#1B1B2E" groove={colors.muted} zigzag appear={right} />
      </div>
      <div style={{ position: "absolute", top: 1080, display: "flex", gap: 40, alignItems: "center" }}>
        <Stamp text="THEORY" appear={theory} color={colors.accentAlt} size={70} rotate={-5} />
        <Stamp text="STILL DEBATED" appear={debated} color={colors.accent} size={56} rotate={4} />
      </div>
      <div style={{ position: "absolute", bottom: 170, padding: "0 90px" }}>
        <TextReveal fontSize={46} delay={8} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

const RainTiresScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 10, mass: 0.7 } });
  const swap = ramp(frame, 30, 50);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 80 }}>
      <BackgroundPulse color={colors.accent} size={1000} />
      {Array.from({ length: 10 }, (_, i) => {
        const p = (frame / 30 + i / 10) % 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 60 + i * 100,
              top: p * 1500,
              width: 6,
              height: 50,
              borderRadius: 3,
              background: WATER,
              opacity: 0.5,
            }}
          />
        );
      })}
      <svg width={560} height={560} viewBox="-280 -280 560 560" style={{ transform: `scale(${intro})` }}>
        <g transform={`rotate(${frame * 4})`}>
          <circle r="250" fill="#1B1B2E" stroke={colors.muted} strokeWidth={8} />
          {Array.from({ length: 18 }, (_, i) => (
            <rect
              key={i}
              x="-14"
              y="-262"
              width="28"
              height="46"
              rx="6"
              fill={colors.muted}
              transform={`rotate(${i * 20})`}
            />
          ))}
          <circle r="170" fill={SKIN} stroke={SKIN_DARK} strokeWidth={6} opacity={swap} />
          {[-90, -45, 0, 45, 90].map((y) => (
            <path key={y} d={wavy(-130, 130, y, 10, 52)} fill="none" stroke={SKIN_DARK} strokeWidth={6} strokeLinecap="round" opacity={swap} />
          ))}
        </g>
      </svg>
      <Stamp text="RAIN TIRES?" appear={ramp(frame, 60, 72)} color={colors.accentAlt} size={100} rotate={-4} />
      <div style={{ padding: "0 90px" }}>
        <TextReveal fontSize={48} delay={8} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
        <div style={{ marginTop: 40 }}>
          <TextReveal fontSize={32} delay={60} style={{ color: colors.accentAlt, fontWeight: 500 }}>
            Follow for more
          </TextReveal>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const PrunedFingers: React.FC<PrunedFingersProps> = ({
  hookText,
  setupText,
  payoffText,
  bonusText,
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
        <PayoffScene text={payoffText} />
      </Sequence>
      <Sequence from={STARTS[3]} durationInFrames={dur(3)}>
        <BonusScene text={bonusText} />
      </Sequence>
      <Sequence from={STARTS[4]} durationInFrames={dur(4)}>
        <RainTiresScene text={buttonText} />
      </Sequence>

      <ChannelWatermark text={channelName} />
    </AbsoluteFill>
  );
};
