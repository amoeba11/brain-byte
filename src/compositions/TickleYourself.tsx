import {
  AbsoluteFill,
  Audio,
  Composition,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { colors } from "../themes/colors";
import { TextReveal } from "../components/TextReveal";
import { BackgroundPulse } from "../components/BackgroundPulse";
import { ChannelWatermark } from "../components/ChannelWatermark";
import { EndCardScene } from "../components/EndCardScene";
import { TouchReaction } from "../components/TouchReaction";
import { TickleAttempt } from "../components/TickleAttempt";

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
// icon for the hook/setup, then a nerve-pathway visual (a touch pulse and a
// prediction pulse traveling toward each other and canceling) for the
// payoff/twist. Reusable for any episode about the brain predicting or
// being surprised by a sensation.
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

// The hook: an animated figure actually reaching in to tickle itself, with
// nothing happening — literal and immediately legible, rather than an
// abstract icon.
const HookScene: React.FC<{ text: string }> = ({ text }) => (
  <AbsoluteFill
    style={{ alignItems: "center", justifyContent: "center", gap: 30 }}
  >
    <BackgroundPulse color={colors.accent} />
    <TickleAttempt color={colors.accentAlt} size={300} />
    <TextReveal fontSize={74} delay={16} stagger style={{ color: colors.foreground }}>
      {text}
    </TextReveal>
  </AbsoluteFill>
);

const SetupScene: React.FC<{ text: string }> = ({ text }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
    <BackgroundPulse color={colors.accentAlt} size={900} />
    <TickleAttempt color={colors.muted} size={270} />
    <div style={{ padding: "0 90px" }}>
      <TextReveal fontSize={52} delay={15} stagger style={{ color: colors.foreground }}>
        {text}
      </TextReveal>
    </div>
  </AbsoluteFill>
);

// Shows the outcome directly: a ripple that instantly gets squashed
// (dampened) vs. one that keeps expanding (registers) — no internal
// mechanism to decode, just the before/after you can read in half a second.
const PayoffScene: React.FC<{ text: string }> = ({ text }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
    <BackgroundPulse color={colors.accent} />
    <div style={{ color: colors.muted, fontSize: 29, letterSpacing: 1 }}>predicted → dampened</div>
    <TouchReaction canceled color={colors.accentAlt} size={280} />
    <div style={{ padding: "0 90px", marginTop: 10 }}>
      <TextReveal fontSize={52} delay={10} style={{ color: colors.foreground }}>
        {text}
      </TextReveal>
    </div>
  </AbsoluteFill>
);

const TwistScene: React.FC<{ text: string }> = ({ text }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
    <BackgroundPulse color={colors.accentAlt} size={900} />
    <div style={{ display: "flex", gap: 50 }}>
      <div style={{ textAlign: "center" }}>
        <TouchReaction canceled color={colors.accentAlt} size={220} />
        <div style={{ color: colors.accentAlt, fontSize: 34, fontWeight: 700, marginTop: 8 }}>
          Dampened
        </div>
        <div style={{ color: colors.muted, fontSize: 25, marginTop: 4 }}>Your own touch</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <TouchReaction canceled={false} color={colors.accent} size={220} />
        <div style={{ color: colors.accent, fontSize: 34, fontWeight: 700, marginTop: 8 }}>
          Registers
        </div>
        <div style={{ color: colors.muted, fontSize: 25, marginTop: 4 }}>Someone else's touch</div>
      </div>
    </div>
    <div style={{ padding: "0 90px" }}>
      <TextReveal fontSize={50} delay={20} style={{ color: colors.foreground }}>
        {text}
      </TextReveal>
    </div>
  </AbsoluteFill>
);

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
        <PayoffScene text={payoffText} />
      </Sequence>
      <Sequence from={hook + setup + payoff} durationInFrames={twist}>
        <TwistScene text={twistText} />
      </Sequence>
      <Sequence from={hook + setup + payoff + twist} durationInFrames={button}>
        <EndCardScene text={buttonText} />
      </Sequence>

      <ChannelWatermark text={channelName} />
    </AbsoluteFill>
  );
};
