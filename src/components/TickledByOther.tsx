import { useCurrentFrame } from "remotion";

type TickledByOtherProps = {
  color: string;
  size?: number;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// A stick figure being tickled by someone else's hand reaching in from off
// to the side — the figure wobbles/reacts and the contact point keeps
// rippling continuously (unpredictable touch that actually registers),
// contrasting with TickleAttempt's single ripple that instantly fizzles.
export const TickledByOther: React.FC<TickledByOtherProps> = ({ color, size = 240 }) => {
  const frame = useCurrentFrame();
  const cycle = 42;
  const local = frame % cycle;

  const reachT = (() => {
    if (local < 6) return local / 6;
    if (local < 32) return 1;
    if (local < 38) return 1 - (local - 32) / 6;
    return 0;
  })();

  const handX = lerp(235, 142, reachT);
  const handY = 150;
  const wobble = reachT > 0.4 ? Math.sin(frame / 2.2) * 4.5 : 0;

  const rippleLocal = local % 12;
  const rippleT = rippleLocal / 12;
  const rippleActive = reachT > 0.5;

  return (
    <svg width={size} height={size * 1.35} viewBox="0 0 200 270">
      <g style={{ transformOrigin: "100px 140px" }} transform={`rotate(${wobble})`}>
        {/* head */}
        <circle cx="100" cy="55" r="30" fill={color} />
        {/* torso */}
        <line x1="100" y1="85" x2="100" y2="190" stroke={color} strokeWidth={10} strokeLinecap="round" />
        {/* both arms, reacting outward slightly when touched */}
        <line
          x1="100"
          y1="112"
          x2={60 - (rippleActive ? 8 : 0)}
          y2="165"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
        />
        <line x1="100" y1="112" x2="138" y2="162" stroke={color} strokeWidth={10} strokeLinecap="round" opacity={0.85} />
        {/* legs */}
        <line x1="100" y1="190" x2="72" y2="260" stroke={color} strokeWidth={10} strokeLinecap="round" />
        <line x1="100" y1="190" x2="128" y2="260" stroke={color} strokeWidth={10} strokeLinecap="round" />
      </g>

      {/* someone else's hand/forearm reaching in from the side */}
      <line
        x1={handX + 42}
        y1={handY - 14}
        x2={handX}
        y2={handY}
        stroke={color}
        strokeWidth={9}
        strokeLinecap="round"
        opacity={0.55}
      />
      <circle cx={handX} cy={handY} r="8" fill={color} opacity={0.55} />

      {/* continuous ripple while the touch is happening — keeps registering */}
      {rippleActive && (
        <circle
          cx={handX}
          cy={handY}
          r={22 * rippleT}
          fill="none"
          stroke={color}
          strokeWidth={4}
          opacity={(1 - rippleT) * 0.9}
        />
      )}
    </svg>
  );
};
