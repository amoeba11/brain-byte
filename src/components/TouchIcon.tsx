type TouchIconProps = {
  /** Whether the touch produces a reaction (ripple) — false reads as "nothing happens". */
  active?: boolean;
  color?: string;
  size?: number;
};

// A finger touching a point, with an optional ripple to show whether the
// touch "registers" as a reaction. Generic (not tickle-specific) so it's
// reusable for any touch/sensation-themed episode.
export const TouchIcon: React.FC<TouchIconProps> = ({
  active = true,
  color = "#7C5CFF",
  size = 180,
}) => (
  <svg width={size} height={size} viewBox="0 0 180 180">
    {/* skin/surface line */}
    <line x1="20" y1="130" x2="160" y2="130" stroke={color} strokeWidth={6} strokeLinecap="round" opacity={0.5} />
    {/* finger, as a bold rounded capsule pointing down at the contact point */}
    <rect x="68" y="20" width="44" height="100" rx="22" fill={color} />
    {/* ripple rings, only shown when active */}
    <g opacity={active ? 0.85 : 0}>
      <circle cx="90" cy="130" r="26" fill="none" stroke={color} strokeWidth={5} />
      <circle cx="90" cy="130" r="42" fill="none" stroke={color} strokeWidth={4} opacity={0.5} />
    </g>
    {/* flat "nothing happens" marker, shown when not active */}
    <g opacity={active ? 0 : 0.7}>
      <line x1="60" y1="150" x2="120" y2="150" stroke={color} strokeWidth={5} strokeLinecap="round" />
    </g>
  </svg>
);
