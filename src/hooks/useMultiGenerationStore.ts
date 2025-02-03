import { create } from "zustand";
import { persist } from "zustand/middleware";

type GenRange = [number, number];

export type MultiGenrationState = {
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
      // base
      multiHeightOffsets: {},
      getheightOffset: (id) => get().multiHeightOffsets[id] ?? 0,
      setHeightOffset: (id, heightOffset) => set((state) => ({
        multiHeightOffsets: {
          ...state.multiHeightOffsets,
          [id]: heightOffset,
        },
      })),
      multiAnglesRanges: {},
      getAnglesRange: (id) => get().multiAnglesRanges[id] ?? [0, 0],
      setAnglesRange: (id, angleRange) => set((state) => ({
        multiAnglesRanges: {
          ...state.multiAnglesRanges,
          [id]: angleRange,
        },
      })),
      multiAnglesDistributions: {},
      getAnglesDistribution: (id) => get().multiAnglesDistributions[id] ?? 0,
      setAnglesDistribution: (id, angleDistribution) => set((state) => ({
        multiAnglesDistributions: {
          ...state.multiAnglesDistributions,
          [id]: angleDistribution,
        },
      })),

      // pair
      multiDoPairGenerations: {},
      getDoPairGeneration: (id) => get().multiDoPairGenerations[id] ?? false,
      setDoPairGeneration: (id, doPair) => set((state) => ({
        multiDoPairGenerations: {
          ...state.multiDoPairGenerations,
          [id]: doPair,
        },
      })),
      multiPairDistances: {},
      getPairDistance: (id) => get().multiPairDistances[id] ?? [0, 0],
      setPairDistance: (id, distanceRange) => set((state) => ({
        multiPairDistances: {
          ...state.multiPairDistances,
          [id]: distanceRange,
        },
      })),
      multiPairDistanceDistributions: {},
      getPairDistanceDistribution: (id) => get().multiPairDistanceDistributions[id] ?? 0,
      setPairDistanceDistribution: (id, distanceDistribution) => set((state) => ({
        multiPairDistanceDistributions: {
          ...state.multiPairDistanceDistributions,
          [id]: distanceDistribution,
        },
      })),
      multiPairAngles: {},
      getPairAngle: (id) => get().multiPairAngles[id] ?? [0, 0],
      setPairAngle: (id, angleRange) => set((state) => ({
        multiPairAngles: {
          ...state.multiPairAngles,
          [id]: angleRange,
        },
      })),
      multiPairAngleDistributions: {},
      getPairAngleDistribution: (id) => get().multiPairAngleDistributions[id] ?? 0,
      setPairAngleDistribution: (id, angleDistribution) => set((state) => ({
        multiPairAngleDistributions: {
          ...state.multiPairAngleDistributions,
          [id]: angleDistribution,
        },
      })),

      // image
      multiNumImages: {},
      getNumImages: (id) => get().multiNumImages[id] ?? 0,
      setNumImages: (id, numImages) => set((state) => ({
        multiNumImages: {
          ...state.multiNumImages,
          [id]: numImages,
        },
      })),
      multiImageDimensions: {},
      getImageDimensions: (id) => get().multiImageDimensions[id] ?? [0, 0],
      setImageDimensions: (id, dimensions) => set((state) => ({
        multiImageDimensions: {
          ...state.multiImageDimensions,
          [id]: dimensions,
        },
      })),
    }),
    {
      name: 'multi-generation-store',
    }
  )
)

export default useMultiGenerationStore;