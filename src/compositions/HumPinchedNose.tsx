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
import { HeadCutaway } from "../components/HeadCutaway";

export type HumPinchedNoseProps = {
  hookText: string;
  setupText: string;
  payoffText: string;
  bonusText: string;
  buttonText: string;
  endText: string;
  audioFile?: string;
  channelName?: string;
};

const defaultProps: HumPinchedNoseProps = {
  hookText: "Hook text goes here",
  setupText: "Setup beat text goes here",
  payoffText: "Payoff beat text goes here",
  bonusText: "Bonus beat text goes here",
  buttonText: "Button line goes here",
  endText: "End card text goes here",
};

// Scene start times in seconds, aligned to the `say` voiceover clips
// (assets/audio/005-hum-pinched-nose.m4a): hook, setup, payoff, bonus, button, end card.
const FPS = 30;
const STARTS = [0, 5.5, 13.8, 22.5, 30.6, 35.6].map((s) => Math.round(s * FPS));
const TOTAL_FRAMES = 38 * FPS;

// "Why can't you hum with your nose pinched?" explainer: hum-then-pinch hook ->
// airflow setup -> blocked-exit payoff -> "by dose" bonus -> speaker-port button.
export const HumPinchedNoseComposition = () => {
  return (
    <Composition
      id="HumPinchedNose"
      component={HumPinchedNose}
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

// Small callout drawn in the head's own coordinate space.
const Callout: React.FC<{
  from: [number, number];
  to: [number, number];
  text: string;
  appear: number;
  color?: string;
}> = ({ from, to, text, appear, color = colors.accentAlt }) => {
  if (appear <= 0) return null;
  const tx = to[0] < from[0] ? to[0] : to[0];
  return (
    <g opacity={appear}>
      <line
        x1={from[0]}
        y1={from[1]}
        x2={from[0] + (to[0] - from[0]) * appear}
        y2={from[1] + (to[1] - from[1]) * appear}
        stroke={color}
        strokeWidth={4}
        strokeDasharray="8 6"
      />
      <text
        x={tx}
        y={to[1] + (to[1] > from[1] ? 34 : -14)}
        textAnchor="middle"
        fontSize={34}
        fontWeight={800}
        fill={color}
      >
        {text}
      </text>
    </g>
  );
};

const VolumeMeter: React.FC<{ level: number }> = ({ level }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-end", height: 120 }}>
      {Array.from({ length: 9 }, (_, i) => {
        const wobble = 0.55 + 0.45 * Math.sin(frame / 3 + i * 1.7);
        const h = 10 + level * wobble * 110;
        return (
          <div
            key={i}
            style={{
              width: 22,
              height: h,
              borderRadius: 8,
              background: level > 0.15 ? colors.accentAlt : colors.muted,
              opacity: level > 0.15 ? 1 : 0.5,
            }}
          />
        );
      })}
    </div>
  );
};

const HookScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pinchAt = 98;
  const pinch = ramp(frame, pinchAt, pinchAt + 10);
  const sound = 1 - ramp(frame, pinchAt + 6, pinchAt + 16);
  const intro = spring({ frame, fps, config: { damping: 12, mass: 0.7 } });
  const shake = pinch > 0 && pinch < 1 ? Math.sin(frame * 3) * 6 : 0;
  const qStamp = spring({
    frame: Math.max(0, frame - (pinchAt + 22)),
    fps,
    config: { damping: 8, mass: 0.5, stiffness: 180 },
  });
  const letters = "HMMMMMM".split("");

  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 110 }}>
      <BackgroundPulse color={colors.accent} size={1100} />
      <div style={{ display: "flex", gap: 4, height: 190, alignItems: "center" }}>
        {letters.map((l, i) => (
          <span
            key={i}
            style={{
              fontSize: 150 * (0.35 + 0.65 * sound),
              fontWeight: 900,
              color: colors.accentAlt,
              opacity: 0.25 + 0.75 * sound,
              display: "inline-block",
              transform: `translateY(${Math.sin(frame / 4 + i) * 14 * sound}px) scale(${intro})`,
            }}
          >
            {l}
          </span>
        ))}
      </div>
      <div style={{ transform: `translateX(${shake}px)`, marginTop: 10 }}>
        <HeadCutaway width={680} pinch={pinch} flow={1} velum={1} cordsGlow={sound * 0.6} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 330,
          right: 110,
          fontSize: 260,
          fontWeight: 900,
          color: colors.accent,
          transform: `scale(${interpolate(qStamp, [0, 1], [2, 1])}) rotate(10deg)`,
          opacity: qStamp,
        }}
      >
        ?
      </div>
      <div style={{ position: "absolute", bottom: 210, padding: "0 90px" }}>
        <TextReveal fontSize={58} delay={20} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

const SetupScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 240], [1, 1.08]);

  // VO: "...lips closed" ~2.3s, "...through your nose" ~5s, "soft palate" ~6.5s.
  const lips = ramp(frame, 68, 84);
  const exitArrow = ramp(frame, 130, 150);
  const palate = ramp(frame, 188, 206);

  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 130 }}>
      <BackgroundPulse color={colors.accentAlt} size={1000} />
      <div style={{ transform: `scale(${zoom})` }}>
        <HeadCutaway
          width={900}
          velum={palate > 0 ? 1 : 0.15 + 0.85 * ramp(frame, 0, 20)}
          lipsGlow={lips * (0.6 + 0.4 * Math.sin(frame / 5))}
          flow={ramp(frame, 20, 50)}
        >
          <Callout from={[500, 466]} to={[560, 560]} text="lips sealed" appear={lips} />
          <Callout
            from={[560, 392]}
            to={[520, 270]}
            text="only exit"
            appear={exitArrow}
            color={colors.foreground}
          />
          <Callout from={[320, 450]} to={[215, 540]} text="soft palate" appear={palate} color={colors.accent} />
        </HeadCutaway>
      </div>
      <div style={{ position: "absolute", bottom: 190, padding: "0 90px" }}>
        <TextReveal fontSize={50} delay={12} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

const PayoffScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  // VO: "Pinch your nose" ~0.3s, "vocal cords still buzzing" ~3.7s, "trapped, and dies" ~6.5s.
  const pinch = ramp(frame, 12, 26);
  const cords = ramp(frame, 100, 115);
  const level = 1 - ramp(frame, 22, 60);
  const pressure = ramp(frame, 26, 200);
  const trapped = ramp(frame, 190, 205);
  const shake = pinch > 0 ? Math.sin(frame * 2.2) * 3 * pressure : 0;

  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 110 }}>
      <BackgroundPulse color={pressure > 0.4 ? colors.accent : colors.accentAlt} size={1000} />
      <div style={{ transform: `translateX(${shake}px)` }}>
        <HeadCutaway
          width={820}
          pinch={pinch}
          velum={1}
          flow={1}
          cordsGlow={cords}
        >
          <Callout from={[548, 350]} to={[590, 170]} text="BLOCKED" appear={pinch} color={colors.accent} />
          <Callout from={[316, 640]} to={[215, 570]} text="buzzing" appear={cords} />
        </HeadCutaway>
      </div>

      {/* Gauges: pressure climbs while the sound level drops to nothing. */}
      <div style={{ display: "flex", gap: 80, marginTop: 10, alignItems: "flex-end" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: colors.muted, fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
            AIR PRESSURE
          </div>
          <div
            style={{
              width: 340,
              height: 30,
              borderRadius: 15,
              background: "#1B1B2E",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pressure * 100}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${colors.accentAlt}, ${colors.accent})`,
              }}
            />
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: colors.muted, fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
            HUM VOLUME
          </div>
          <VolumeMeter level={level} />
        </div>
      </div>

      {trapped > 0 && (
        <div
          style={{
            position: "absolute",
            top: 640,
            left: 90,
            fontSize: 72,
            fontWeight: 900,
            color: colors.accent,
            border: `8px solid ${colors.accent}`,
            borderRadius: 18,
            padding: "4px 26px",
            transform: `rotate(-9deg) scale(${1.6 - 0.6 * trapped})`,
            opacity: trapped,
          }}
        >
          TRAPPED
        </div>
      )}
      <div style={{ position: "absolute", bottom: 150, padding: "0 90px" }}>
        <TextReveal fontSize={46} delay={10} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

// A single letter that flips (rotateX) from `from` to `to` at `flipAt`.
const FlipLetter: React.FC<{ from: string; to: string; flipAt: number }> = ({
  from,
  to,
  flipAt,
}) => {
  const frame = useCurrentFrame();
  const t = ramp(frame, flipAt, flipAt + 12);
  const showTo = t > 0.5;
  const angle = t < 0.5 ? t * 180 : (1 - t) * 180;
  return (
    <span
      style={{
        display: "inline-block",
        textAlign: "center",
        color: showTo ? colors.accentAlt : colors.accent,
        transform: `rotateX(${angle}deg) scale(${1 + Math.sin(t * Math.PI) * 0.25})`,
      }}
    >
      {showTo ? to : from}
    </span>
  );
};

const BonusScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const size = 190;
  // VO: "...M and N are nasal sounds" ~3.7s, "...become B and D" ~6s.
  const flipM = 162;
  const flipN = 176;
  const pop = spring({ frame: Math.max(0, frame - 6), fps, config: { damping: 10, mass: 0.6 } });
  const swapped = ramp(frame, flipN + 8, flipN + 20);
  const pinchIcon = ramp(frame, 14, 30);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 70 }}>
      <BackgroundPulse color={colors.accent} size={1000} />
      <div
        style={{
          color: colors.muted,
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: 4,
          opacity: pinchIcon,
        }}
      >
        STUFFY NOSE? SAY:
      </div>
      <div
        style={{
          fontSize: size,
          fontWeight: 900,
          display: "flex",
          alignItems: "center",
          gap: 0,
          perspective: 800,
          transform: `scale(${pop})`,
        }}
      >
        <FlipLetter from="m" to="b" flipAt={flipM} />
        <span style={{ color: colors.foreground }}>y</span>
        <span style={{ width: size * 0.3 }} />
        <FlipLetter from="n" to="d" flipAt={flipN} />
        <span style={{ color: colors.foreground }}>ose</span>
      </div>
      <div style={{ display: "flex", gap: 60, opacity: ramp(frame, 100, 120) }}>
        {[
          ["M", "B"],
          ["N", "D"],
        ].map(([a, b]) => (
          <div
            key={a}
            style={{
              fontSize: 80,
              fontWeight: 900,
              color: colors.foreground,
              background: "#1B1B2E",
              borderRadius: 24,
              padding: "10px 40px",
            }}
          >
            <span style={{ color: colors.accent }}>{a}</span>
            <span style={{ color: colors.muted }}> → </span>
            <span style={{ color: colors.accentAlt }}>{b}</span>
          </div>
        ))}
      </div>
      <div
        style={{
          fontSize: 44,
          color: colors.accentAlt,
          fontWeight: 800,
          opacity: swapped,
        }}
      >
        nasal sounds need an open nose
      </div>
      <div style={{ padding: "0 90px" }}>
        <TextReveal fontSize={44} delay={8} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

const SpeakerPortScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 12, mass: 0.7 } });
  // VO: "...speaker port" ~2.5s, "Pinch it, and you've muted yourself" ~4s.
  const pinch = ramp(frame, 82, 96);
  const waves = 1 - pinch;
  const mute = ramp(frame, 100, 112);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 70 }}>
      <BackgroundPulse color={colors.accentAlt} size={1000} />
      <svg width={760} height={520} viewBox="0 0 760 520" style={{ transform: `scale(${intro})` }}>
        {/* Speaker body with the nose as its port */}
        <rect x="40" y="60" width="360" height="400" rx="40" fill="#1B1B2E" stroke={colors.foreground} strokeOpacity={0.5} strokeWidth={5} />
        <circle cx="220" cy="270" r="110" fill={colors.background} stroke={colors.accent} strokeWidth={8} />
        <circle
          cx="220"
          cy="270"
          r={55 + Math.sin(frame / 2) * 8 * waves}
          fill={colors.accent}
        />
        <circle cx="220" cy="120" r="22" fill={colors.accentAlt} />
        {/* Port tube out the front, like a nose */}
        <path d="M 400 330 L 520 330 Q 560 330 560 370 L 560 400" fill="none" stroke={colors.accentAlt} strokeWidth={26} strokeLinecap="round" />
        {/* Sound waves leaving the port */}
        {[0, 1, 2].map((i) => {
          const p = ((frame / 30 + i / 3) % 1) * waves;
          return (
            <path
              key={i}
              d="M 590 340 Q 630 380 590 420"
              fill="none"
              stroke={colors.accentAlt}
              strokeWidth={8}
              strokeLinecap="round"
              opacity={Math.sin(p * Math.PI)}
              transform={`translate(${p * 90} 0)`}
            />
          );
        })}
        {/* Pinching fingers */}
        <g opacity={pinch}>
          <rect x="500" y={290 - (1 - pinch) * 50} width="130" height="36" rx="18" fill="#F2B38C" />
          <rect x="500" y={366 + (1 - pinch) * 50} width="130" height="36" rx="18" fill="#E8A27C" />
        </g>
        {mute > 0 && (
          <g opacity={mute} transform={`translate(560 130) scale(${0.6 + mute * 0.4})`}>
            <circle r="60" fill={colors.accent} />
            <line x1="-30" y1="-30" x2="30" y2="30" stroke={colors.foreground} strokeWidth="10" strokeLinecap="round" />
            <line x1="30" y1="-30" x2="-30" y2="30" stroke={colors.foreground} strokeWidth="10" strokeLinecap="round" />
          </g>
        )}
      </svg>
      <div style={{ padding: "0 90px" }}>
        <TextReveal fontSize={58} delay={8} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

export const HumPinchedNose: React.FC<HumPinchedNoseProps> = ({
  hookText,
  setupText,
  payoffText,
  bonusText,
  buttonText,
  endText,
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
        <SpeakerPortScene text={buttonText} />
      </Sequence>
      <Sequence from={STARTS[5]} durationInFrames={dur(5)}>
        <EndCardScene text={endText} />
      </Sequence>

      <ChannelWatermark text={channelName} />
    </AbsoluteFill>
  );
};
