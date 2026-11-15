import {
  AbsoluteFill,
  Audio,
  Composition,
  Easing,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { colors } from "../themes/colors";
import { TextReveal } from "../components/TextReveal";
import { BackgroundPulse } from "../components/BackgroundPulse";
import { ChannelWatermark } from "../components/ChannelWatermark";
import { EndCardScene } from "../components/EndCardScene";

export type QrSquaresProps = {
  /** The ten narrated sentences before the end card, in order (see CAPTION_CUES_S). */
  captionLines: string[];
  /** What the on-screen QR code says when scanned (shown after the damage test). */
  decodedText: string;
  buttonText: string;
  audioFile?: string;
  channelName?: string;
};

const defaultProps: QrSquaresProps = {
  captionLines: [
    "Line 1",
    "Line 2",
    "Line 3",
    "Line 4",
    "Line 5",
    "Line 6",
    "Line 7",
    "Line 8",
    "Line 9",
    "Line 10",
  ],
  decodedText: "Decoded text goes here",
  buttonText: "Button line goes here",
};

const FPS = 30;

// Scene start times in seconds: the QR stage (hook -> finder squares -> empty
// corner -> rotation -> damage -> rebuild), the 1994 beat, the end card.
// Aligned to the `say` voiceover clips mixed into
// assets/audio/014-qr-code-squares.m4a.
const STARTS_S = [0, 28.3, 32.6];
const STARTS = STARTS_S.map((s) => Math.round(s * FPS));
const TOTAL_FRAMES = Math.round(36.8 * FPS);

// When each narrated sentence starts, in seconds from the start of the video.
const CAPTION_CUES_S = [0.15, 3.35, 4.6, 5.9, 9.95, 12.75, 17.4, 22.3, 24.2, 28.3];

const DARK = "#0B0B14";
const RED = "#FF3B3B";
const TEAL = "#19E0F0";
const GREEN = "#2ED573";
const GOLD = colors.accentAlt;

// A real, scannable QR code (version 3, error correction level H) that says
// "It still works!". 1 = dark module. Generated with macOS CoreImage's
// CIQRCodeGenerator; the damage in the video stays within what level H can
// repair, so the code on screen genuinely still scans.
const QR_ROWS = [
  "11111110000000010001101111111",
  "10000010010011011101001000001",
  "10111010110100001001001011101",
  "10111010100001110100101011101",
  "10111010011111001001001011101",
  "10000010001010101000101000001",
  "11111110101010101010101111111",
  "00000000000001011110000000000",
  "00011011011011011001000001100",
  "10111000101001010110001100110",
  "00111110110010000001111101000",
  "00100100101111010111111000011",
  "10001011001101110010001101010",
  "11001000000010000100001110111",
  "10011111110010100111011011001",
  "11110001111110101110111110110",
  "00111011110101100100010010011",
  "11010001100000110110011110001",
  "11011111000010111111000010101",
  "11101000100011111111100011111",
  "11011110000100001011111111000",
  "00000000100110110010100010100",
  "11111110110101001011101010100",
  "10000010001010110110100011000",
  "10111010111010101101111110011",
  "10111010110111111001110100000",
  "10111010000100110110110111111",
  "10000010001101111000110101001",
  "11111110011000010011011110100",
];
const N = QR_ROWS.length;
const QUIET = 3; // white margin around the code, in modules

// Where each finder square sits (top-left module), and the corner without one.
const FINDERS = [
  { r: 0, c: 0 },
  { r: 0, c: N - 7 },
  { r: N - 7, c: 0 },
];
const EMPTY_CORNER = { r: N - 7, c: N - 7 };

// Chunks scratched off in the damage beat: centre (in modules) and radius.
const HOLES = [
  { x: 14.5, y: 15.5, rad: 3.6, at: 19.0 },
  { x: 23.5, y: 13.5, rad: 2.5, at: 19.8 },
  { x: 13.0, y: 24.5, rad: 2.4, at: 20.6 },
];
const REBUILD_FROM_S = 25.3;
const REBUILD_TO_S = 27.3;

const holeOf = (r: number, c: number) =>
  HOLES.findIndex((h) => Math.hypot(c + 0.5 - h.x, r + 0.5 - h.y) < h.rad + 0.35);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ramp = (t: number, from: number, to: number) => interpolate(t, [from, to], [0, 1], clamp);
const ease = (t: number, from: number, to: number) =>
  interpolate(t, [from, to], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
const pop = (t: number, at: number) =>
  t < at ? 0 : spring({ frame: (t - at) * FPS, fps: FPS, config: { damping: 11, mass: 0.6, stiffness: 140 } });

// "Why QR codes have three big squares": hook -> the squares announce the code
// -> the empty corner gives orientation -> it scans at any rotation -> survives
// damage -> backup math rebuilds it -> invented in 1994 -> end card.
export const QrSquaresComposition = () => {
  return (
    <Composition
      id="QrSquares"
      component={QrSquares}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
    />
  );
};

const QrModules: React.FC<{ m: number }> = ({ m }) => (
  <>
    {QR_ROWS.flatMap((row, r) =>
      row.split("").map((bit, c) =>
        bit === "1" ? (
          <rect key={`${r}-${c}`} x={(c + QUIET) * m} y={(r + QUIET) * m} width={m + 0.5} height={m + 0.5} fill={DARK} />
        ) : null,
      ),
    )}
  </>
);

const Check: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M4 13 L10 19 L21 6" fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Stamp: React.FC<{
  text: string;
  appear: number;
  color: string;
  size?: number;
  check?: boolean;
}> = ({ text, appear, color, size = 80, check }) => {
  if (appear <= 0) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        fontSize: size,
        fontWeight: 900,
        color,
        border: `8px solid ${color}`,
        borderRadius: 18,
        padding: "4px 28px",
        transform: `rotate(-3deg) scale(${1.5 - 0.5 * Math.min(appear, 1.15)})`,
        opacity: Math.min(1, appear),
        whiteSpace: "nowrap",
      }}
    >
      {text}
      {check ? <Check size={size} color={color} /> : null}
    </div>
  );
};

