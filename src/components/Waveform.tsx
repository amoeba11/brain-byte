type WaveformProps = {
  width?: number;
  height?: number;
  /** Peak amplitude in px; animate this down to ~0 to show cancellation. */
  amplitude?: number;
  /** Number of full cycles across the width. */
  frequency?: number;
  /** Phase offset in radians — animate with frame for a scrolling/moving feel. */
  phase?: number;
  color?: string;
  strokeWidth?: number;
  /** Mix in a couple of extra harmonics for a messy, irregular (voice-like) wave. */
  jagged?: boolean;
};

// A simple animated sine-wave path, used for the noise/anti-noise and
// destructive-interference visuals. Generic (not noise-cancelling-specific)
// so it's reusable for any future audio/wave-themed episode.
export const Waveform: React.FC<WaveformProps> = ({
  width = 500,
  height = 120,
  amplitude = 40,
  frequency = 3,
  phase = 0,
  color = "#7C5CFF",
  strokeWidth = 6,
  jagged = false,
}) => {
  const points = 120;
  const midY = height / 2;

  const path = Array.from({ length: points + 1 }, (_, i) => {
    const x = (i / points) * width;
    const t = (i / points) * Math.PI * 2 * frequency + phase;
    let y = Math.sin(t);
    if (jagged) {
      y += Math.sin(t * 2.7 + phase) * 0.35 + Math.sin(t * 5.3) * 0.18;
    }
    return [x, midY + y * amplitude];
  });

  const d = points
    ? `M ${points > 0 ? path.map(([x, y]) => `${x},${y}`).join(" L ") : ""}`
    : "";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
