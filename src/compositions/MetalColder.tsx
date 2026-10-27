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
import { EndCardScene } from "../components/EndCardScene";

export type MetalColderProps = {
  hookText: string;
  setupText: string;
  payoffText: string;
  bonusText: string;
  buttonText: string;
  audioFile?: string;
  channelName?: string;
};

const defaultProps: MetalColderProps = {
  hookText: "Hook text goes here",
  setupText: "Setup beat text goes here",
  payoffText: "Payoff beat text goes here",
  bonusText: "Bonus beat text goes here",
  buttonText: "Button line goes here",
};

// Scene start times in seconds: hook, setup, payoff, bonus, button (the button
// scene doubles as the end card). Aligned to the `say` voiceover clips
// (assets/audio/007-metal-feels-colder.m4a).
const FPS = 30;
const STARTS = [0, 5.15, 14.27, 27.01, 39.2].map((s) => Math.round(s * FPS));
const TOTAL_FRAMES = 45 * FPS;

const SKIN = "#F2B38C";
const SKIN_DARK = "#C98A66";
const METAL = "#9FB4C7";
const METAL_DARK = "#5E7388";
const WOOD = "#B07A45";
const WOOD_DARK = "#7A4E26";
const HEAT = "#FF8A3D";
const COLD = "#5CC8FF";

