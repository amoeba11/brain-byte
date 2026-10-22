import { useCurrentFrame } from "remotion";

type TouchReactionProps = {
  /** true = the reaction gets squashed almost immediately (dampened). false = it keeps expanding (registers). */
  canceled: boolean;
  color: string;
  size?: number;
};

// A finger touching a point, with a repeating ripple: either a tiny blip
// that snaps back to nothing (canceled/dampened) or a continuous expanding
// "sonar" ripple (not canceled/still felt). Shows the outcome directly
// rather than the internal mechanism, for a clearer read at a glance.
// Generic (not tickle-specific) so it's reusable for any prediction/surprise
// themed episode.
export const TouchReaction: React.FC<TouchReactionProps> = ({
  canceled,
  color,
  size = 200,
}) => {
  const frame = useCurrentFrame();
  const cycle = 36;
  const maxRadius = size * 0.4;
  const cx = size / 2;
  const cy = size * 0.58;

  const ringOffsets = canceled ? [0] : [0, 12, 24];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* finger */}
      <rect
        x={cx - size * 0.09}
        y={size * 0.08}
        width={size * 0.18}
        height={size * 0.33}
        rx={size * 0.09}
        fill={color}
      />
      {/* contact point */}
      <circle cx={cx} cy={cy} r={size * 0.05} fill={color} />

      {ringOffsets.map((offset, i) => {
        const local = (frame + offset) % cycle;
        const t = local / cycle;
        let radius: number;
        let opacity: number;

        if (canceled) {
          const riseT = Math.min(t / 0.3, 1);
          const collapseT = t > 0.3 ? Math.min((t - 0.3) / 0.12, 1) : 0;
          radius = maxRadius * 0.4 * riseT * (1 - collapseT);
          opacity = 0.9 * (1 - collapseT);
        } else {
          radius = maxRadius * t;
          opacity = 1 - t;
        }

        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={Math.max(radius, 0)}
            fill="none"
            stroke={color}
            strokeWidth={size * 0.02}
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
};
