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
import { Waveform } from "../components/Waveform";

export type WaveCancelProps = {
  hookText: string;
  setupText: string;
  payoffText: string;
  twistText: string;
  buttonText: string;
  audioFile?: string;
  channelName?: string;
};

const defaultProps: WaveCancelProps = {
  hookText: "Hook text goes here",
  setupText: "Setup beat text goes here",
  payoffText: "Payoff beat text goes here",
  twistText: "Twist beat text goes here",
  buttonText: "Button line goes here",
};

// Generic "two waves collide" explainer template: hook -> listening setup ->
// destructive-interference payoff -> steady-vs-jagged twist -> button.
// Reusable for any episode built around a sound/wave-cancellation idea; the
// actual script/audio for a specific episode is passed in via props.
export const WaveCancelComposition = () => {
  return (
    <Composition
      id="WaveCancel"
      component={WaveCancel}
      durationInFrames={30 * 35}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
    />
  );
};

const MicIcon: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 8) * 0.12;

  return (
    <svg width={70} height={100} viewBox="0 0 70 100">
      <rect
        x="20"
        y="0"
        width="30"
        height="55"
        rx="15"
        fill={colors.accentAlt}
        transform={`scale(${pulse})`}
        style={{ transformOrigin: "35px 27px" }}
      />
      <path
        d="M 10 45 Q 10 75 35 75 Q 60 75 60 45"
        fill="none"
        stroke={colors.foreground}
        strokeWidth={5}
      />
      <line x1="35" y1="75" x2="35" y2="95" stroke={colors.foreground} strokeWidth={5} />
      <line x1="18" y1="95" x2="52" y2="95" stroke={colors.foreground} strokeWidth={5} />
    </svg>
  );
};

const HookScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const collide = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const offset = interpolate(collide, [0, 1], [130, 0]);
  const cancel = interpolate(frame, [18, 34], [1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{ alignItems: "center", justifyContent: "center", gap: 50 }}
    >
      <BackgroundPulse color={colors.accent} />
      <div style={{ position: "relative", width: 560, height: 120 }}>
        <div style={{ position: "absolute", left: -offset }}>
          <Waveform width={560} amplitude={34 * cancel} color={colors.accentAlt} />
        </div>
        <div style={{ position: "absolute", left: offset }}>
          <Waveform
            width={560}
            amplitude={34 * cancel}
            color={colors.accent}
            phase={Math.PI}
          />
        </div>
      </div>
      <TextReveal fontSize={60} delay={16} stagger style={{ color: colors.foreground }}>
        {text}
      </TextReveal>
    </AbsoluteFill>
  );
};

const SetupScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 50 }}>
      <BackgroundPulse color={colors.accentAlt} size={900} />
      <MicIcon />
      <Waveform width={700} amplitude={38} frequency={4} phase={frame / 6} color={colors.accent} />
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
  const merge = interpolate(frame, [0, durationInFrames - 60], [70, 0], {
    extrapolateRight: "clamp",
  });
  const cancelled = interpolate(frame, [durationInFrames - 60, durationInFrames - 30], [1, 0.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
      <BackgroundPulse color={colors.accent} />
      <div
        style={{
          color: colors.muted,
          fontSize: 26,
          letterSpacing: 1,
        }}
      >
        noise + inverted copy = cancel
      </div>
      <div style={{ position: "relative", width: 700, height: 220 }}>
        <div style={{ position: "absolute", top: 110 - merge }}>
          <Waveform width={700} amplitude={44 * cancelled} color={colors.accentAlt} />
        </div>
        <div style={{ position: "absolute", top: 110 + merge }}>
          <Waveform
            width={700}
            amplitude={44 * cancelled}
            color={colors.accent}
            phase={Math.PI}
          />
        </div>
        <div
          style={{
            // +60 matches the Waveform's default height/2 (its SVG's own
            // vertical center), so the line lines up with the waves exactly.
            position: "absolute",
            top: 170,
            left: 0,
            width: 700,
            height: 3,
            backgroundColor: colors.foreground,
            opacity: 1 - cancelled,
          }}
        />
      </div>
      <div style={{ padding: "0 90px" }}>
        <TextReveal fontSize={44} delay={10} style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

const TwistScene: React.FC<{ text: string; durationInFrames: number }> = ({
  text,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const steadyCancel = interpolate(frame, [10, durationInFrames - 50], [1, 0.03], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const jaggedCancel = interpolate(frame, [10, durationInFrames - 50], [1, 0.55], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 50 }}>
      <BackgroundPulse color={colors.accentAlt} size={900} />
      <div style={{ display: "flex", gap: 60 }}>
        <div style={{ textAlign: "center" }}>
          <Waveform width={400} height={140} amplitude={36 * steadyCancel} color={colors.accentAlt} />
          <div style={{ color: colors.muted, fontSize: 26, marginTop: 8 }}>
            Steady hum — cancels clean
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <Waveform
            width={400}
            height={140}
            amplitude={36 * jaggedCancel}
            color={colors.accent}
            jagged
          />
          <div style={{ color: colors.muted, fontSize: 26, marginTop: 8 }}>
            Voices — leftover squiggle
          </div>
        </div>
      </div>
      <div style={{ padding: "0 90px" }}>
        <TextReveal fontSize={44} delay={20} style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

export const WaveCancel: React.FC<WaveCancelProps> = ({
  hookText,
  setupText,
  payoffText,
  twistText,
  buttonText,
  audioFile,
  channelName,
}) => {
  const { durationInFrames } = useVideoConfig();

  // Beat timings proportioned by VO word count — fine-tune against the real
  // audio waveform in Remotion Studio before final render.
  const hook = Math.round(durationInFrames * 0.11);
  const setup = Math.round(durationInFrames * 0.23);
  const payoff = Math.round(durationInFrames * 0.27);
  const twist = Math.round(durationInFrames * 0.3);
  const button = durationInFrames - hook - setup - payoff - twist;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      {audioFile ? <Audio src={staticFile(audioFile)} /> : null}

      <Sequence from={0} durationInFrames={hook}>
        <HookScene text={hookText} />
      </Sequence>
      <Sequence from={hook} durationInFrames={setup}>
        <SetupScene text={setupText} />
      </Sequence>
      <Sequence from={hook + setup} durationInFrames={payoff}>
        <PayoffScene text={payoffText} durationInFrames={payoff} />
      </Sequence>
      <Sequence from={hook + setup + payoff} durationInFrames={twist}>
        <TwistScene text={twistText} durationInFrames={twist} />
      </Sequence>
      <Sequence from={hook + setup + payoff + twist} durationInFrames={button}>
        <EndCardScene text={buttonText} />
      </Sequence>

      <ChannelWatermark text={channelName} />
    </AbsoluteFill>
  );
};
