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

export type BlindSpotProps = {
  hookText: string;
  setupText: string;
  stareText: string;
  commentText: string;
  lineText: string;
  explainText: string;
  buttonText: string;
  audioFile?: string;
  channelName?: string;
};

const defaultProps: BlindSpotProps = {
  hookText: "Hook text goes here",
  setupText: "Setup beat text goes here",
  stareText: "Stare beat text goes here",
  commentText: "Comment prompt goes here",
  lineText: "Line beat text goes here",
  explainText: "Explain beat text goes here",
  buttonText: "Button line goes here",
};

// Scene start times in seconds: hook, setup, stare, line, explain, button (the
// button scene doubles as the end card). Aligned to the `say` voiceover clips
// (assets/audio/009-blind-spot.m4a).
const FPS = 30;
const STARTS = [0, 4.0, 9.7, 22.9, 30.1, 38.6].map((s) => Math.round(s * FPS));
const TOTAL_FRAMES = 47 * FPS;

// Where "Gone? Comment gone." lands inside the stare scene (frames).
const COMMENT_AT = 296;

// Test-field geometry (px on the 1080x1920 canvas). A phone is only ~7cm wide,
// so the dot sweeps between 620 and 960 to catch the blind spot at roughly
// 13-21cm from the face.
const ROW = 1000;
const CROSS_X = 100;
const DOT_MIN = 620;
const DOT_MAX = 960;
const DOT_R = 40;
const LINE_X = 200;

const DARK = "#0B0B14";
const DOT_RED = "#FF3B3B";
const TEAL = "#19E0F0";
const SENSOR = "#FFD400";
const GOLD = colors.accentAlt;

