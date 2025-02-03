import { create } from "zustand";
import { persist } from "zustand/middleware";

type GenRange = [number, number];

type MultiGenrationState = {
  // base
  multiHeightOffsets: Record<number, number>;
  getheightOffset: (id: number) => number;
  setHeightOffset: (id: number, heightOffset: number) => void;
  multiAnglesRanges: Record<number, GenRange>;
  getAnglesRange: (id: number) => GenRange;
  setAnglesRange: (id: number, angleRange: GenRange) => void;
  multiAnglesDistributions: Record<number, number>;
  getAnglesDistribution: (id: number) => number;
  setAnglesDistribution: (id: number, angleDistribution: number) => void;

  // pair
  multiDoPairGenerations: Record<number, boolean>;
  getDoPairGeneration: (id: number) => boolean;
  setDoPairGeneration: (id: number, doPair: boolean) => void;
  multiPairDistances: Record<number, GenRange>;
  getPairDistance: (id: number) => GenRange;
  setPairDistance: (id: number, distanceRange: GenRange) => void;
  multiPairDistanceDistributions: Record<number, number>;
  getPairDistanceDistribution: (id: number) => number;
  setPairDistanceDistribution: (id: number, distanceDistribution: number) => void;
  multiPairAngles: Record<number, GenRange>;
  getPairAngle: (id: number) => GenRange;
  setPairAngle: (id: number, angleRange: GenRange) => void;
  multiPairAngleDistributions: Record<number, number>;
  getPairAngleDistribution: (id: number) => number;
  setPairAngleDistribution: (id: number, angleDistribution: number) => void;

  // image
  multiNumImages: Record<number, number>;
  getNumImages: (id: number) => number;
  setNumImages: (id: number, numImages: number) => void;
  multiImageDimensions: Record<number, [number, number]>;
  getImageDimensions: (id: number) => [number, number];
  setImageDimensions: (id: number, dimensions: [number, number]) => void;
}

const useMultiGenerationStore = create<MultiGenrationState>()(
  persist(
    (set, get) => ({
    }),
    {
      name: 'multi-generation-store',
    }
  )
)