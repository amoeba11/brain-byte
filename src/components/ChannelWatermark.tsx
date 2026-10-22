import { colors } from "../themes/colors";

type ChannelWatermarkProps = {
  /** Channel name/handle — passed in via episode props, never hardcoded here. */
  text?: string;
};

// Persistent corner mark — just enough to credit the channel if a clip gets
// screenshotted or reposted without the end card. Has its own translucent
// backing pill so it stays legible over any scene background, not just dark
// ones.
export const ChannelWatermark: React.FC<ChannelWatermarkProps> = ({ text }) => {
  if (!text) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 36,
        right: 36,
        fontSize: 30,
        fontWeight: 700,
        color: colors.foreground,
        opacity: 0.85,
        letterSpacing: 0.5,
        padding: "8px 14px",
        borderRadius: 999,
        backgroundColor: "rgba(0, 0, 0, 0.35)",
      }}
    >
      {text}
    </div>
  );
};
