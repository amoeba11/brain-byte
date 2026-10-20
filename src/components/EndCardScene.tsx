import { AbsoluteFill } from "remotion";
import { colors } from "../themes/colors";
import { TextReveal } from "./TextReveal";
import { BackgroundPulse } from "./BackgroundPulse";

type EndCardSceneProps = {
  text: string;
};

// Shared end-card treatment (button line + "Follow for more") used across
// every episode's composition for visual consistency.
export const EndCardScene: React.FC<EndCardSceneProps> = ({ text }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <BackgroundPulse color={colors.accent} />
    <TextReveal fontSize={60} stagger style={{ color: colors.foreground }}>
      {text}
    </TextReveal>
    <div style={{ marginTop: 40 }}>
      <TextReveal
        fontSize={32}
        delay={25}
        style={{ color: colors.accentAlt, fontWeight: 500 }}
      >
        Follow for more
      </TextReveal>
    </div>
  </AbsoluteFill>
);
