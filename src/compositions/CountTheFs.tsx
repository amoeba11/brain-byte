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

export type CountTheFsProps = {
  hookText: string;
  countText: string;
  commentText: string;
  answerText: string;
  missText: string;
  skipText: string;
  soundText: string;
  buttonText: string;
  /** The sentence, pre-split into display lines. */
  sentenceLines: string[];
  audioFile?: string;
  channelName?: string;
};

const defaultProps: CountTheFsProps = {
  hookText: "Hook text goes here",
  countText: "Count beat text goes here",
  commentText: "Comment prompt goes here",
  answerText: "Answer text goes here",
  missText: "Miss beat text goes here",
  skipText: "Skip beat text goes here",
  soundText: "Sound beat text goes here",
  buttonText: "Button line goes here",
  sentenceLines: ["FINISHED FILES", "ARE THE RESULT", "OF YEARS OF", "SCIENTIFIC STUDY", "COMBINED WITH", "THE EXPERIENCE", "OF YEARS"],
};

const FPS = 30;

// Scene start times in seconds: hook, count, comment, reveal, why, button (the
// button scene doubles as the end card). Aligned to the `say` voiceover clips
// (assets/audio/011-count-the-fs.m4a).
const STARTS_S = [0, 3.66, 14.2, 17.59, 27.57, 35.22];
const STARTS = STARTS_S.map((s) => Math.round(s * FPS));
const TOTAL_FRAMES = Math.round(40.5 * FPS);

// When each F is spoken/pointed at, in seconds on the whole-video timeline
// ("Finished. Files. Of. Of. Scientific. Of.").
const F_CUES_S = [19.25, 20.35, 21.55, 22.34, 23.13, 24.59];
const REVEAL_FROM = STARTS[3];
const F_CUES = F_CUES_S.map((s) => Math.round(s * FPS) - REVEAL_FROM);

// The countdown starts once "Go." has been said (video time 6.2s).
const COUNT_FROM = Math.round((6.2 - STARTS_S[1]) * FPS);
const COUNT_SECONDS = 8;

const DARK = "#0B0B14";
const RED = "#FF3B3B";
const TEAL = "#19E0F0";
const GOLD = colors.accentAlt;

const FONT = 84;
const LINE_H = 124;

