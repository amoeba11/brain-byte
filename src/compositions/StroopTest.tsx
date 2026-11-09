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

export type InkName = "red" | "blue" | "green" | "yellow";
export type StroopWord = { word: string; ink: InkName };
export type StroopRound = { label: string; sub: string; words: StroopWord[] };

export type StroopTestProps = {
  hookText: string;
  commentText: string;
  /** The five narrated sentences of the "why" beat, in order. */
  explainLines: string[];
  stroopText: string;
  buttonText: string;
  rounds: StroopRound[];
  audioFile?: string;
  channelName?: string;
};

const defaultProps: StroopTestProps = {
  hookText: "Hook text goes here",
  commentText: "Comment prompt goes here",
  explainLines: ["Line 1", "Line 2", "Line 3", "Line 4", "Line 5"],
  stroopText: "Stroop beat text goes here",
  buttonText: "Button line goes here",
  rounds: [
    { label: "ROUND 1", sub: "SLOW", words: [{ word: "BLUE", ink: "red" }] },
  ],
};

const FPS = 30;

// Scene start times in seconds: hook, rounds, comment, why (the fight), Stroop
// name-drop, end card. Aligned to the `say` voiceover clips mixed into
// assets/audio/012-stroop-test.m4a.
const STARTS_S = [0, 3.75, 20.95, 24.1, 33.4, 37.4];
const STARTS = STARTS_S.map((s) => Math.round(s * FPS));
const TOTAL_FRAMES = Math.round(40.8 * FPS);

// Round k's first word appears at ROUND_START_S[k], one word every STEP_S[k].
const ROUND_START_S = [3.75, 10.9, 17.3];
const STEP_S = [1.5, 1.0, 0.6];

// When each "why" sentence is spoken, in seconds relative to the why scene.
const EXPLAIN_CUES_S = [0.1, 1.3, 2.85, 5.75, 7.8];

const DARK = "#0B0B14";
const RED = "#FF3B3B";
const TEAL = "#19E0F0";
const GOLD = colors.accentAlt;

const INK: Record<InkName, string> = {
  red: "#FF3B3B",
  blue: "#3B8BFF",
  green: "#2ED573",
  yellow: "#FFD23F",
};

