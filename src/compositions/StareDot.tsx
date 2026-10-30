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

export type StareDotProps = {
  hookText: string;
  stareText: string;
  revealText: string;
  payoffText: string;
  bonusText: string;
  buttonText: string;
  audioFile?: string;
  channelName?: string;
};

const defaultProps: StareDotProps = {
  hookText: "Hook text goes here",
  stareText: "Stare beat text goes here",
  revealText: "Reveal beat text goes here",
  payoffText: "Payoff beat text goes here",
  bonusText: "Bonus beat text goes here",
  buttonText: "Button line goes here",
};

// Scene start times in seconds: hook, stare, reveal, payoff, bonus, button (the
// button scene doubles as the end card). Aligned to the `say` voiceover clips
// (assets/audio/008-stare-at-the-dot.m4a).
const FPS = 30;
const STARTS = [0, 6.77, 17.77, 22.77, 33.82, 41.62].map((s) => Math.round(s * FPS));
const TOTAL_FRAMES = 48 * FPS;

const GRAY = "#8C8C8C";
const FACE_BLUE = "#2F3BFF";
const YELLOW = "#FFD400";
const RED = "#FF3B3B";
const CYAN = "#19E0F0";
const GREEN = "#2FD35A";
const PINK = "#FF4FB8";

// "Stare at the dot" afterimage explainer: still blue face + countdown ->
// plain white reveal -> tired-cone payoff -> opposite-colors bonus -> shared
// end card.
export const StareDotComposition = () => {
  return (
    <Composition
      id="StareDot"
      component={StareDot}
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

// Saturated blue smiley with a black-and-white fixation dot on its nose. Eyes
// and mouth are black so they leave a light ghost on the viewer's retina.
const Face: React.FC<{ size?: number }> = ({ size = 700 }) => (
  <svg width={size} height={size} viewBox="0 0 700 700">
    <circle cx="350" cy="350" r="330" fill={FACE_BLUE} />
    <ellipse cx="240" cy="260" rx="46" ry="62" fill="#000" />
    <ellipse cx="460" cy="260" rx="46" ry="62" fill="#000" />
    <path d="M 190 470 Q 350 600 510 470" fill="none" stroke="#000" strokeWidth={36} strokeLinecap="round" />
    <circle cx="350" cy="370" r="30" fill="#fff" />
    <circle cx="350" cy="370" r="14" fill="#000" />
  </svg>
);

const StareBackdrop: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ backgroundColor: GRAY, alignItems: "center" }}>
    <div style={{ position: "absolute", top: 380 }}>
      <Face />
    </div>
    {children}
  </AbsoluteFill>
);

const HookScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const label = ramp(frame, 10, 22);
  return (
    <StareBackdrop>
      <div style={{ position: "absolute", top: 160, opacity: label }}>
        <Stamp text="STARE AT THE DOT" appear={label} color="#000" size={72} rotate={-2} />
      </div>
      <div style={{ position: "absolute", bottom: 240, padding: "0 90px" }}>
        <TextReveal fontSize={54} delay={10} stagger style={{ color: "#000" }}>
          {text}
        </TextReveal>
      </div>
    </StareBackdrop>
  );
};

const StareScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const count = Math.max(1, 10 - Math.floor(Math.max(0, frame - 20) / 30));
  const tick = (Math.max(0, frame - 20) % 30) / 30;
  return (
    <StareBackdrop>
      <div style={{ position: "absolute", top: 160 }}>
        <Stamp text="DON'T LOOK AWAY" appear={1} color="#000" size={72} rotate={-2} />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 330,
          fontSize: 190,
          fontWeight: 900,
          color: "#000",
          transform: `scale(${1 + 0.18 * (1 - tick)})`,
        }}
      >
        {frame >= 20 ? count : ""}
      </div>
      <div style={{ position: "absolute", bottom: 220, padding: "0 90px" }}>
        <TextReveal fontSize={50} delay={4} stagger style={{ color: "#000" }}>
          {text}
        </TextReveal>
      </div>
    </StareBackdrop>
  );
};

