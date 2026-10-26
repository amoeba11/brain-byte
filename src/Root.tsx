import { ExplainerComposition } from "./compositions/Explainer";
import { MirrorFlipComposition } from "./compositions/MirrorFlip";
import { WaveCancelComposition } from "./compositions/WaveCancel";
import { TickleYourselfComposition } from "./compositions/TickleYourself";
import { BatteryTongueComposition } from "./compositions/BatteryTongue";
import { HumPinchedNoseComposition } from "./compositions/HumPinchedNose";
import { PrunedFingersComposition } from "./compositions/PrunedFingers";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <ExplainerComposition />
      <MirrorFlipComposition />
      <WaveCancelComposition />
      <TickleYourselfComposition />
      <BatteryTongueComposition />
      <HumPinchedNoseComposition />
      <PrunedFingersComposition />
    </>
  );
};