type StampSpec = { from: number; to: number; text: string; color: string; size?: number; check?: boolean };
const STAMPS: StampSpec[] = [
  { from: 3.35, to: 4.6, text: "NEVER 4", color: RED, size: 96 },
  { from: 4.6, to: 5.9, text: "HERE'S WHY", color: GOLD, size: 90 },
  { from: 7.8, to: 9.95, text: "HEY! I'M A QR CODE!", color: TEAL, size: 70 },
  { from: 11.2, to: 12.75, text: "THIS WAY UP", color: GOLD, size: 90 },
  { from: 13.75, to: 14.5, text: "SIDEWAYS", color: GREEN, size: 84, check: true },
  { from: 14.95, to: 15.75, text: "UPSIDE DOWN", color: GREEN, size: 84, check: true },
  { from: 16.3, to: 17.4, text: "ANY WAY", color: GREEN, size: 84, check: true },
  { from: 17.4, to: 19.9, text: "THE WILD PART", color: GOLD, size: 84 },
  { from: 19.9, to: 22.3, text: "UP TO 30% GONE", color: RED, size: 80 },
  { from: 22.4, to: 24.2, text: "STILL SCANS", color: GREEN, size: 90, check: true },
  { from: 24.6, to: 28.3, text: "BACKUP MATH", color: TEAL, size: 90 },
];

// Card rotation in degrees: sideways, upside down, then a spin back to upright.
const rotationAt = (t: number) =>
  90 * ease(t, 13.25, 13.75) + 90 * ease(t, 14.45, 14.95) + 180 * ease(t, 15.7, 16.5);

const Caption: React.FC<{ lines: string[]; t: number; offsetS: number }> = ({ lines, t, offsetS }) => {
  let current = -1;
  CAPTION_CUES_S.forEach((cue, i) => {
    if (t >= cue) current = i;
  });
  if (current < 0) return null;
  return (
    <div style={{ position: "absolute", top: 150, left: 0, right: 0, padding: "0 70px" }}>
      <TextReveal
        key={current}
        fontSize={58}
        delay={Math.round((CAPTION_CUES_S[current] - offsetS) * FPS)}
        stagger
        style={{ color: colors.foreground }}
      >
        {lines[current] ?? ""}
      </TextReveal>
    </div>
  );
};

