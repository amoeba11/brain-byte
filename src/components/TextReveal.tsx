import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import type { CSSProperties } from "react";

type TextRevealProps = {
  children: string;
  delay?: number;
  fontSize?: number;
  style?: CSSProperties;
  /** Pop the text in word-by-word instead of as one block — more energetic. */
  stagger?: boolean;
};

const BOUNCY_SPRING = { damping: 11, mass: 0.6, stiffness: 140 };

// Punchy slide-up + fade-in, with a little spring overshoot for bounce.
export const TextReveal: React.FC<TextRevealProps> = ({
  children,
  delay = 0,
  fontSize = 56,
  style,
  stagger = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!stagger) {
    const local = Math.max(0, frame - delay);
    const progress = spring({ frame: local, fps, config: BOUNCY_SPRING });
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
  }

  const words = children.split(" ");

  return (
    <div
      style={{
        fontSize,
        fontWeight: 700,
        textAlign: "center",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "0 0.3em",
        ...style,
      }}
    >
      {words.map((word, i) => {
        const local = Math.max(0, frame - delay - i * 3);
        const progress = spring({ frame: local, fps, config: BOUNCY_SPRING });
        const opacity = interpolate(progress, [0, 1], [0, 1]);
        const scale = interpolate(progress, [0, 1], [0.4, 1]);
        const translateY = interpolate(progress, [0, 1], [30, 0]);

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity,
              transform: `translateY(${translateY}px) scale(${scale})`,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
