import { ExplainerComposition } from "./compositions/Explainer";
import { MirrorFlipComposition } from "./compositions/MirrorFlip";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <ExplainerComposition />
      <MirrorFlipComposition />
    </>
  );
};