// Plain white with nothing else on screen so the afterimage lands on blank
// space; only a small prompt low down.
const RevealScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const label = ramp(frame, 30, 44);
  return (
    <AbsoluteFill style={{ backgroundColor: "#fff", alignItems: "center" }}>
      <div style={{ position: "absolute", bottom: 220, padding: "0 90px", opacity: label }}>
        <TextReveal fontSize={46} delay={30} stagger style={{ color: "#444" }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

const Cone: React.FC<{ color: string; label: string; tired: number }> = ({ color, label, tired }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
    <div
      style={{
        width: 200,
        height: 200,
        borderRadius: "50%",
        background: color,
        opacity: 1 - 0.8 * tired,
        boxShadow: tired < 0.5 ? `0 0 60px ${color}` : "none",
      }}
    />
    <div style={{ fontSize: 40, fontWeight: 900, color: colors.foreground }}>{label}</div>
  </div>
);

const PayoffScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 12, mass: 0.7 } });
  const tired = ramp(frame, 40, 130);
  const white = ramp(frame, 190, 204);
  const result = ramp(frame, 250, 264);
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <BackgroundPulse color={colors.accent} size={1000} />
      <div style={{ position: "absolute", top: 240, display: "flex", gap: 60, transform: `scale(${intro})` }}>
        <Cone color={FACE_BLUE} label="BLUE" tired={tired} />
        <Cone color={GREEN} label="GREEN" tired={0} />
        <Cone color={RED} label="RED" tired={0} />
      </div>
      <div style={{ position: "absolute", top: 600 }}>
        <Stamp text="BLUE CELLS TIRED" appear={ramp(frame, 100, 114)} color={colors.accentAlt} size={64} rotate={-3} />
      </div>
      <div style={{ position: "absolute", top: 800 }}>
        <Stamp text="WHITE LIGHT ARRIVES" appear={white} color="#fff" size={58} rotate={2} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 1000,
          width: 360,
          height: 200,
          borderRadius: 30,
          background: YELLOW,
          opacity: result,
          transform: `scale(${0.6 + 0.4 * result})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 72,
          fontWeight: 900,
          color: "#000",
        }}
      >
        YELLOW
      </div>
      <div style={{ position: "absolute", bottom: 180, padding: "0 90px" }}>
        <TextReveal fontSize={46} delay={10} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

const Swatch: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div
    style={{
      width: 300,
      height: 200,
      borderRadius: 30,
      background: color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 52,
      fontWeight: 900,
      color: "#000",
    }}
  >
    {label}
  </div>
);

const PairRow: React.FC<{
  from: [string, string];
  to: [string, string];
  appear: number;
}> = ({ from, to, appear }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 40,
      opacity: appear,
      transform: `translateY(${(1 - appear) * 40}px)`,
    }}
  >
    <Swatch color={from[0]} label={from[1]} />
    <div style={{ fontSize: 90, fontWeight: 900, color: colors.foreground }}>→</div>
    <Swatch color={to[0]} label={to[1]} />
  </div>
);

const BonusScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <BackgroundPulse color={colors.accentAlt} size={1000} />
      <div style={{ position: "absolute", top: 250, fontSize: 56, fontWeight: 900, color: colors.accentAlt }}>
        STARE AT → YOU SEE
      </div>
      <div style={{ position: "absolute", top: 420, display: "flex", flexDirection: "column", gap: 70 }}>
        <PairRow from={[FACE_BLUE, "BLUE"]} to={[YELLOW, "YELLOW"]} appear={ramp(frame, 20, 36)} />
        <PairRow from={[RED, "RED"]} to={[CYAN, "CYAN"]} appear={ramp(frame, 90, 106)} />
        <PairRow from={[GREEN, "GREEN"]} to={[PINK, "PINK"]} appear={ramp(frame, 150, 166)} />
      </div>
      <div style={{ position: "absolute", bottom: 200, padding: "0 90px" }}>
        <TextReveal fontSize={46} delay={8} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

export const StareDot: React.FC<StareDotProps> = ({
  hookText,
  stareText,
  revealText,
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
        <StareScene text={stareText} />
      </Sequence>
      <Sequence from={STARTS[2]} durationInFrames={dur(2)}>
        <RevealScene text={revealText} />
      </Sequence>
      <Sequence from={STARTS[3]} durationInFrames={dur(3)}>
        <PayoffScene text={payoffText} />
      </Sequence>
      <Sequence from={STARTS[4]} durationInFrames={dur(4)}>
        <BonusScene text={bonusText} />
      </Sequence>
      <Sequence from={STARTS[5]} durationInFrames={dur(5)}>
        <EndCardScene text={buttonText} />
      </Sequence>

      <ChannelWatermark text={channelName} />
    </AbsoluteFill>
  );
};
