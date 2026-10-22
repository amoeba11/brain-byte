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

export type BatteryTongueProps = {
  hookText: string;
  setupText: string;
  payoffText: string;
  buttonText: string;
  audioFile?: string;
  channelName?: string;
};

const defaultProps: BatteryTongueProps = {
  hookText: "Hook text goes here",
  setupText: "Setup beat text goes here",
  payoffText: "Payoff beat text goes here",
  buttonText: "Button line goes here",
};

// "Why licking a 9V battery tingles" explainer: hook -> terminal-proximity
// setup -> tongue-completes-the-circuit payoff -> car-battery gag button.
export const BatteryTongueComposition = () => {
  return (
    <Composition
      id="BatteryTongue"
      component={BatteryTongue}
      durationInFrames={30 * 38}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
    />
  );
};

// A simple 9V battery with its two terminals rendered close together on top —
// the whole trick hinges on that proximity, so the shape itself is the point.
const Battery9V: React.FC<{ glow?: number }> = ({ glow = 0 }) => (
  <svg width={260} height={340} viewBox="0 0 260 340">
    <rect x="20" y="40" width="220" height="280" rx="24" fill={colors.accentAlt} />
    <text
      x="130"
      y="200"
      textAnchor="middle"
      fontSize="38"
      fontWeight={700}
      fill={colors.background}
    >
      9V
    </text>
    {/* Snap terminal (+) */}
    <rect
      x="70"
      y="4"
      width="40"
      height="36"
      rx="6"
      fill={colors.foreground}
      opacity={0.9 + glow * 0.1}
    />
    {/* Snap terminal (-) */}
    <rect
      x="150"
      y="4"
      width="40"
      height="36"
      rx="6"
      fill={colors.foreground}
      opacity={0.9 + glow * 0.1}
    />
    {glow > 0 && (
      <circle
        cx="130"
        cy="22"
        r={40 + glow * 20}
        fill={colors.accent}
        opacity={glow * 0.3}
      />
    )}
  </svg>
);

const HookScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const zoom = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
  const scale = interpolate(zoom, [0, 1], [0.6, 1]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 50 }}>
      <BackgroundPulse color={colors.accent} />
      <div style={{ transform: `scale(${scale})` }}>
        <Battery9V />
      </div>
      <div style={{ padding: "0 90px" }}>
        <TextReveal fontSize={56} delay={14} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

const SetupScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const bracketPulse = 1 + Math.sin(frame / 10) * 0.15;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <BackgroundPulse color={colors.accentAlt} size={900} />
      <div style={{ position: "relative" }}>
        <Battery9V />
        {/* Bracket calling out how close the two terminals sit. */}
        <svg
          width={120}
          height={50}
          viewBox="0 0 120 50"
          style={{
            position: "absolute",
            top: -46,
            left: 70,
            transform: `scale(${bracketPulse})`,
          }}
        >
          <path
            d="M 10 40 Q 10 10 60 10 Q 110 10 110 40"
            fill="none"
            stroke={colors.accent}
            strokeWidth={5}
          />
        </svg>
      </div>
      <div style={{ color: colors.accent, fontSize: 30, fontWeight: 700 }}>
        terminals this close together
      </div>
      <div style={{ padding: "0 90px" }}>
        <TextReveal fontSize={44} delay={15} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

const PayoffScene: React.FC<{ text: string; durationInFrames: number }> = ({
  text,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const contact = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const tingle = interpolate(
    frame,
    [25, durationInFrames - 20, durationInFrames],
    [0, 1, 0.3],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 36 }}>
      <BackgroundPulse color={colors.accent} />
      <div style={{ position: "relative" }}>
        <Battery9V glow={tingle} />
        {/* Tongue bridging both terminals, sliding in to make contact. */}
        <svg
          width={160}
          height={70}
          viewBox="0 0 160 70"
          style={{
            position: "absolute",
            top: -30 + (1 - contact) * 40,
            left: 50,
            opacity: contact,
          }}
        >
          <ellipse cx="80" cy="35" rx="70" ry="24" fill="#E06B8B" />
        </svg>
        {/* Current arc jumping terminal to terminal through the tongue. */}
        {tingle > 0.05 && (
          <svg
            width={120}
            height={40}
            viewBox="0 0 120 40"
            style={{ position: "absolute", top: -14, left: 70 }}
          >
            <path
              d="M 10 30 Q 60 -10 110 30"
              fill="none"
              stroke={colors.accentAlt}
              strokeWidth={4}
              opacity={tingle}
              strokeDasharray="6 5"
            />
          </svg>
        )}
      </div>
      <div style={{ color: colors.accentAlt, fontSize: 32, fontWeight: 700 }}>
        {tingle > 0.5 ? "zzzt — circuit complete" : "making contact..."}
      </div>
      <div style={{ padding: "0 90px" }}>
        <TextReveal fontSize={42} delay={10} style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

const WarningScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stamp = spring({ frame, fps, config: { damping: 9, mass: 0.5, stiffness: 180 } });
  const stampScale = interpolate(stamp, [0, 1], [1.6, 1]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <BackgroundPulse color={colors.accentAlt} size={950} />
      {/* Same current-arc gag, now over a much bigger battery — the joke is
          the scale jump, not a real safety demo. */}
      <svg width={280} height={200} viewBox="0 0 280 200">
        <rect x="10" y="20" width="260" height="160" rx="16" fill={colors.muted} />
        <rect x="70" y="0" width="30" height="24" fill={colors.foreground} />
        <rect x="180" y="0" width="30" height="24" fill={colors.foreground} />
        <text x="140" y="110" textAnchor="middle" fontSize="34" fontWeight={700} fill={colors.background}>
          CAR BATTERY
        </text>
      </svg>
      <div
        style={{
          transform: `scale(${stampScale}) rotate(-8deg)`,
          border: `8px solid ${colors.accent}`,
          color: colors.accent,
          fontSize: 64,
          fontWeight: 900,
          padding: "10px 30px",
          borderRadius: 16,
        }}
      >
        DON'T.
      </div>
    </AbsoluteFill>
  );
};

export const BatteryTongue: React.FC<BatteryTongueProps> = ({
  hookText,
  setupText,
  payoffText,
  buttonText,
  audioFile,
  channelName,
}) => {
  const { durationInFrames } = useVideoConfig();

  // Beat timings proportioned by VO word count (hook 15, setup 24, payoff 38,
  // warning gag + button ~15 words) — fine-tune against the real audio
  // waveform in Remotion Studio before final render.
  const hook = Math.round(durationInFrames * 0.14);
  const setup = Math.round(durationInFrames * 0.22);
  const payoff = Math.round(durationInFrames * 0.33);
  const warning = Math.round(durationInFrames * 0.16);
  const button = durationInFrames - hook - setup - payoff - warning;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      {audioFile ? <Audio src={staticFile(audioFile)} /> : null}

      <Sequence durationInFrames={hook}>
        <HookScene text={hookText} />
      </Sequence>
      <Sequence from={hook} durationInFrames={setup}>
        <SetupScene text={setupText} />
      </Sequence>
      <Sequence from={hook + setup} durationInFrames={payoff}>
        <PayoffScene text={payoffText} durationInFrames={payoff} />
      </Sequence>
      <Sequence from={hook + setup + payoff} durationInFrames={warning}>
        <WarningScene />
      </Sequence>
      <Sequence from={hook + setup + payoff + warning} durationInFrames={button}>
        <EndCardScene text={buttonText} />
      </Sequence>

      <ChannelWatermark text={channelName} />
    </AbsoluteFill>
  );
};
