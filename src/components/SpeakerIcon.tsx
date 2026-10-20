type SpeakerIconProps = {
  /** 1 = full volume (sound arcs visible), 0 = fully muted (cross shown instead). */
  level: number;
  color: string;
  size?: number;
};

// A speaker glyph that morphs between "still making sound" (arcs) and
// "muted" (cross) based on `level` — used to show how much noise is left
// after cancellation. Generic/reusable, not specific to any one episode.
export const SpeakerIcon: React.FC<SpeakerIconProps> = ({
  level,
  color,
  size = 60,
}) => (
  <svg width={size} height={size} viewBox="0 0 60 60">
    <path d="M8 22 H20 L34 10 V50 L20 38 H8 Z" fill={color} />
    <g opacity={level}>
      <path
        d="M40 18 Q50 30 40 42"
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <path
        d="M46 10 Q60 30 46 50"
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.6}
      />
    </g>
    <g opacity={1 - level}>
      <line x1="40" y1="16" x2="56" y2="44" stroke={color} strokeWidth={4} strokeLinecap="round" />
      <line x1="56" y1="16" x2="40" y2="44" stroke={color} strokeWidth={4} strokeLinecap="round" />
    </g>
  </svg>
);
