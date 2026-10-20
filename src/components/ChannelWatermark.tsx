import { colors } from "../themes/colors";

type ChannelWatermarkProps = {
  /** Channel name/handle — passed in via episode props, never hardcoded here. */
  text?: string;
};

// Small, low-opacity persistent corner mark — just enough to credit the
// channel if a clip gets screenshotted or reposted without the end card.
export const ChannelWatermark: React.FC<ChannelWatermarkProps> = ({ text }) => {
  if (!text) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 36,
        right: 36,
        fontSize: 26,
        fontWeight: 600,
        color: colors.foreground,
        opacity: 0.45,
        letterSpacing: 0.5,
      }}
    >
      {text}
    </div>
  );
};