const QrStage: React.FC<{ lines: string[]; decodedText: string }> = ({ lines, decodedText }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  const M = 24;
  const C = (N + QUIET * 2) * M;
  const px = (modules: number) => (modules + QUIET) * M;

  const intro = pop(t, 0.05);
  const small = ease(t, 12.85, 13.2) - ease(t, 16.9, 17.3);
  const scale = (0.6 + 0.4 * intro) * (1 - 0.18 * small);

  // Each scratch gives the card a short, decaying shake.
  const shake = HOLES.reduce((sum, h) => {
    const dt = t - h.at;
    return dt >= 0 && dt < 0.4 ? sum + Math.sin(dt * 60) * 16 * (1 - dt / 0.4) : sum;
  }, 0);

  const ringsOut = 1 - ramp(t, 17.1, 17.4);
  const shouting = t >= 5.9 && t < 9.95;
  const badgesOut = 1 - ramp(t, 5.5, 5.9);

  const noFourth = pop(t, 3.35) * (1 - ramp(t, 5.5, 5.9));
  const emptyCorner = pop(t, 10.2) * ringsOut;
  const upArrow = pop(t, 11.2) * ringsOut;

  // Camera scan line: once when the squares "shout", once after the damage.
  const scan1 = ramp(t, 5.95, 7.5);
  const scan2 = ramp(t, 21.3, 22.25);
  const scanning = (scan1 > 0 && scan1 < 1) || (scan2 > 0 && scan2 < 1);
  const scanY = (scan1 > 0 && scan1 < 1 ? scan1 : scan2) * C;
  const locked = pop(t, 7.6) * ringsOut;

  const holesGone = ramp(t, REBUILD_TO_S, REBUILD_TO_S + 0.3);
  const stamp = STAMPS.find((s) => t >= s.from && t < s.to);
  const decoded = t < 24.2 ? pop(t, 22.9) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: DARK }}>
      <BackgroundPulse color={colors.accent} size={1100} />
      <Caption lines={lines} t={t} offsetS={0} />

      <div
        style={{
          position: "absolute",
          left: 540 - C / 2,
          top: 930 - C / 2,
          width: C,
          height: C,
          opacity: Math.min(1, intro * 2),
          transform: `translateX(${shake}px) rotate(${rotationAt(t)}deg) scale(${scale})`,
        }}
      >
        <svg width={C} height={C} viewBox={`0 0 ${C} ${C}`} style={{ position: "absolute", overflow: "visible" }}>
          <rect width={C} height={C} rx={36} fill="#FFFFFF" />
          <QrModules m={M} />

          {/* Scratched-off chunks, then the modules that the backup math rebuilds. */}
          {HOLES.map((h, i) => {
            const a = pop(t, h.at);
            if (a <= 0 || holesGone >= 1) return null;
            return (
              <circle
                key={i}
                cx={px(h.x)}
                cy={px(h.y)}
                r={h.rad * M * Math.min(a, 1.08)}
                fill={DARK}
                stroke={RED}
                strokeWidth={6}
                opacity={1 - holesGone}
              />
            );
          })}
          {t >= REBUILD_FROM_S
            ? QR_ROWS.flatMap((row, r) =>
                row.split("").map((bit, c) => {
                  if (holeOf(r, c) < 0) return null;
                  const at =
                    REBUILD_FROM_S + random(`rebuild-${r}-${c}`) * (REBUILD_TO_S - REBUILD_FROM_S - 0.2);
                  const a = pop(t, at);
                  if (a <= 0) return null;
                  const s = M * Math.min(a, 1.1);
                  const fresh = 1 - ramp(t, at + 0.2, at + 0.9);
                  return (
                    <rect
                      key={`fix-${r}-${c}`}
                      x={px(c) + (M - s) / 2}
                      y={px(r) + (M - s) / 2}
                      width={s + 0.5}
                      height={s + 0.5}
                      fill={bit === "1" ? (fresh > 0.5 ? TEAL : DARK) : "#FFFFFF"}
                    />
                  );
                }),
              )
            : null}

          {/* Gold rings around the three finder squares. */}
          {FINDERS.map((f, i) => {
            const a = pop(t, 1.3 + i * 0.32) * ringsOut;
            if (a <= 0) return null;
            const pulse = shouting ? 1 + 0.07 * Math.sin((t - 5.9) * 14 + i) : 1;
            const cx = px(f.c + 3.5);
            const cy = px(f.r + 3.5);
            const half = 4.3 * M * Math.min(a, 1.1) * pulse;
            // Number badge sits on the ring's outer corner.
            const bx = cx + (f.c === 0 ? -1 : 1) * 4.3 * M;
            const by = cy + (f.r === 0 ? -1 : 1) * 4.3 * M;
            return (
              <g key={i} opacity={Math.min(1, a)}>
                <rect
                  x={cx - half}
                  y={cy - half}
                  width={half * 2}
                  height={half * 2}
                  rx={22}
                  fill="none"
                  stroke={GOLD}
                  strokeWidth={12}
                />
                {badgesOut > 0 ? (
                  <g opacity={badgesOut}>
                    <circle cx={bx} cy={by} r={44} fill={GOLD} />
                    <text
                      x={bx}
                      y={by + 20}
                      textAnchor="middle"
                      fontSize={58}
                      fontWeight={900}
                      fontFamily="Inter, sans-serif"
                      fill={DARK}
                    >
                      {i + 1}
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}

          {/* The corner with no big square: first "never four", later "the empty corner". */}
          {[
            { a: noFourth, color: RED, cross: true },
            { a: emptyCorner, color: TEAL, cross: false },
          ].map(({ a, color, cross }, i) => {
            if (a <= 0) return null;
            const x = px(EMPTY_CORNER.c - 0.3);
            const y = px(EMPTY_CORNER.r - 0.3);
            const s = 7.6 * M;
            return (
              <g key={i} opacity={Math.min(1, a)}>
                <rect
                  x={x}
                  y={y}
                  width={s}
                  height={s}
                  rx={22}
                  fill={color}
                  fillOpacity={0.22}
                  stroke={color}
                  strokeWidth={10}
                  strokeDasharray="26 16"
                />
                {cross ? (
                  <path
                    d={`M ${x + 40} ${y + 40} L ${x + s - 40} ${y + s - 40} M ${x + s - 40} ${y + 40} L ${x + 40} ${y + s - 40}`}
                    stroke={RED}
                    strokeWidth={18}
                    strokeLinecap="round"
                  />
                ) : null}
              </g>
            );
          })}

          {/* "This way up" marker, fixed to the code so it turns with it. */}
          {upArrow > 0 ? (
            <g opacity={Math.min(1, upArrow)} transform={`translate(${C / 2} ${-70 + 30 * (1 - Math.min(1, upArrow))})`}>
              <path d="M 0 -62 L 56 6 L 22 6 L 22 44 L -22 44 L -22 6 L -56 6 Z" fill={GOLD} />
              <text
                x={96}
                y={30}
                fontSize={64}
                fontWeight={900}
                fontFamily="Inter, sans-serif"
                fill={GOLD}
              >
                UP
              </text>
            </g>
          ) : null}

          {/* Camera lock-on brackets around the whole code. */}
          {locked > 0
            ? [
                [0, 0, 1, 1],
                [C, 0, -1, 1],
                [0, C, 1, -1],
                [C, C, -1, -1],
              ].map(([x, y, dx, dy], i) => {
                const o = 26 + 40 * (1 - Math.min(1, locked));
                const len = 90;
                const ox = x - dx * o;
                const oy = y - dy * o;
                return (
                  <path
                    key={i}
                    d={`M ${ox + dx * len} ${oy} L ${ox} ${oy} L ${ox} ${oy + dy * len}`}
                    fill="none"
                    stroke={TEAL}
                    strokeWidth={12}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={Math.min(1, locked)}
                  />
                );
              })
            : null}

          {scanning ? (
            <rect
              x={-10}
              y={scanY - 7}
              width={C + 20}
              height={14}
              rx={7}
              fill={TEAL}
              style={{ filter: `drop-shadow(0 0 18px ${TEAL})` }}
            />
          ) : null}
        </svg>
      </div>

      <div style={{ position: "absolute", top: 1420, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        {stamp ? (
          <Stamp
            key={stamp.text}
            text={stamp.text}
            appear={pop(t, stamp.from)}
            color={stamp.color}
            size={stamp.size}
            check={stamp.check}
          />
        ) : null}
      </div>

      {/* What the damaged code says when scanned. */}
      {decoded > 0 ? (
        <div style={{ position: "absolute", top: 1590, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <div
            style={{
              fontSize: 50,
              fontWeight: 800,
              color: DARK,
              backgroundColor: colors.foreground,
              borderRadius: 999,
              padding: "14px 40px",
              opacity: Math.min(1, decoded),
              transform: `translateY(${(1 - Math.min(1, decoded)) * 40}px)`,
            }}
          >
            {`"${decodedText}"`}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// A crate of car parts with a QR label, riding the conveyor.
const Crate: React.FC<{ x: number; bob: number }> = ({ x, bob }) => {
  const m = 5;
  const size = (N + QUIET * 2) * m;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 1010 + bob,
        width: 300,
        height: 300,
        borderRadius: 26,
        backgroundColor: "#2A2440",
        border: `8px solid ${GOLD}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect width={size} height={size} rx={10} fill="#FFFFFF" />
        <QrModules m={m} />
      </svg>
    </div>
  );
};

const YearScene: React.FC<{ lines: string[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const s = frame / FPS;
  const year = Math.round(interpolate(s, [0.5, 1.5], [1970, 1994], clamp));
  const landed = pop(s, 1.5);
  const belt = ramp(s, 0.4, 0.8);
  const travel = frame * 7;
  return (
    <AbsoluteFill style={{ backgroundColor: DARK, alignItems: "center" }}>
      <BackgroundPulse color={colors.accent} size={1100} />
      <Caption lines={lines} t={STARTS_S[1] + s} offsetS={STARTS_S[1]} />
      <div
        style={{
          position: "absolute",
          top: 470,
          fontSize: 300,
          fontWeight: 900,
          color: GOLD,
          transform: `scale(${1 + 0.12 * Math.max(0, 1 - landed) + 0.1 * Math.max(0, landed - 1)})`,
        }}
      >
        {year}
      </div>
      <div style={{ position: "absolute", inset: 0, opacity: belt }}>
        {[0, 1, 2, 3].map((i) => {
          const x = ((i * 430 - travel) % 1720 + 1720) % 1720 - 360;
          return <Crate key={i} x={x} bob={Math.sin(frame / 4 + i * 2) * 5} />;
        })}
        <div
          style={{
            position: "absolute",
            top: 1318,
            left: -20,
            right: -20,
            height: 26,
            borderRadius: 13,
            backgroundColor: colors.muted,
          }}
        />
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 1352,
              left: 30 + i * 140,
              width: 70,
              height: 70,
              borderRadius: 35,
              border: `10px solid ${colors.muted}`,
              borderTopColor: TEAL,
              transform: `rotate(${-frame * 9}deg)`,
              boxSizing: "border-box",
            }}
          />
        ))}
        <div style={{ position: "absolute", top: 1480, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <Stamp text="CAR PARTS" appear={pop(s, 2.0)} color={TEAL} size={90} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const QrSquares: React.FC<QrSquaresProps> = ({
  captionLines,
  decodedText,
  buttonText,
  audioFile,
  channelName,
}) => {
  const bounds = [...STARTS, TOTAL_FRAMES];
  const dur = (i: number) => bounds[i + 1] - bounds[i];

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background, fontFamily: "Inter, sans-serif" }}>
      {audioFile ? <Audio src={staticFile(audioFile)} /> : null}

      <Sequence from={STARTS[0]} durationInFrames={dur(0)}>
        <QrStage lines={captionLines} decodedText={decodedText} />
      </Sequence>
      <Sequence from={STARTS[1]} durationInFrames={dur(1)}>
        <YearScene lines={captionLines} />
      </Sequence>
      <Sequence from={STARTS[2]} durationInFrames={dur(2)}>
        <EndCardScene text={buttonText} />
      </Sequence>

      <ChannelWatermark text={channelName} />
    </AbsoluteFill>
  );
};