// "Find your blind spot" self-test: striped hook with a hole -> eyes-and-phone
// setup -> cross-and-dot stare -> dot-on-a-line fill-in -> eye diagram
// explainer -> shared end card.
export const BlindSpotComposition = () => {
  return (
    <Composition
      id="BlindSpot"
      component={BlindSpot}
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

// Dot slides slowly between DOT_MIN and DOT_MAX (starts at DOT_MAX), so
// whichever distance the viewer holds the phone at, it passes through their
// blind spot.
const dotXAt = (frame: number) =>
  (DOT_MIN + DOT_MAX) / 2 + ((DOT_MAX - DOT_MIN) / 2) * Math.sin((2 * Math.PI * frame) / 270 + Math.PI / 2);

// White cross (fixation target, left) + red dot (right) on dark, with an
// optional bar running through the dot's row.
const TestField: React.FC<{
  frame: number;
  ring?: boolean;
  bar?: number;
}> = ({ frame, ring = false, bar = 0 }) => {
  const pulse = (frame % 45) / 45;
  return (
    <AbsoluteFill style={{ backgroundColor: DARK }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {bar > 0 ? (
          <rect x={LINE_X} y={ROW - 16} width={(1080 - LINE_X) * bar} height={32} fill={TEAL} />
        ) : null}
        {ring ? (
          <circle
            cx={CROSS_X}
            cy={ROW}
            r={50 + 40 * pulse}
            fill="none"
            stroke="#fff"
            strokeWidth={6}
            opacity={0.6 * (1 - pulse)}
          />
        ) : null}
        <line x1={CROSS_X - 36} y1={ROW} x2={CROSS_X + 36} y2={ROW} stroke="#fff" strokeWidth={14} strokeLinecap="round" />
        <line x1={CROSS_X} y1={ROW - 36} x2={CROSS_X} y2={ROW + 36} stroke="#fff" strokeWidth={14} strokeLinecap="round" />
        <circle cx={dotXAt(frame)} cy={ROW} r={DOT_R} fill={DOT_RED} />
      </svg>
    </AbsoluteFill>
  );
};

const HookScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hole = spring({ frame: frame - 18, fps, config: { damping: 9, mass: 0.8 } });
  const stamp = ramp(frame, 8, 20);
  return (
    <AbsoluteFill style={{ alignItems: "center", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: -700,
          left: -700,
          width: 2500,
          height: 3300,
          backgroundImage:
            "repeating-linear-gradient(45deg, #FF4FB8 0px, #FF4FB8 60px, #FFD400 60px, #FFD400 120px, #19E0F0 120px, #19E0F0 180px, #7C5CFF 180px, #7C5CFF 240px)",
          transform: `translate(${(frame * 3) % 170}px, ${(frame * 3) % 170}px)`,
        }}
      />
      <div style={{ position: "absolute", top: 170 }}>
        <Stamp text="SELF-TEST" appear={stamp} color="#000" size={72} rotate={-3} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 330,
          width: 560,
          height: 560,
          borderRadius: "50%",
          background: "#000",
          boxShadow: `0 0 0 16px #fff, 0 0 120px 40px rgba(0,0,0,0.6)`,
          transform: `scale(${Math.max(0, hole)})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 300,
          fontWeight: 900,
          color: "#fff",
        }}
      >
        ?
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 260,
          margin: "0 70px",
          padding: "24px 36px",
          borderRadius: 30,
          background: "rgba(0,0,0,0.78)",
        }}
      >
        <TextReveal fontSize={60} delay={6} stagger style={{ color: "#fff" }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

const Eye: React.FC<{ open: boolean; label: string; appear: number }> = ({ open, label, appear }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 18,
      opacity: appear,
      transform: `scale(${0.6 + 0.4 * appear})`,
    }}
  >
    <svg width={240} height={140} viewBox="-10 -70 200 140">
      {open ? (
        <>
          <path d="M 0 0 Q 90 -80 180 0 Q 90 80 0 0 Z" fill="#fff" />
          <circle cx={90} cy={0} r={34} fill="#2F3BFF" />
          <circle cx={90} cy={0} r={16} fill="#000" />
        </>
      ) : (
        <>
          <path d="M 0 0 Q 90 60 180 0" fill="none" stroke="#fff" strokeWidth={10} strokeLinecap="round" />
          <path d="M 30 28 L 20 52 M 90 44 L 90 70 M 150 28 L 160 52" stroke="#fff" strokeWidth={8} strokeLinecap="round" />
        </>
      )}
    </svg>
    <div style={{ fontSize: 40, fontWeight: 900, color: open ? "#2FD35A" : DOT_RED }}>{label}</div>
  </div>
);

const SetupScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const closer = ramp(frame, 110, 124);
  const nudge = Math.sin(frame / 5) * 14;
  return (
    <>
      <TestField frame={frame} />
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 220, display: "flex", gap: 120 }}>
          <Eye open={false} label="LEFT: CLOSED" appear={ramp(frame, 15, 27)} />
          <Eye open label="RIGHT: OPEN" appear={ramp(frame, 15, 27)} />
        </div>
        <div style={{ position: "absolute", top: ROW - 210, left: CROSS_X - 60, opacity: ramp(frame, 55, 67) }}>
          <Stamp text="LOOK HERE" appear={ramp(frame, 55, 67)} color="#fff" size={44} rotate={-4} />
        </div>
        <div
          style={{
            position: "absolute",
            top: ROW + 150,
            fontSize: 84,
            fontWeight: 900,
            color: GOLD,
            opacity: closer,
            transform: `translateY(${-nudge}px)`,
          }}
        >
          ↑ PHONE CLOSER ↑
        </div>
        <div style={{ position: "absolute", bottom: 220, padding: "0 90px" }}>
          <TextReveal fontSize={50} delay={10} stagger style={{ color: colors.foreground }}>
            {text}
          </TextReveal>
        </div>
      </AbsoluteFill>
    </>
  );
};

const StareScene: React.FC<{ text: string; comment: string }> = ({ text, comment }) => {
  const frame = useCurrentFrame();
  const stamp = ramp(frame, 0, 12);
  return (
    <>
      <TestField frame={frame} ring />
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 230 }}>
          <Stamp text="EYES ON THE +" appear={stamp} color="#fff" size={84} rotate={-2} />
        </div>
        <div style={{ position: "absolute", top: 450, padding: "0 90px" }}>
          <TextReveal fontSize={54} delay={8} stagger style={{ color: colors.foreground }}>
            {text}
          </TextReveal>
        </div>
        <div style={{ position: "absolute", bottom: 330 }}>
          <Stamp text={comment} appear={ramp(frame, COMMENT_AT, COMMENT_AT + 10)} color={GOLD} size={64} rotate={2} />
        </div>
      </AbsoluteFill>
    </>
  );
};

const LineScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const bar = ramp(frame, 10, 40);
  return (
    <>
      <TestField frame={frame} ring bar={bar} />
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 260, padding: "0 90px" }}>
          <TextReveal fontSize={60} delay={4} stagger style={{ color: colors.foreground }}>
            {text}
          </TextReveal>
        </div>
        <div style={{ position: "absolute", bottom: 330 }}>
          <Stamp text="BRAIN PAINTS IT IN" appear={ramp(frame, 160, 172)} color={TEAL} size={64} rotate={-2} />
        </div>
      </AbsoluteFill>
    </>
  );
};

// Eye cross-section: light comes in on the left, lands on the retina (right).
// One spot on the retina, the optic disc, has no sensors, so that ray is lost.
const EYE_CX = 540;
const EYE_CY = 590;
const EYE_R = 230;
const DISC_DEG = 16;
const polar = (deg: number, r = EYE_R) => ({
  x: EYE_CX + r * Math.cos((deg * Math.PI) / 180),
  y: EYE_CY + r * Math.sin((deg * Math.PI) / 180),
});

const EyeDiagram: React.FC<{ frame: number }> = ({ frame }) => {
  const lens = { x: EYE_CX - EYE_R + 40, y: EYE_CY };
  const rays = [-42, -12, DISC_DEG, 46];
  const sensors: number[] = [];
  for (let d = -62; d <= 62; d += 6) {
    if (Math.abs(d - DISC_DEG) > 5) sensors.push(d);
  }
  const disc = polar(DISC_DEG);
  const nerveEnd = { x: disc.x + 150, y: disc.y + 70 };
  const intro = ramp(frame, 0, 14);
  return (
    <svg width={1080} height={900} style={{ position: "absolute", top: 0, left: 0, opacity: intro }}>
      <circle cx={EYE_CX} cy={EYE_CY} r={EYE_R} fill="#16162A" stroke="#fff" strokeWidth={8} />
      <ellipse cx={lens.x} cy={lens.y} rx={16} ry={64} fill="#9FD8FF" />
      {sensors.map((d) => {
        const p = polar(d);
        return <circle key={d} cx={p.x} cy={p.y} r={8} fill={SENSOR} opacity={ramp(frame, 10, 30)} />;
      })}
      <line
        x1={disc.x}
        y1={disc.y}
        x2={nerveEnd.x}
        y2={nerveEnd.y}
        stroke="#FF8A5B"
        strokeWidth={34}
        strokeLinecap="round"
        opacity={ramp(frame, 25, 45)}
      />
      {rays.map((d, i) => {
        const p = polar(d, EYE_R - 12);
        const isDisc = d === DISC_DEG;
        const go = ramp(frame, 40 + i * 6, 62 + i * 6);
        const x2 = lens.x + (p.x - lens.x) * go;
        const y2 = lens.y + (p.y - lens.y) * go;
        return (
          <g key={d}>
            <line x1={lens.x - 120} y1={lens.y + (i - 1.5) * 50} x2={lens.x} y2={lens.y} stroke={SENSOR} strokeWidth={6} opacity={go} />
            <line x1={lens.x} y1={lens.y} x2={x2} y2={y2} stroke={isDisc ? DOT_RED : SENSOR} strokeWidth={6} />
            {isDisc && go >= 1 ? (
              <g opacity={ramp(frame, 66, 76)}>
                <line x1={p.x - 16} y1={p.y - 16} x2={p.x + 16} y2={p.y + 16} stroke={DOT_RED} strokeWidth={10} strokeLinecap="round" />
                <line x1={p.x - 16} y1={p.y + 16} x2={p.x + 16} y2={p.y - 16} stroke={DOT_RED} strokeWidth={10} strokeLinecap="round" />
              </g>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};

const GAP_X = 470;
const GAP_W = 120;
const BAR_X = 160;
const BAR_W = 760;

const ExplainScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const fill = ramp(frame, 175, 195);
  return (
    <AbsoluteFill style={{ backgroundColor: DARK, alignItems: "center" }}>
      <BackgroundPulse color={colors.accent} size={900} />
      <div style={{ position: "absolute", top: 120 }}>
        <Stamp text="NO SENSORS HERE" appear={ramp(frame, 80, 92)} color={DOT_RED} size={54} rotate={-3} />
      </div>
      <EyeDiagram frame={frame} />
      <div
        style={{
          position: "absolute",
          top: 910,
          fontSize: 44,
          fontWeight: 900,
          color: colors.muted,
          opacity: ramp(frame, 130, 142),
        }}
      >
        EYE SENDS
      </div>
      <svg width={1080} height={400} style={{ position: "absolute", top: 960 }}>
        <g opacity={ramp(frame, 130, 142)}>
          <rect x={BAR_X} y={20} width={GAP_X - BAR_X} height={34} fill={TEAL} />
          <rect x={GAP_X + GAP_W} y={20} width={BAR_X + BAR_W - GAP_X - GAP_W} height={34} fill={TEAL} />
          <rect x={GAP_X} y={4} width={GAP_W} height={66} fill="none" stroke={DOT_RED} strokeWidth={4} strokeDasharray="10 8" />
        </g>
        <g opacity={ramp(frame, 160, 172)}>
          <rect x={BAR_X} y={210} width={GAP_X - BAR_X} height={34} fill={TEAL} />
          <rect x={GAP_X + GAP_W} y={210} width={BAR_X + BAR_W - GAP_X - GAP_W} height={34} fill={TEAL} />
          <rect x={GAP_X} y={210} width={GAP_W} height={34} fill={TEAL} opacity={fill} />
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          top: 1105,
          fontSize: 44,
          fontWeight: 900,
          color: colors.muted,
          opacity: ramp(frame, 160, 172),
        }}
      >
        YOU SEE
      </div>
      <div style={{ position: "absolute", top: 1260 }}>
        <Stamp text="BRAIN FILLS THE GAP" appear={ramp(frame, 190, 202)} color={GOLD} size={56} rotate={2} />
      </div>
      <div style={{ position: "absolute", bottom: 180, padding: "0 90px" }}>
        <TextReveal fontSize={46} delay={10} stagger style={{ color: colors.foreground }}>
          {text}
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

export const BlindSpot: React.FC<BlindSpotProps> = ({
  hookText,
  setupText,
  stareText,
  commentText,
  lineText,
  explainText,
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
        <StareScene text={stareText} comment={commentText} />
      </Sequence>
      <Sequence from={STARTS[3]} durationInFrames={dur(3)}>
        <LineScene text={lineText} />
      </Sequence>
      <Sequence from={STARTS[4]} durationInFrames={dur(4)}>
        <ExplainScene text={explainText} />
      </Sequence>
      <Sequence from={STARTS[5]} durationInFrames={dur(5)}>
        <EndCardScene text={buttonText} />
      </Sequence>

      <ChannelWatermark text={channelName} />
    </AbsoluteFill>
  );
};
