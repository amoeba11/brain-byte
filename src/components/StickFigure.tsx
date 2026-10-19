import { colors } from "../themes/colors";

type StickFigureProps = {
  /** Which arm is raised, from the figure's own point of view. */
  raisedArm?: "left" | "right" | "none";
  /** Mirror the whole figure horizontally (used for the reflection copy). */
  mirrored?: boolean;
  /** Rotate the figure 180° in-plane, simulating a person turning to face you. */
  turnedAround?: boolean;
  highlightColor?: string;
  width?: number;
};

// A simple SVG stick figure used for the mirror-reflection demo. Kept generic
// (not mirror-specific logic baked in beyond the props) so it's reusable for
// future episodes that need a simple human figure.
export const StickFigure: React.FC<StickFigureProps> = ({
  raisedArm = "none",
  mirrored = false,
  turnedAround = false,
  highlightColor = colors.accentAlt,
  width = 220,
}) => {
  const raisedIsLeft = raisedArm === "left";
  const raisedIsRight = raisedArm === "right";

  return (
    <svg
      viewBox="0 0 200 320"
      width={width}
      style={{
        transform: `scaleX(${mirrored ? -1 : 1}) rotate(${
          turnedAround ? 180 : 0
        }deg)`,
      }}
    >
      {/* head */}
      <circle cx="100" cy="50" r="30" fill={colors.foreground} />
      {/* body */}
      <line
        x1="100"
        y1="80"
        x2="100"
        y2="200"
        stroke={colors.foreground}
        strokeWidth={10}
        strokeLinecap="round"
      />
      {/* left arm (figure's own left, i.e. viewer's right when facing us) */}
      <line
        x1="100"
        y1="110"
        x2={raisedIsLeft ? "165" : "140"}
        y2={raisedIsLeft ? "40" : "170"}
        stroke={raisedIsLeft ? highlightColor : colors.foreground}
        strokeWidth={10}
        strokeLinecap="round"
      />
      {/* right arm (figure's own right) */}
      <line
        x1="100"
        y1="110"
        x2={raisedIsRight ? "35" : "60"}
        y2={raisedIsRight ? "40" : "170"}
        stroke={raisedIsRight ? highlightColor : colors.foreground}
        strokeWidth={10}
        strokeLinecap="round"
      />
      {/* legs */}
      <line
        x1="100"
        y1="200"
        x2="70"
        y2="300"
        stroke={colors.foreground}
        strokeWidth={10}
        strokeLinecap="round"
      />
      <line
        x1="100"
        y1="200"
        x2="130"
        y2="300"
        stroke={colors.foreground}
        strokeWidth={10}
        strokeLinecap="round"
      />
    </svg>
  );
};