// "Count the F's" self-test: hook -> sentence + countdown -> comment bait ->
// numbered reveal of all six F's -> why the brain misses the "OF"s -> end card.
export const CountTheFsComposition = () => {
  return (
    <Composition
      id="CountTheFs"
      component={CountTheFs}
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

// The sentence, one span per letter so individual F's can be pointed at.
// `frame` is the scene frame; an F lights up once frame >= its cue. F's are
// numbered 1..6 in reading order (every "OF" counts).
const Sentence: React.FC<{
  lines: string[];
  frame: number;
  cues?: number[];
  dim?: number;
}> = ({ lines, frame, cues, dim = 0 }) => {
  let fIndex = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {lines.map((line, li) => (
        <div
          key={li}
          style={{
            display: "flex",
            height: LINE_H,
            alignItems: "center",
            fontSize: FONT,
            fontWeight: 900,
            letterSpacing: 3,
            whiteSpace: "pre",
          }}
        >
          {line.split("").map((ch, ci) => {
            const isF = ch === "F";
            const n = isF ? ++fIndex : 0;
            const appear = isF && cues ? ramp(frame, cues[n - 1], cues[n - 1] + 6) : 0;
            const lit = appear > 0;
            return (
              <span
                key={ci}
                style={{
                  position: "relative",
                  display: "inline-block",
                  color: lit ? GOLD : colors.foreground,
                  opacity: lit ? 1 : 1 - 0.6 * dim,
                  transform: lit ? `scale(${1.12 + 0.35 * (1 - appear)})` : undefined,
                }}
              >
                {ch}
                {lit ? (
                  <>
                    <span
                      style={{
                        position: "absolute",
                        left: -10,
                        right: -10,
                        top: 4,
                        bottom: 4,
                        border: `6px solid ${TEAL}`,
                        borderRadius: 16,
                        opacity: appear,
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: -50,
                        marginLeft: -24,
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: TEAL,
                        color: DARK,
                        fontSize: 34,
                        lineHeight: "48px",
                        textAlign: "center",
                        letterSpacing: 0,
                        opacity: appear,
                      }}
                    >
                      {n}
                    </span>
                  </>
                ) : null}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const SENTENCE_TOP = 500;

const HookScene: React.FC<{ text: string; lines: string[] }> = ({ text, lines }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: DARK, alignItems: "center" }}>
      <BackgroundPulse color={colors.accent} size={900} />
      <div style={{ position: "absolute", top: 160, padding: "0 80px" }}>
        <TextReveal fontSize={60} delay={4} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
      <div style={{ position: "absolute", top: SENTENCE_TOP, opacity: ramp(frame, 12, 24) }}>
        <Sentence lines={lines} frame={frame} />
      </div>
      <div style={{ position: "absolute", top: 1450 }}>
        <Stamp text="HOW MANY F's?" appear={ramp(frame, 50, 62)} color={GOLD} size={76} rotate={-3} />
      </div>
    </AbsoluteFill>
  );
};

const CountScene: React.FC<{ text: string; lines: string[] }> = ({ text, lines }) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - COUNT_FROM);
  const left = Math.max(0, COUNT_SECONDS - Math.floor(elapsed / FPS));
  const within = (elapsed % FPS) / FPS;
  const R = 96;
  const C = 2 * Math.PI * R;
  const running = frame >= COUNT_FROM && elapsed < COUNT_SECONDS * FPS;
  return (
    <AbsoluteFill style={{ backgroundColor: DARK, alignItems: "center" }}>
      <div style={{ position: "absolute", top: 160, padding: "0 80px" }}>
        <TextReveal fontSize={58} delay={6} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
      <div style={{ position: "absolute", top: SENTENCE_TOP }}>
        <Sentence lines={lines} frame={frame} />
      </div>
      {running ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <circle cx={540} cy={1560} r={R} fill="none" stroke="#fff" strokeWidth={14} opacity={0.2} />
          <circle
            cx={540}
            cy={1560}
            r={R}
            fill="none"
            stroke={TEAL}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * within}
            transform="rotate(-90 540 1560)"
          />
          <text x={540} y={1596} textAnchor="middle" fontSize={110} fontWeight={900} fill={colors.foreground}>
            {left}
          </text>
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

const CommentScene: React.FC<{ text: string; lines: string[] }> = ({ text, lines }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: DARK, alignItems: "center" }}>
      <BackgroundPulse color={colors.accent} size={900} />
      <div style={{ position: "absolute", top: 180 }}>
        <Stamp text="TIME'S UP" appear={ramp(frame, 3, 14)} color={RED} size={92} rotate={-3} />
      </div>
      <div style={{ position: "absolute", top: SENTENCE_TOP }}>
        <Sentence lines={lines} frame={frame} dim={0.25} />
      </div>
      <div style={{ position: "absolute", top: 1420, padding: "0 80px" }}>
        <Stamp text={text} appear={ramp(frame, 14, 26)} color={TEAL} size={56} rotate={2} />
      </div>
    </AbsoluteFill>
  );
};

const RevealScene: React.FC<{ answer: string; miss: string; lines: string[] }> = ({
  answer,
  miss,
  lines,
}) => {
  const frame = useCurrentFrame();
  const found = F_CUES.filter((c) => frame >= c).length;
  const missAt = Math.round(25.43 * FPS) - REVEAL_FROM;
  return (
    <AbsoluteFill style={{ backgroundColor: DARK, alignItems: "center" }}>
      <div style={{ position: "absolute", top: 170, padding: "0 80px" }}>
        <Stamp text={answer} appear={ramp(frame, 3, 14)} color={GOLD} size={84} rotate={-3} />
      </div>
      <div style={{ position: "absolute", top: SENTENCE_TOP }}>
        <Sentence lines={lines} frame={frame} cues={F_CUES} dim={ramp(frame, 40, 52)} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 1400,
          fontSize: 80,
          fontWeight: 900,
          color: found === 6 ? GOLD : TEAL,
          opacity: ramp(frame, 40, 52),
        }}
      >
        F's found: {found} / 6
      </div>
      <div style={{ position: "absolute", bottom: 230, padding: "0 90px" }}>
        <TextReveal fontSize={54} delay={missAt} stagger style={{ color: colors.foreground }}>
          {miss}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

const WORD = 96;

// Why the "OF"s vanish: (1) reading jumps over tiny words, (2) the F in "OF"
// is pronounced like a V, so inner speech never "says" an F.
const WhyScene: React.FC<{ skip: string; sound: string }> = ({ skip, sound }) => {
  const frame = useCurrentFrame();
  const SOUND_AT = 105;
  const second = ramp(frame, SOUND_AT, SOUND_AT + 10);
  const first = 1 - second;
  const bar = ramp(frame, 40, 56); // eye jumps over OF
  return (
    <AbsoluteFill style={{ backgroundColor: DARK, alignItems: "center" }}>
      <BackgroundPulse color={colors.accent} size={900} />

      <div style={{ position: "absolute", top: 420, width: 1080, opacity: first }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 30, fontSize: WORD, fontWeight: 900 }}>
          <span style={{ color: colors.foreground }}>RESULT</span>
          <span
            style={{
              color: RED,
              border: `6px dashed ${RED}`,
              borderRadius: 18,
              padding: "0 22px",
              opacity: 0.35 + 0.65 * (1 - bar),
            }}
          >
            OF
          </span>
          <span style={{ color: colors.foreground }}>YEARS</span>
        </div>
        <svg width={1080} height={200} style={{ marginTop: 10 }}>
          <path
            d={`M 230 120 Q 540 -40 850 120`}
            fill="none"
            stroke={GOLD}
            strokeWidth={10}
            strokeDasharray="22 16"
            opacity={bar}
          />
          <circle cx={230 + (850 - 230) * bar} cy={120 - 160 * Math.sin(Math.PI * bar) * 0.5} r={22} fill={GOLD} opacity={bar > 0 ? 1 : 0} />
        </svg>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Stamp text="SKIPPED" appear={ramp(frame, 58, 70)} color={RED} size={70} rotate={-4} />
        </div>
      </div>

      <div style={{ position: "absolute", top: 440, width: 1080, opacity: second }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 40, fontSize: 180, fontWeight: 900 }}>
          <span style={{ color: colors.foreground }}>
            O<span style={{ color: GOLD }}>F</span>
          </span>
          <span style={{ color: colors.muted, fontSize: 110 }}>→</span>
          <span style={{ color: colors.foreground }}>
            O<span style={{ color: TEAL }}>V</span>
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 60 }}>
          <Stamp text="NO 'F' SOUND" appear={ramp(frame, SOUND_AT + 25, SOUND_AT + 37)} color={TEAL} size={72} rotate={-3} />
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 240, padding: "0 90px" }}>
        {frame < SOUND_AT ? (
          <TextReveal fontSize={52} delay={10} stagger style={{ color: colors.foreground }}>
            {skip}
          </TextReveal>
        ) : (
          <TextReveal fontSize={52} delay={SOUND_AT} stagger style={{ color: colors.foreground }}>
            {sound}
          </TextReveal>
        )}
      </div>
    </AbsoluteFill>
  );
};

