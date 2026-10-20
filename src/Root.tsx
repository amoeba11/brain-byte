import { ExplainerComposition } from "./compositions/Explainer";
import { MirrorFlipComposition } from "./compositions/MirrorFlip";
import { WaveCancelComposition } from "./compositions/WaveCancel";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <ExplainerComposition />
      <MirrorFlipComposition />
      <WaveCancelComposition />
    </>
  );
};
