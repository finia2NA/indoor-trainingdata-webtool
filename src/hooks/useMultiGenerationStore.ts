import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GenPair = [number, number];

// TODO: make getters create if not exists

const defaults = {
  heightOffset: 0,
  anglesRange: [-10, 10],
  anglesConcentration: 0.5,
  doPairGeneration: false,
  pairDistance: [0, 0.2],
  pairDistanceConcentration: 0.5,
  pairAngle: 10,
  pairAngleConcentration: 0.5,
  numImages: 1000,
  imageDimensions: [256, 256],
}

export type MultiGenrationState = {
  // base
  multiHeightOffsets: Record<number, number>;
  getHeightOffset: (id: number) => number;
  setHeightOffset: (id: number, heightOffset: number) => void;
  multiAnglesRanges: Record<number, GenPair>;
  getAnglesRange: (id: number) => GenPair;
  setAnglesRange: (id: number, angleRange: GenPair) => void;
  multiAnglesConcentrations: Record<number, number>;
  getAnglesConcentration: (id: number) => number;
  setAnglesConcentration: (id: number, angleDistribution: number) => void;
  avoidWalls: Record<number, boolean>;
  getAvoidWalls: (id: number) => boolean;
  setAvoidWalls: (id: number, avoidWalls: boolean) => void;

  // pair
  multiDoPairGenerations: Record<number, boolean>;
  getDoPairGeneration: (id: number) => boolean;
  setDoPairGeneration: (id: number, doPair: boolean) => void;
  multiPairDistanceRanges: Record<number, GenPair>;
  getPairDistanceRange: (id: number) => GenPair;
  setPairDistanceRange: (id: number, distanceRange: GenPair) => void;
  multiPairDistanceConcentrations: Record<number, number>;
  getPairDistanceConcentration: (id: number) => number;
  setPairDistanceConcentration: (id: number, distanceDistribution: number) => void;
  multiPairAngles: Record<number, number>;
  getPairAngle: (id: number) => number;
  setPairAngle: (id: number, angleRange: number) => void;
  multiPairAngleConcentrations: Record<number, number>;
  getPairAngleConcentration: (id: number) => number;
  setPairAngleConcentration: (id: number, angleDistribution: number) => void;

  // image
  multiNumImages: Record<number, number>;
  getNumImages: (id: number) => number;
  setNumImages: (id: number, numImages: number) => void;
  multiImageDimensions: Record<number, GenPair>;
  getImageDimensions: (id: number) => GenPair;
  setImageDimensions: (id: number, dimensions: GenPair) => void;

  reset(id: number): void;
}

const useMultiGenerationStore = create<MultiGenrationState>()(
  persist(
    (set, get) => ({
      // base
      multiHeightOffsets: {},
      getHeightOffset: (id) => get().multiHeightOffsets[id] ?? defaults.heightOffset,
      setHeightOffset: (id, heightOffset) => set((state) => ({
        multiHeightOffsets: {
          ...state.multiHeightOffsets,
          [id]: heightOffset,
        },
      })),
      multiAnglesRanges: {},
      getAnglesRange: (id) => get().multiAnglesRanges[id] ?? defaults.anglesRange,
      setAnglesRange: (id, angleRange) => set((state) => ({
        multiAnglesRanges: {
          ...state.multiAnglesRanges,
          [id]: angleRange,
        },
      })),
      multiAnglesConcentrations: {},
      getAnglesConcentration: (id) => get().multiAnglesConcentrations[id] ?? defaults.anglesConcentration,
      setAnglesConcentration: (id, angleDistribution) => set((state) => ({
        multiAnglesConcentrations: {
          ...state.multiAnglesConcentrations,
          [id]: angleDistribution,
        },
      })),
      avoidWalls: {},
      getAvoidWalls: (id) => get().avoidWalls[id] ?? true,
      setAvoidWalls: (id, avoidWalls) => set((state) => ({
        avoidWalls: {
          ...state.avoidWalls,
          [id]: avoidWalls,
        },
      })),

      // pair
      multiDoPairGenerations: {},
      getDoPairGeneration: (id) => get().multiDoPairGenerations[id] ?? defaults.doPairGeneration,
      setDoPairGeneration: (id, doPair) => set((state) => ({
        multiDoPairGenerations: {
          ...state.multiDoPairGenerations,
          [id]: doPair,
        },
      })),
      multiPairDistanceRanges: {},
      getPairDistanceRange: (id) => get().multiPairDistanceRanges[id] ?? defaults.pairDistance,
      setPairDistanceRange: (id, distanceRange) => set((state) => ({
        multiPairDistanceRanges: {
          ...state.multiPairDistanceRanges,
          [id]: distanceRange,
        },
      })),
      multiPairDistanceConcentrations: {},
      getPairDistanceConcentration: (id) => get().multiPairDistanceConcentrations[id] ?? defaults.pairDistanceConcentration,
      setPairDistanceConcentration: (id, distanceDistribution) => set((state) => ({
        multiPairDistanceConcentrations: {
          ...state.multiPairDistanceConcentrations,
          [id]: distanceDistribution,
        },
      })),
      multiPairAngles: {},
      getPairAngle: (id) => get().multiPairAngles[id] ?? defaults.pairAngle,
      setPairAngle: (id, angleRange) => set((state) => ({
        multiPairAngles: {
          ...state.multiPairAngles,
          [id]: angleRange,
        },
      })),
      multiPairAngleConcentrations: {},
      getPairAngleConcentration: (id) => get().multiPairAngleConcentrations[id] ?? defaults.pairAngleConcentration,
      setPairAngleConcentration: (id, angleDistribution) => set((state) => ({
        multiPairAngleConcentrations: {
          ...state.multiPairAngleConcentrations,
          [id]: angleDistribution,
        },
      })),

      // image
      multiNumImages: {},
      getNumImages: (id) => get().multiNumImages[id] ?? defaults.numImages,
      setNumImages: (id, numImages) => set((state) => ({
        multiNumImages: {
          ...state.multiNumImages,
          [id]: numImages,
        },
      })),
      multiImageDimensions: {},
      getImageDimensions: (id) => get().multiImageDimensions[id] ?? defaults.imageDimensions,
      setImageDimensions: (id, dimensions) => set((state) => ({
        multiImageDimensions: {
          ...state.multiImageDimensions,
          [id]: dimensions,
        },
      })),

      reset: (id) => {
        get().setHeightOffset(id, defaults.heightOffset);
        get().setAnglesRange(id, defaults.anglesRange as GenPair);
        get().setAnglesConcentration(id, defaults.anglesConcentration);
        get().setDoPairGeneration(id, defaults.doPairGeneration);
        get().setPairDistanceRange(id, defaults.pairDistance as GenPair);
        get().setPairDistanceConcentration(id, defaults.pairDistanceConcentration);
        get().setPairAngle(id, defaults.pairAngle);
        get().setPairAngleConcentration(id, defaults.pairAngleConcentration);
        get().setNumImages(id, defaults.numImages);
        get().setImageDimensions(id, defaults.imageDimensions as GenPair);
      }
    }),
    {
      name: 'multi-generation-store',
    }
  )
)

export default useMultiGenerationStore;