// "Why does metal feel colder?" explainer: same-temperature blocks hook ->
// skin-senses-heat-loss setup -> fast-vs-slow heat flow payoff -> reverse-case
// bonus -> shared end card.
export const MetalColderComposition = () => {
  return (
    <Composition
      id="MetalColder"
      component={MetalColder}
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

const wavy = (x0: number, x1: number, y: number, amp: number, seg = 44) => {
  let d = `M ${x0} ${y}`;
  let up = -1;
  for (let x = x0; x < x1; x += seg) {
    d += ` Q ${x + seg / 2} ${y + up * amp} ${x + seg} ${y}`;
    up = -up;
  }
  return d;
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

// A fingertip pointing down; its tip sits at y=240 of a 140x260 box.
const Finger: React.FC<{ width?: number }> = ({ width = 140 }) => (
  <svg width={width} height={width * (260 / 140)} viewBox="0 0 140 260">
    <path
      d="M 20 0 L 20 170 Q 20 242 70 242 Q 120 242 120 170 L 120 0 Z"
      fill={SKIN}
      stroke={SKIN_DARK}
      strokeWidth={6}
    />
    <ellipse cx="48" cy="190" rx="10" ry="18" fill="#fff" opacity={0.25} />
  </svg>
);

// A 400x260 block of metal or wood.
const Block: React.FC<{ kind: "metal" | "wood"; glow?: number }> = ({ kind, glow = 0 }) => {
  const metal = kind === "metal";
  const base = metal ? METAL : WOOD;
  const edge = metal ? METAL_DARK : WOOD_DARK;
  return (
    <svg width={400} height={260} viewBox="0 0 400 260" overflow="visible">
      <rect x="0" y="0" width="400" height="260" rx="30" fill={HEAT} opacity={0.5 * glow} filter="blur(18px)" />
      <rect x="6" y="6" width="388" height="248" rx="28" fill={base} stroke={edge} strokeWidth={8} />
      {metal ? (
        <>
          <path d="M 70 6 L 20 254" stroke="#fff" strokeWidth={26} opacity={0.35} strokeLinecap="round" />
          <path d="M 140 6 L 110 130" stroke="#fff" strokeWidth={10} opacity={0.3} strokeLinecap="round" />
        </>
      ) : (
        [60, 110, 160, 210].map((y) => (
          <path key={y} d={wavy(24, 380, y, 7, 89)} fill="none" stroke={edge} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
        ))
      )}
    </svg>
  );
};

const Thermometer: React.FC<{ text: string; appear: number; color?: string }> = ({
  text,
  appear,
  color = colors.foreground,
}) => (
  <div
    style={{
      opacity: appear,
      transform: `scale(${0.6 + 0.4 * appear})`,
      display: "flex",
      alignItems: "center",
      gap: 14,
      fontSize: 52,
      fontWeight: 900,
      color,
      border: `6px solid ${color}`,
      borderRadius: 999,
      padding: "6px 30px 6px 18px",
    }}
  >
    <svg width="26" height="56" viewBox="0 0 26 56">
      <rect x="9" y="2" width="8" height="38" rx="4" fill="none" stroke={color} strokeWidth={4} />
      <circle cx="13" cy="44" r="9" fill={color} />
    </svg>
    {text}
  </div>
);

// Heat chevrons drifting down (out of the finger) or up (into the finger).
const HeatArrows: React.FC<{
  xs: number[];
  top: number;
  bottom: number;
  direction: "down" | "up";
  appear: number;
}> = ({ xs, top, bottom, direction, appear }) => {
  const frame = useCurrentFrame();
  if (appear <= 0) return null;
  return (
    <>
      {xs.map((x, i) => {
        const p = (frame / 28 + i / xs.length) % 1;
        const t = direction === "down" ? p : 1 - p;
        const y = top + t * (bottom - top);
        const pts =
          direction === "down" ? "-16,-12 16,-12 0,14" : "-16,12 16,12 0,-14";
        return (
          <svg
            key={x}
            width={40}
            height={40}
            viewBox="-20 -20 40 40"
            style={{
              position: "absolute",
              left: x - 20,
              top: y - 20,
              opacity: appear * Math.sin(p * Math.PI),
            }}
          >
            <polygon points={pts} fill={HEAT} />
          </svg>
        );
      })}
    </>
  );
};

const HookScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 12, mass: 0.7 } });
  const therm = ramp(frame, 18, 30);
  const myth = ramp(frame, 50, 62);
  const strike = ramp(frame, 74, 86);
  const truth = ramp(frame, 96, 108);

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <BackgroundPulse color={colors.accentAlt} size={1100} />
      <div style={{ position: "absolute", top: 230, display: "flex", gap: 80, transform: `scale(${intro})` }}>
        {(["metal", "wood"] as const).map((k) => (
          <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
            <Block kind={k} />
            <Thermometer text="21°C" appear={therm} />
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 860, display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
        <div style={{ position: "relative" }}>
          <Stamp text="METAL IS COLDER" appear={myth} color={colors.muted} size={62} rotate={-3} />
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
        <Stamp text="SAME TEMP" appear={truth} color={colors.accentAlt} size={96} rotate={4} />
      </div>
      <div style={{ position: "absolute", bottom: 220, padding: "0 90px" }}>
        <TextReveal fontSize={54} delay={10} stagger style={{ color: colors.foreground }}>
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
  const heat = ramp(frame, 40, 56);
  const sensor = ramp(frame, 120, 134);
  const notTherm = ramp(frame, 190, 204);

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <BackgroundPulse color={colors.accent} size={1000} />
      <div style={{ position: "absolute", top: 260, left: 470, transform: `scale(${intro})` }}>
        <Finger width={140} />
      </div>
      <HeatArrows xs={[500, 540, 580]} top={720} bottom={900} direction="down" appear={heat} />
      <div style={{ position: "absolute", top: 930, opacity: heat, fontSize: 52, fontWeight: 800, color: HEAT }}>
        heat leaving your skin
      </div>
      <div style={{ position: "absolute", top: 1070, display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
        <Stamp text="HEAT-LOSS SENSOR" appear={sensor} color={colors.accentAlt} size={70} rotate={-3} />
        <div style={{ position: "relative" }}>
          <Stamp text="THERMOMETER" appear={notTherm} color={colors.muted} size={62} rotate={3} />
          {notTherm > 0 && (
            <div
              style={{
                position: "absolute",
                left: -10,
                top: "50%",
                height: 12,
                width: `${notTherm * 104}%`,
                background: colors.accent,
                borderRadius: 6,
                transform: "rotate(3deg)",
              }}
            />
          )}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 180, padding: "0 90px" }}>
        <TextReveal fontSize={50} delay={10} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

type ColumnProps = {
  kind: "metal" | "wood";
  label: string;
  direction: "down" | "up";
  arrowCount: number;
  arrow: number;
  bar: number;
  barColor: string;
  barLabel: string;
  barLabelAppear: number;
  glow?: number;
};

// One finger-on-block column: finger on top, block below, heat arrows crossing
// the contact point, and a skin-heat bar underneath.
const Column: React.FC<ColumnProps> = ({
  kind,
  label,
  direction,
  arrowCount,
  arrow,
  bar,
  barColor,
  barLabel,
  barLabelAppear,
  glow = 0,
}) => {
  const xs = Array.from({ length: arrowCount }, (_, i) => 70 + (260 / Math.max(arrowCount - 1, 1)) * i);
  const xsMid = arrowCount === 1 ? [200] : xs;
  return (
    <div style={{ position: "relative", width: 400, height: 760 }}>
      <div style={{ position: "absolute", left: 130, top: 0 }}>
        <Finger width={140} />
      </div>
      <div style={{ position: "absolute", left: 0, top: 244 }}>
        <Block kind={kind} glow={glow} />
      </div>
      <HeatArrows xs={xsMid} top={250} bottom={470} direction={direction} appear={arrow} />
      <div style={{ position: "absolute", top: 520, width: 400, textAlign: "center", fontSize: 44, fontWeight: 900, color: colors.foreground }}>
        {label}
      </div>
      <div style={{ position: "absolute", top: 600, left: 20, width: 360, height: 34, borderRadius: 17, border: `5px solid ${colors.muted}` }}>
        <div style={{ width: `${bar * 100}%`, height: "100%", borderRadius: 12, background: barColor }} />
      </div>
      <div style={{ position: "absolute", top: 650, width: 400, textAlign: "center", fontSize: 44, fontWeight: 900, color: barColor, opacity: barLabelAppear }}>
        {barLabel}
      </div>
    </div>
  );
};

const PayoffScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 12, mass: 0.7 } });
  const arrows = ramp(frame, 40, 56);
  const metalBar = 1 - 0.75 * ramp(frame, 60, 200);
  const woodBar = 1 - 0.1 * ramp(frame, 60, 200);
  const verdict = ramp(frame, 210, 226);
  const stamp = ramp(frame, 280, 294);

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <BackgroundPulse color={metalBar < 0.6 ? COLD : colors.accentAlt} size={1000} />
      <div style={{ position: "absolute", top: 250, display: "flex", gap: 80, transform: `scale(${intro})` }}>
        <Column
          kind="metal"
          label="METAL"
          direction="down"
          arrowCount={5}
          arrow={arrows}
          bar={metalBar}
          barColor={COLD}
          barLabel="COLD!"
          barLabelAppear={verdict}
        />
        <Column
          kind="wood"
          label="WOOD"
          direction="down"
          arrowCount={1}
          arrow={arrows}
          bar={woodBar}
          barColor={colors.accentAlt}
          barLabel="meh"
          barLabelAppear={verdict}
        />
      </div>
      <div style={{ position: "absolute", top: 1100 }}>
        <Stamp text="HEAT RACES OUT" appear={stamp} color={HEAT} size={70} rotate={-3} />
      </div>
      <div style={{ position: "absolute", bottom: 180, padding: "0 90px" }}>
        <TextReveal fontSize={46} delay={10} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

const BonusScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 12, mass: 0.7 } });
  const glow = ramp(frame, 20, 60);
  const arrows = ramp(frame, 60, 76);
  const metalBar = 0.4 + 0.6 * ramp(frame, 80, 200);
  const woodBar = 0.4 + 0.12 * ramp(frame, 80, 200);
  const verdict = ramp(frame, 210, 226);
  const car = ramp(frame, 250, 264);
  const ouch = ramp(frame, 290, 304);

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <BackgroundPulse color={HEAT} size={1000} />
      <div style={{ position: "absolute", top: 250, display: "flex", gap: 80, transform: `scale(${intro})` }}>
        <Column
          kind="metal"
          label={car > 0.5 ? "BUCKLE" : "METAL"}
          direction="up"
          arrowCount={5}
          arrow={arrows}
          bar={metalBar}
          barColor={HEAT}
          barLabel={car > 0.5 ? "OUCH!" : "HOT!"}
          barLabelAppear={verdict}
          glow={glow}
        />
        <Column
          kind="wood"
          label={car > 0.5 ? "STRAP" : "WOOD"}
          direction="up"
          arrowCount={1}
          arrow={arrows}
          bar={woodBar}
          barColor={colors.accentAlt}
          barLabel="fine"
          barLabelAppear={verdict}
          glow={glow}
        />
      </div>
      <div style={{ position: "absolute", top: 1100, display: "flex", gap: 40, alignItems: "center" }}>
        <Stamp text="WARMER THAN SKIN" appear={ramp(frame, 30, 44)} color={HEAT} size={56} rotate={-3} />
        <Stamp text="HOT CAR" appear={ouch} color={colors.accent} size={56} rotate={4} />
      </div>
      <div style={{ position: "absolute", bottom: 200, padding: "0 90px" }}>
        <TextReveal fontSize={46} delay={8} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

export const MetalColder: React.FC<MetalColderProps> = ({
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
        <EndCardScene text={buttonText} />
      </Sequence>

      <ChannelWatermark text={channelName} />
    </AbsoluteFill>
  );
};
