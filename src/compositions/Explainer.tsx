import { Composition } from "remotion";
import { colors } from "../themes/colors";

type ExplainerProps = {
  title: string;
};

// Vertical, short-form template for Shorts/Reels (9:16, <60s at 30fps).
export const ExplainerComposition = () => {
  return (
    <Composition
      id="Explainer"
      component={Explainer}
      durationInFrames={30 * 45}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ title: "Untitled Episode" } satisfies ExplainerProps}
    />
  );
};

export const Explainer: React.FC<ExplainerProps> = ({ title }) => {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
        color: colors.foreground,
        fontFamily: "Inter, sans-serif",
        fontSize: 64,
        fontWeight: 700,
        textAlign: "center",
        padding: 80,
      }}
    >
      {title}
    </div>
  );
};
