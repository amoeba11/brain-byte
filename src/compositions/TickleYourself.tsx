import {
  AbsoluteFill,
  Audio,
  Composition,
  Sequence,
  interpolate,
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
import { SpeakerIcon } from "../components/SpeakerIcon";
import { TouchIcon } from "../components/TouchIcon";

export type TickleYourselfProps = {
  hookText: string;
  setupText: string;
  payoffText: string;
  twistText: string;
  buttonText: string;
  audioFile?: string;
  channelName?: string;
};

const defaultProps: TickleYourselfProps = {
  hookText: "Hook text goes here",
  setupText: "Setup beat text goes here",
  payoffText: "Payoff beat text goes here",
  twistText: "Twist beat text goes here",
  buttonText: "Button line goes here",
};

// Generic "predicted vs. unpredicted signal" explainer template: a touch
// icon for the hook/setup, then the same destructive-interference visual
// language as WaveCancel for the prediction-cancels-signal payoff/twist.
// Reusable for any episode about the brain predicting/dampening a sensation.
export const TickleYourselfComposition = () => {
  return (
    <Composition
      id="TickleYourself"
      component={TickleYourself}
      durationInFrames={30 * 33}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
    />
  );
};

const HookScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{ alignItems: "center", justifyContent: "center", gap: 50 }}
    >
      <BackgroundPulse color={colors.accent} />
      <TouchIcon active={frame < 18} color={colors.accentAlt} />
      <TextReveal fontSize={64} delay={16} stagger style={{ color: colors.foreground }}>
        {text}
      </TextReveal>
    </AbsoluteFill>
  );
};

const SetupScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 14) * 6;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 50 }}>
      <BackgroundPulse color={colors.accentAlt} size={900} />
      <div style={{ transform: `translateY(${bob}px)` }}>
        <TouchIcon active={false} color={colors.muted} />
      </div>
      <div style={{ padding: "0 90px" }}>
        <TextReveal fontSize={46} delay={15} stagger style={{ color: colors.foreground }}>
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
      <div style={{ color: colors.muted, fontSize: 26, letterSpacing: 1 }}>
        prediction + actual touch = dampened
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
      <div
        style={{
          display: "flex",
          width: 700,
          justifyContent: "space-between",
          marginTop: -10,
        }}
      >
        <span style={{ color: colors.accentAlt, fontSize: 26 }}>Brain's prediction</span>
        <span style={{ color: colors.accent, fontSize: 26 }}>Your touch</span>
      </div>
      <div style={{ padding: "0 90px", marginTop: 20 }}>
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
  const selfCancel = interpolate(frame, [10, durationInFrames - 50], [1, 0.03], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const otherCancel = interpolate(frame, [10, durationInFrames - 50], [1, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 44 }}>
      <BackgroundPulse color={colors.accentAlt} size={900} />
      <div style={{ display: "flex", gap: 60 }}>
        <div style={{ textAlign: "center" }}>
          <Waveform width={380} height={120} amplitude={36 * selfCancel} color={colors.accentAlt} />
          <div style={{ marginTop: 16 }}>
            <SpeakerIcon level={selfCancel} color={colors.accentAlt} />
          </div>
          <div style={{ color: colors.accentAlt, fontSize: 32, fontWeight: 700, marginTop: 10 }}>
            {Math.round((1 - selfCancel) * 100)}% dampened
          </div>
          <div style={{ color: colors.muted, fontSize: 24, marginTop: 4 }}>Your own touch</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <Waveform
            width={380}
            height={120}
            amplitude={36 * otherCancel}
            color={colors.accent}
            jagged
          />
          <div style={{ marginTop: 16 }}>
            <SpeakerIcon level={otherCancel} color={colors.accent} />
          </div>
          <div style={{ color: colors.accent, fontSize: 32, fontWeight: 700, marginTop: 10 }}>
            {Math.round((1 - otherCancel) * 100)}% dampened
          </div>
          <div style={{ color: colors.muted, fontSize: 24, marginTop: 4 }}>Someone else's touch</div>
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

export const TickleYourself: React.FC<TickleYourselfProps> = ({
  hookText,
  setupText,
  payoffText,
  twistText,
  buttonText,
  audioFile,
  channelName,
}) => {
  const { durationInFrames } = useVideoConfig();

  // The end card needs a fixed minimum to actually be readable (its on-screen
  // line is a lingering takeaway, not a 1:1 transcript of the last spoken
  // words) — reserve that first, then split the rest by VO word count per
  // beat (hook 5, setup 11, payoff 40, twist 42 of 98 spoken words).
  const button = Math.max(75, Math.round(durationInFrames * 0.08));
  const remaining = durationInFrames - button;
  const hook = Math.round(remaining * (5 / 98));
  const setup = Math.round(remaining * (11 / 98));
  const payoff = Math.round(remaining * (40 / 98));
  const twist = remaining - hook - setup - payoff;

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
