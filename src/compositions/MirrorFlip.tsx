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
import { StickFigure } from "../components/StickFigure";
import { BackgroundPulse } from "../components/BackgroundPulse";
import { ChannelWatermark } from "../components/ChannelWatermark";

export type MirrorFlipProps = {
  hookText: string;
  setupText: string;
  flipExplainText: string;
  turnAroundText: string;
  buttonText: string;
  /** Path relative to the public dir (e.g. "audio/my-episode.m4a"); omit for silent preview. */
  audioFile?: string;
  /** Channel name/handle shown as a subtle corner watermark + on the end card; omit for none. */
  channelName?: string;
};

const defaultProps: MirrorFlipProps = {
  hookText: "Hook text goes here",
  setupText: "Setup beat text goes here",
  flipExplainText: "Explainer beat text goes here",
  turnAroundText: "Contrast beat text goes here",
  buttonText: "Button line goes here",
};

// Generic "mirror demo" explainer template: hook -> raise-hand setup ->
// depth-flip diagram -> turn-around contrast -> button. Reusable for any
// episode built around this beat structure; the actual script/audio for a
// specific episode is passed in via props (see episodes/<slug>/ locally).
export const MirrorFlipComposition = () => {
  return (
    <Composition
      id="MirrorFlip"
      component={MirrorFlip}
      durationInFrames={30 * 34}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
    />
  );
};

const MirrorLine: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: "10%",
      bottom: "10%",
      left: "50%",
      width: 4,
      backgroundColor: colors.accent,
      opacity: 0.6,
    }}
  />
);

const MirrorQuestionIcon: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 9, mass: 0.7 } });
  const scale = interpolate(pop, [0, 1], [0, 1]);
  const wiggle = Math.sin(frame / 10) * 6;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          fontSize: 140,
          fontWeight: 800,
          color: colors.accentAlt,
          transform: `rotate(${wiggle}deg)`,
        }}
      >
        ?
      </div>
      <div
        style={{
          width: 4,
          height: 130,
          backgroundColor: colors.accent,
          opacity: 0.7,
        }}
      />
      <div
        style={{
          fontSize: 140,
          fontWeight: 800,
          color: colors.accent,
          transform: `scaleX(-1) rotate(${-wiggle}deg)`,
        }}
      >
        ?
      </div>
    </div>
  );
};

const HookScene: React.FC<{ text: string }> = ({ text }) => (
  <AbsoluteFill
    style={{
      alignItems: "center",
      justifyContent: "center",
      padding: 100,
      gap: 50,
    }}
  >
    <BackgroundPulse color={colors.accent} />
    <MirrorQuestionIcon />
    <TextReveal fontSize={68} delay={14} stagger style={{ color: colors.foreground }}>
      {text}
    </TextReveal>
  </AbsoluteFill>
);

const SetupScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const bobLeft = Math.sin(frame / 14) * 8;
  const bobRight = Math.sin(frame / 14 + Math.PI) * 8;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <BackgroundPulse color={colors.accentAlt} size={900} />
      <MirrorLine />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
          position: "relative",
        }}
      >
        <div style={{ transform: `translateY(${bobLeft}px)` }}>
          <StickFigure raisedArm="right" />
        </div>
        <div style={{ transform: `translateY(${bobRight}px)` }}>
          <StickFigure raisedArm="right" mirrored highlightColor={colors.accent} />
        </div>
      </div>
      <div style={{ position: "absolute", bottom: "18%", padding: "0 80px" }}>
        <TextReveal fontSize={44} delay={20} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

const DistanceArrow: React.FC<{ side: "left" | "right"; length: number }> = ({
  side,
  length,
}) => (
  <div
    style={{
      position: "absolute",
      top: "50%",
      [side]: `calc(50% + 18px)`,
      width: length,
      height: 2,
      backgroundColor: colors.muted,
      transform: "translateY(-50%)",
    }}
  />
);

const FlipExplainScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const dist = interpolate(frame, [0, 40], [0, 130], {
    extrapolateRight: "clamp",
  });
  const bounce = 1 + Math.sin(frame / 12) * 0.06;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <BackgroundPulse color={colors.accent} />
      <div
        style={{
          color: colors.muted,
          fontSize: 28,
          marginBottom: 30,
          letterSpacing: 1,
        }}
      >
        ← same distance, opposite side →
      </div>
      <div
        style={{
          position: "relative",
          width: 600,
          height: 160,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MirrorLine />
        <DistanceArrow side="left" length={dist} />
        <DistanceArrow side="right" length={dist} />
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            backgroundColor: colors.accentAlt,
            position: "absolute",
            left: `calc(50% - ${dist + 42}px)`,
            transform: `scale(${bounce})`,
          }}
        />
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: `3px solid ${colors.accent}`,
            backgroundColor: "transparent",
            position: "absolute",
            left: `calc(50% + ${dist - 6}px)`,
            transform: `scale(${bounce})`,
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          width: 600,
          justifyContent: "space-between",
          marginTop: 12,
        }}
      >
        <span style={{ color: colors.accentAlt, fontSize: 28 }}>You</span>
        <span style={{ color: colors.accent, fontSize: 28 }}>Reflection</span>
      </div>
      <div style={{ marginTop: 50 }}>
        <TextReveal
          fontSize={44}
          delay={10}
          style={{ color: colors.foreground, padding: "0 90px" }}
        >
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

const TurnAroundScene: React.FC<{ text: string; durationInFrames: number }> = ({
  text,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const rotation = interpolate(frame, [20, durationInFrames - 40], [0, 180], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ alignItems: "center", justifyContent: "center", gap: 60 }}
    >
      <BackgroundPulse color={colors.accentAlt} size={900} />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 100,
          alignItems: "flex-end",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <StickFigure raisedArm="right" mirrored highlightColor={colors.accent} />
          <div style={{ color: colors.muted, fontSize: 28, marginTop: 12 }}>
            Reflection — never turns
          </div>
        </div>
        <div style={{ textAlign: "center", perspective: 800 }}>
          <div style={{ transform: `rotateY(${rotation}deg)` }}>
            <StickFigure raisedArm="right" highlightColor={colors.accentAlt} />
          </div>
          <div style={{ color: colors.muted, fontSize: 28, marginTop: 12 }}>
            You, turning around
          </div>
        </div>
      </div>
      <TextReveal
        fontSize={44}
        delay={30}
        style={{ color: colors.foreground, padding: "0 90px" }}
      >
        {text}
      </TextReveal>
    </AbsoluteFill>
  );
};

const ButtonScene: React.FC<{ text: string }> = ({ text }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <BackgroundPulse color={colors.accent} />
    <TextReveal fontSize={60} stagger style={{ color: colors.foreground }}>
      {text}
    </TextReveal>
    <div style={{ marginTop: 40 }}>
      <TextReveal
        fontSize={32}
        delay={25}
        style={{ color: colors.accentAlt, fontWeight: 500 }}
      >
        Follow for more
      </TextReveal>
    </div>
  </AbsoluteFill>
);

export const MirrorFlip: React.FC<MirrorFlipProps> = ({
  hookText,
  setupText,
  flipExplainText,
  turnAroundText,
  buttonText,
  audioFile,
  channelName,
}) => {
  const { durationInFrames } = useVideoConfig();

  // Beat timings are proportioned by VO word count — fine-tune against the
  // real audio waveform in Remotion Studio before final render.
  const hook = Math.round(durationInFrames * 0.12);
  const setup = Math.round(durationInFrames * 0.25);
  const flip = Math.round(durationInFrames * 0.22);
  const turnAround = Math.round(durationInFrames * 0.35);
  const button = durationInFrames - hook - setup - flip - turnAround;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      {audioFile ? <Audio src={staticFile(audioFile)} /> : null}

      <Sequence from={0} durationInFrames={hook}>
        <HookScene text={hookText} />
      </Sequence>
      <Sequence from={hook} durationInFrames={setup}>
        <SetupScene text={setupText} />
      </Sequence>
      <Sequence from={hook + setup} durationInFrames={flip}>
        <FlipExplainScene text={flipExplainText} />
      </Sequence>
      <Sequence from={hook + setup + flip} durationInFrames={turnAround}>
        <TurnAroundScene text={turnAroundText} durationInFrames={turnAround} />
      </Sequence>
      <Sequence from={hook + setup + flip + turnAround} durationInFrames={button}>
        <ButtonScene text={buttonText} />
      </Sequence>

      <ChannelWatermark text={channelName} />
    </AbsoluteFill>
  );
};
