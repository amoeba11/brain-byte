import { useCurrentFrame } from "remotion";

type TickleAttemptProps = {
  color: string;
  size?: number;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// A stick figure whose arm repeatedly reaches in to tickle its own side,
// with a tiny ripple at the contact point that instantly fizzles out —
// nothing happens, on a short repeating cycle. Built for the "why can't you
// tickle yourself" hook, but generic enough to reuse for any "try this
// yourself" demo beat.
export const TickleAttempt: React.FC<TickleAttemptProps> = ({ color, size = 240 }) => {
  const frame = useCurrentFrame();
  const cycle = 42;
  const local = frame % cycle;

  const armT = (() => {
    if (local < 5) return local / 5;
    if (local < 18) return 1;
    if (local < 24) return 1 - (local - 18) / 6;
    return 0;
  })();

  const shoulder = { x: 100, y: 112 };
  const restHand = { x: 148, y: 205 };
  const touchHand = { x: 98, y: 152 };
  const handX = lerp(restHand.x, touchHand.x, armT);
  const handY = lerp(restHand.y, touchHand.y, armT);
  const elbowX = lerp(shoulder.x, handX, 0.55) + 14;
  const elbowY = lerp(shoulder.y, handY, 0.55);

  const rippleT = local < 24 ? Math.min(Math.max((local - 5) / 7, 0), 1) : 0;
  const rippleFade = local < 24 ? Math.min(Math.max(1 - (local - 12) / 6, 0), 1) : 0;

  return (
    <svg width={size} height={size * 1.35} viewBox="0 0 200 270">
      {/* head */}
      <circle cx="100" cy="55" r="30" fill={color} />
      {/* torso */}
      <line x1="100" y1="85" x2="100" y2="190" stroke={color} strokeWidth={10} strokeLinecap="round" />
      {/* resting arm */}
      <line x1="100" y1="112" x2="60" y2="165" stroke={color} strokeWidth={10} strokeLinecap="round" />
      {/* legs */}
      <line x1="100" y1="190" x2="72" y2="260" stroke={color} strokeWidth={10} strokeLinecap="round" />
      <line x1="100" y1="190" x2="128" y2="260" stroke={color} strokeWidth={10} strokeLinecap="round" />
      {/* tickling arm */}
      <line
        x1="100"
        y1="112"
        x2={elbowX}
        y2={elbowY}
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
      />
      <line
        x1={elbowX}
        y1={elbowY}
        x2={handX}
        y2={handY}
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
      />
      {/* contact ripple that instantly fizzles — nothing happens */}
      <circle
        cx={handX}
        cy={handY}
        r={24 * rippleT}
        fill="none"
        stroke={color}
        strokeWidth={4}
        opacity={rippleFade * 0.9}
      />
    </svg>
  );
};