// "Say the color, not the word" Stroop self-test: hook -> three rounds that
// speed up -> comment bait -> reading vs. naming fight -> the 1935 name-drop ->
// end card.
export const StroopTestComposition = () => {
  return (
    <Composition
      id="StroopTest"
      component={StroopTest}
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

const BigWord: React.FC<{ word: string; color: string; size?: number; scale?: number }> = ({
  word,
  color,
  size = 210,
  scale = 1,
}) => (
  <div
    style={{
      fontSize: size,
      fontWeight: 900,
      letterSpacing: 4,
      color,
      transform: `scale(${scale})`,
      whiteSpace: "nowrap",
    }}
  >
    {word}
  </div>
);

const HookScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const goAt = Math.round(3.2 * FPS);
  return (
    <AbsoluteFill style={{ backgroundColor: DARK, alignItems: "center" }}>
      <BackgroundPulse color={colors.accent} size={900} />
      <div style={{ position: "absolute", top: 220, padding: "0 80px" }}>
        <TextReveal fontSize={74} delay={4} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
      <div
        style={{
          position: "absolute",
          top: 760,
          opacity: ramp(frame, 14, 24),
        }}
      >
        <BigWord word="BLUE" color={INK.red} size={300} scale={1 + 0.15 * (1 - ramp(frame, 14, 24))} />
      </div>
      <div style={{ position: "absolute", top: 1400 }}>
        <Stamp
          text={frame < goAt ? "READY?" : "GO!"}
          appear={ramp(frame, Math.round(2.4 * FPS), Math.round(2.4 * FPS) + 8)}
          color={frame < goAt ? GOLD : TEAL}
          size={92}
          rotate={-3}
        />
      </div>
    </AbsoluteFill>
  );
};

const RoundsScene: React.FC<{ rounds: StroopRound[] }> = ({ rounds }) => {
  const frame = useCurrentFrame();
  const t = STARTS_S[1] + frame / FPS;

  // Which round are we in (words on screen), or between rounds (splash)?
  let activeRound = -1;
  let splashRound = -1;
  for (let r = 0; r < rounds.length; r++) {
    const start = ROUND_START_S[r];
    const end = start + rounds[r].words.length * STEP_S[r];
    if (t >= start && t < end) activeRound = r;
    else if (r > 0 && t >= ROUND_START_S[r - 1] + rounds[r - 1].words.length * STEP_S[r - 1] && t < start) {
      splashRound = r;
    }
  }

  if (activeRound >= 0) {
    const round = rounds[activeRound];
    const into = t - ROUND_START_S[activeRound];
    const idx = Math.min(round.words.length - 1, Math.floor(into / STEP_S[activeRound]));
    const within = (into - idx * STEP_S[activeRound]) / STEP_S[activeRound];
    const localFrame = Math.round((into - idx * STEP_S[activeRound]) * FPS);
    const w = round.words[idx];
    return (
      <AbsoluteFill style={{ backgroundColor: DARK, alignItems: "center" }}>
        <div style={{ position: "absolute", top: 200, textAlign: "center" }}>
          <div style={{ fontSize: 96, fontWeight: 900, color: colors.foreground }}>{round.label}</div>
          <div style={{ fontSize: 56, fontWeight: 900, color: GOLD, letterSpacing: 6 }}>{round.sub}</div>
        </div>
        <div style={{ position: "absolute", top: 760 }}>
          <BigWord word={w.word} color={INK[w.ink]} size={270} scale={1 + 0.12 * (1 - ramp(localFrame, 0, 4))} />
        </div>
        <div style={{ position: "absolute", top: 1200 }}>
          <div style={{ width: 560, height: 22, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.15)" }}>
            <div
              style={{
                width: `${(1 - within) * 100}%`,
                height: "100%",
                borderRadius: 11,
                backgroundColor: TEAL,
              }}
            />
          </div>
        </div>
        <div style={{ position: "absolute", top: 1330, display: "flex", gap: 24 }}>
          {round.words.map((_, i) => (
            <div
              key={i}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: i <= idx ? GOLD : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
      </AbsoluteFill>
    );
  }

  const splash = splashRound >= 0 ? rounds[splashRound] : null;
  const splashStart =
    splashRound >= 0
      ? ROUND_START_S[splashRound - 1] + rounds[splashRound - 1].words.length * STEP_S[splashRound - 1]
      : 0;
  const sf = Math.round((t - splashStart) * FPS);
  return (
    <AbsoluteFill style={{ backgroundColor: DARK, alignItems: "center", justifyContent: "center" }}>
      <BackgroundPulse color={colors.accent} size={900} />
      {splash ? (
        <div style={{ textAlign: "center", transform: `scale(${1.3 - 0.3 * ramp(sf, 0, 6)})`, opacity: ramp(sf, 0, 4) }}>
          <div style={{ fontSize: 150, fontWeight: 900, color: colors.foreground }}>{splash.label}</div>
          <div style={{ fontSize: 110, fontWeight: 900, color: GOLD, letterSpacing: 8 }}>{splash.sub}</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const CommentScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const badgeColors = [TEAL, GOLD, RED];
  return (
    <AbsoluteFill style={{ backgroundColor: DARK, alignItems: "center" }}>
      <BackgroundPulse color={colors.accent} size={900} />
      <div style={{ position: "absolute", top: 260 }}>
        <Stamp text="TIME'S UP" appear={ramp(frame, 3, 14)} color={RED} size={104} rotate={-3} />
      </div>
      <div style={{ position: "absolute", top: 640, display: "flex", gap: 50 }}>
        {[1, 2, 3].map((n, i) => {
          const a = ramp(frame, 12 + i * 6, 22 + i * 6);
          return (
            <div
              key={n}
              style={{
                width: 250,
                height: 250,
                borderRadius: 125,
                border: `12px solid ${badgeColors[i]}`,
                color: badgeColors[i],
                fontSize: 170,
                fontWeight: 900,
                lineHeight: "226px",
                textAlign: "center",
                opacity: a,
                transform: `scale(${1.5 - 0.5 * a})`,
              }}
            >
              {n}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 1100, padding: "0 80px" }}>
        <TextReveal fontSize={66} delay={24} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

const Lane: React.FC<{
  top: number;
  label: string;
  sub: string;
  color: string;
  appear: number;
  fill: number;
}> = ({ top, label, sub, color, appear, fill }) => (
  <div style={{ position: "absolute", top, width: 880, opacity: appear, transform: `translateY(${(1 - appear) * 30}px)` }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <div style={{ fontSize: 52, fontWeight: 900, color: colors.foreground }}>{label}</div>
      <div style={{ fontSize: 40, fontWeight: 800, color }}>{sub}</div>
    </div>
    <div style={{ marginTop: 14, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.15)" }}>
      <div style={{ width: `${fill * 100}%`, height: "100%", borderRadius: 22, backgroundColor: color }} />
    </div>
  </div>
);

const Bubble: React.FC<{ text: string; color: string; appear: number; shake: number }> = ({
  text,
  color,
  appear,
  shake,
}) => {
  if (appear <= 0) return null;
  return (
    <div
      style={{
        fontSize: 92,
        fontWeight: 900,
        color,
        border: `8px solid ${color}`,
        borderRadius: 28,
        padding: "6px 30px",
        opacity: appear,
        transform: `translateX(${shake}px) scale(${1.4 - 0.4 * appear})`,
      }}
    >
      {text}
    </div>
  );
};

// Why it happens: reading is automatic and fast, naming the ink color is slow
// and effortful, so the faster one barges in and the two collide.
const FightScene: React.FC<{ lines: string[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const s = frame / FPS;
  const cues = EXPLAIN_CUES_S.map((c) => Math.round(c * FPS));
  let current = 0;
  cues.forEach((c, i) => {
    if (frame >= c) current = i;
  });

  const fight = s >= EXPLAIN_CUES_S[4];
  const shake = fight ? Math.sin(frame * 1.7) * 9 : 0;
  const readFill = ramp(s, 1.4, 1.9);
  const nameFill = ramp(s, 5.85, 7.65);

  return (
    <AbsoluteFill style={{ backgroundColor: DARK, alignItems: "center" }}>
      <BackgroundPulse color={colors.accent} size={900} />
      <div style={{ position: "absolute", top: 170 }}>
        <BigWord word="BLUE" color={INK.red} size={230} />
      </div>
      <Lane
        top={540}
        label="READING THE WORD"
        sub="automatic"
        color={TEAL}
        appear={ramp(s, 1.3, 1.5)}
        fill={readFill}
      />
      <Lane
        top={780}
        label="NAMING THE COLOR"
        sub="effortful"
        color={INK.red}
        appear={ramp(s, 5.75, 5.95)}
        fill={nameFill}
      />
      <div style={{ position: "absolute", top: 1070, display: "flex", alignItems: "center", gap: 36 }}>
        <Bubble text={'"BLUE"'} color={TEAL} appear={ramp(s, 2.0, 2.25)} shake={shake} />
        {fight ? (
          <div style={{ fontSize: 60, fontWeight: 900, color: GOLD, opacity: ramp(s, 7.8, 8.0) }}>VS</div>
        ) : null}
        <Bubble text={'"RED"'} color={INK.red} appear={ramp(s, 7.45, 7.7)} shake={-shake} />
      </div>
      <div style={{ position: "absolute", top: 1260 }}>
        <Stamp text="TRAFFIC JAM" appear={ramp(s, 8.0, 8.4)} color={GOLD} size={84} rotate={-3} />
      </div>
      <div style={{ position: "absolute", bottom: 230, padding: "0 90px" }}>
        <TextReveal key={current} fontSize={56} delay={cues[current]} stagger style={{ color: colors.foreground }}>
          {lines[current] ?? ""}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

const StroopScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const year = Math.round(interpolate(frame, [50, 84], [1900, 1935], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <AbsoluteFill style={{ backgroundColor: DARK, alignItems: "center" }}>
      <BackgroundPulse color={colors.accent} size={900} />
      <div style={{ position: "absolute", top: 330 }}>
        <Stamp text="THE STROOP EFFECT" appear={ramp(frame, 3, 14)} color={TEAL} size={78} rotate={-3} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 640,
          fontSize: 290,
          fontWeight: 900,
          color: GOLD,
          transform: `scale(${1 + 0.1 * (1 - ramp(frame, 82, 92))})`,
        }}
      >
        {year}
      </div>
      <div style={{ position: "absolute", bottom: 230, padding: "0 90px" }}>
        <TextReveal fontSize={56} delay={6} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

export const StroopTest: React.FC<StroopTestProps> = ({
  hookText,
  commentText,
  explainLines,
  stroopText,
  buttonText,
  rounds,
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
        <RoundsScene rounds={rounds} />
      </Sequence>
      <Sequence from={STARTS[2]} durationInFrames={dur(2)}>
        <CommentScene text={commentText} />
      </Sequence>
      <Sequence from={STARTS[3]} durationInFrames={dur(3)}>
        <FightScene lines={explainLines} />
      </Sequence>
      <Sequence from={STARTS[4]} durationInFrames={dur(4)}>
        <StroopScene text={stroopText} />
      </Sequence>
      <Sequence from={STARTS[5]} durationInFrames={dur(5)}>
        <EndCardScene text={buttonText} />
      </Sequence>

      <ChannelWatermark text={channelName} />
    </AbsoluteFill>
  );
};
