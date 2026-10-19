import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import type { CSSProperties } from "react";

type TextRevealProps = {
  children: string;
  delay?: number;
  fontSize?: number;
  style?: CSSProperties;
};

// Punchy slide-up + fade-in, tuned for fast short-form pacing.
export const TextReveal: React.FC<TextRevealProps> = ({
  children,
  delay = 0,
  fontSize = 56,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, frame - delay);

  const progress = spring({ frame: local, fps, config: { damping: 200 } });
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [24, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        fontSize,
        fontWeight: 700,
        textAlign: "center",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