export const CountTheFs: React.FC<CountTheFsProps> = ({
  hookText,
  countText,
  commentText,
  answerText,
  missText,
  skipText,
  soundText,
  buttonText,
  sentenceLines,
  audioFile,
  channelName,
}) => {
  const bounds = [...STARTS, TOTAL_FRAMES];
  const dur = (i: number) => bounds[i + 1] - bounds[i];

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      {audioFile ? <Audio src={staticFile(audioFile)} /> : null}

      <Sequence from={STARTS[0]} durationInFrames={dur(0)}>
        <HookScene text={hookText} lines={sentenceLines} />
      </Sequence>
      <Sequence from={STARTS[1]} durationInFrames={dur(1)}>
        <CountScene text={countText} lines={sentenceLines} />
      </Sequence>
      <Sequence from={STARTS[2]} durationInFrames={dur(2)}>
        <CommentScene text={commentText} lines={sentenceLines} />
      </Sequence>
      <Sequence from={STARTS[3]} durationInFrames={dur(3)}>
        <RevealScene answer={answerText} miss={missText} lines={sentenceLines} />
      </Sequence>
      <Sequence from={STARTS[4]} durationInFrames={dur(4)}>
        <WhyScene skip={skipText} sound={soundText} />
      </Sequence>
      <Sequence from={STARTS[5]} durationInFrames={dur(5)}>
        <EndCardScene text={buttonText} />
      </Sequence>

      <ChannelWatermark text={channelName} />
    </AbsoluteFill>
  );
};
