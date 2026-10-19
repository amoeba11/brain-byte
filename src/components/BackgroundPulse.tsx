import { useCurrentFrame } from "remotion";

type BackgroundPulseProps = {
  color: string;
  size?: number;
};

// A soft, slowly breathing glow behind content — adds life to otherwise
// static text-only scenes without being distracting.
export const BackgroundPulse: React.FC<BackgroundPulseProps> = ({
  color,
  size = 700,
}) => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 20) * 0.08;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        opacity: 0.35,
        transform: `translate(-50%, -50%) scale(${pulse})`,
        filter: "blur(10px)",
      }}
    />
  );
};
