import { ExplainerComposition } from "./compositions/Explainer";
import { MirrorFlipComposition } from "./compositions/MirrorFlip";
import { WaveCancelComposition } from "./compositions/WaveCancel";
import { TickleYourselfComposition } from "./compositions/TickleYourself";
import { BatteryTongueComposition } from "./compositions/BatteryTongue";
import { HumPinchedNoseComposition } from "./compositions/HumPinchedNose";
import { PrunedFingersComposition } from "./compositions/PrunedFingers";
import { MetalColderComposition } from "./compositions/MetalColder";
import { StareDotComposition } from "./compositions/StareDot";
import { BlindSpotComposition } from "./compositions/BlindSpot";
import { ChronostasisComposition } from "./compositions/Chronostasis";
import { CountTheFsComposition } from "./compositions/CountTheFs";
import { StroopTestComposition } from "./compositions/StroopTest";
import { FootCircleComposition } from "./compositions/FootCircle";
import { QrSquaresComposition } from "./compositions/QrSquares";

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
      <MetalColderComposition />
      <StareDotComposition />
      <BlindSpotComposition />
      <ChronostasisComposition />
      <CountTheFsComposition />
      <StroopTestComposition />
      <FootCircleComposition />
      <QrSquaresComposition />
    </>
  );
};
