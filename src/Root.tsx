import { ExplainerComposition } from "./compositions/Explainer";
import { MirrorFlipComposition } from "./compositions/MirrorFlip";
import { WaveCancelComposition } from "./compositions/WaveCancel";
import { TickleYourselfComposition } from "./compositions/TickleYourself";
import { BatteryTongueComposition } from "./compositions/BatteryTongue";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <ExplainerComposition />
      <MirrorFlipComposition />
      <WaveCancelComposition />
      <TickleYourselfComposition />
      <BatteryTongueComposition />
    </>
  );
};
