import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GenPair = [number, number];

// TODO: make getters create if not exists

const defaults = {
  heightOffset: 0,
  anglesRange: [-10, 10],
  anglesConcentration: 0.5,
  avoidWalls: false,
  doPairGeneration: false,
  pairDistance: [0, 0.2],
  pairDistanceConcentration: 0.5,
  pairAngle: 10,
  pairAngleConcentration: 0.5,
  fovRange: [60, 90],
  fovConcentration: 0.5,
  numSeries: 1000,
  imageDimensions: [256, 256],
  usePosttrainingImages: false,
  numPosttrainingImages: 0,
  use360Shading: false,
  maxShadingImages: 10,
  maxShadingDistance: 1.0,
  pitchAngleRange: [-40, 90],
  maxImagesToKeep: 4,
  influenceRange: [0.31, 5.0], // [fullInfluenceUntil, zeroInfluenceAt]
  weightingMode: 'linear',
  polynomialExponent: 2.0,
  exponentialBase: 2.0,
  polynomialMultiplier: 100.0,
  exponentialMultiplier: 10.0,
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
  multiFovRanges: Record<number, GenPair>;
  multiFovConcentrations: Record<number, number>;
  getFovRange: (id: number) => GenPair;
  setFovRange: (id: number, fovRange: GenPair) => void;
  getFovConcentration: (id: number) => number;
  setFovConcentration: (id: number, fovDistribution: number) => void;
  multiNumSeries: Record<number, number>;
  getNumSeries: (id: number) => number;
  setNumSeries: (id: number, numSeries: number) => void;
  multiImageDimensions: Record<number, GenPair>;
  getImageDimensions: (id: number) => GenPair;
  setImageDimensions: (id: number, dimensions: GenPair) => void;

  // posttraining
  multiUsePosttrainingImages: Record<number, boolean>;
  getUsePosttrainingImages: (id: number) => boolean;
  setUsePosttrainingImages: (id: number, usePosttraining: boolean) => void;
  multiNumPosttrainingImages: Record<number, number>;
  getNumPosttrainingImages: (id: number) => number;
  setNumPosttrainingImages: (id: number, numImages: number) => void;

  // shading
  multiUse360Shading: Record<number, boolean>;
  getUse360Shading: (id: number) => boolean;
  setUse360Shading: (id: number, use360Shading: boolean) => void;
  multiMaxShadingImages: Record<number, number>;
  getMaxShadingImages: (id: number) => number;
  setMaxShadingImages: (id: number, maxImages: number) => void;
  multiMaxShadingDistance: Record<number, number>;
  getMaxShadingDistance: (id: number) => number;
  setMaxShadingDistance: (id: number, maxDistance: number) => void;
  multiPitchAngleRanges: Record<number, GenPair>;
  getPitchAngleRange: (id: number) => GenPair;
  setPitchAngleRange: (id: number, pitchRange: GenPair) => void;

  // advanced 360 shading
  multiMaxImagesToKeep: Record<number, number>;
  getMaxImagesToKeep: (id: number) => number;
  setMaxImagesToKeep: (id: number, maxImages: number) => void;
  multiInfluenceRanges: Record<number, GenPair>;
  getInfluenceRange: (id: number) => GenPair;
  setInfluenceRange: (id: number, influenceRange: GenPair) => void;
  multiWeightingModes: Record<number, string>;
  getWeightingMode: (id: number) => string;
  setWeightingMode: (id: number, mode: string) => void;
  multiPolynomialExponents: Record<number, number>;
  getPolynomialExponent: (id: number) => number;
  setPolynomialExponent: (id: number, exponent: number) => void;
  multiExponentialBases: Record<number, number>;
  getExponentialBase: (id: number) => number;
  setExponentialBase: (id: number, base: number) => void;
  multiPolynomialMultipliers: Record<number, number>;
  getPolynomialMultiplier: (id: number) => number;
  setPolynomialMultiplier: (id: number, multiplier: number) => void;
  multiExponentialMultipliers: Record<number, number>;
  getExponentialMultiplier: (id: number) => number;
  setExponentialMultiplier: (id: number, multiplier: number) => void;

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
      getAvoidWalls: (id) => get().avoidWalls[id] ?? defaults.avoidWalls,
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
      multiFovRanges: {},
      multiFovConcentrations: {},
      getFovRange: (id) => get().multiFovRanges[id] ?? defaults.fovRange,
      setFovRange: (id, fovRange) => set((state) => ({
        multiFovRanges: {
          ...state.multiFovRanges,
          [id]: fovRange,
        },
      })),
      getFovConcentration: (id) => get().multiFovConcentrations[id] ?? defaults.fovConcentration,
      setFovConcentration: (id, fovDistribution) => set((state) => ({
        multiFovConcentrations: {
          ...state.multiFovConcentrations,
          [id]: fovDistribution,
        },
      })),
      multiNumSeries: {},
      getNumSeries: (id) => get().multiNumSeries[id] ?? defaults.numSeries,
      setNumSeries: (id, numSeries) => set((state) => ({
        multiNumSeries: {
          ...state.multiNumSeries,
          [id]: numSeries,
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

      // posttraining
      multiUsePosttrainingImages: {},
      getUsePosttrainingImages: (id) => get().multiUsePosttrainingImages[id] ?? defaults.usePosttrainingImages,
      setUsePosttrainingImages: (id, usePosttraining) => set((state) => ({
        multiUsePosttrainingImages: {
          ...state.multiUsePosttrainingImages,
          [id]: usePosttraining,
        },
      })),
      multiNumPosttrainingImages: {},
      getNumPosttrainingImages: (id) => get().multiNumPosttrainingImages[id] ?? defaults.numPosttrainingImages,
      setNumPosttrainingImages: (id, numImages) => set((state) => ({
        multiNumPosttrainingImages: {
          ...state.multiNumPosttrainingImages,
          [id]: numImages,
        },
      })),

      // shading
      multiUse360Shading: {},
      getUse360Shading: (id) => get().multiUse360Shading[id] ?? defaults.use360Shading,
      setUse360Shading: (id, use360Shading) => set((state) => ({
        multiUse360Shading: {
          ...state.multiUse360Shading,
          [id]: use360Shading,
        },
      })),
      multiMaxShadingImages: {},
      getMaxShadingImages: (id) => get().multiMaxShadingImages[id] ?? defaults.maxShadingImages,
      setMaxShadingImages: (id, maxImages) => set((state) => ({
        multiMaxShadingImages: {
          ...state.multiMaxShadingImages,
          [id]: maxImages,
        },
      })),
      multiMaxShadingDistance: {},
      getMaxShadingDistance: (id) => get().multiMaxShadingDistance[id] ?? defaults.maxShadingDistance,
      setMaxShadingDistance: (id, maxDistance) => set((state) => ({
        multiMaxShadingDistance: {
          ...state.multiMaxShadingDistance,
          [id]: maxDistance,
        },
      })),
      multiPitchAngleRanges: {},
      getPitchAngleRange: (id) => get().multiPitchAngleRanges[id] ?? defaults.pitchAngleRange,
      setPitchAngleRange: (id, pitchRange) => set((state) => ({
        multiPitchAngleRanges: {
          ...state.multiPitchAngleRanges,
          [id]: pitchRange,
        },
      })),

      // advanced 360 shading
      multiMaxImagesToKeep: {},
      getMaxImagesToKeep: (id) => get().multiMaxImagesToKeep[id] ?? defaults.maxImagesToKeep,
      setMaxImagesToKeep: (id, maxImages) => set((state) => ({
        multiMaxImagesToKeep: {
          ...state.multiMaxImagesToKeep,
          [id]: maxImages,
        },
      })),
      multiInfluenceRanges: {},
      getInfluenceRange: (id) => get().multiInfluenceRanges[id] ?? defaults.influenceRange,
      setInfluenceRange: (id, influenceRange) => set((state) => ({
        multiInfluenceRanges: {
          ...state.multiInfluenceRanges,
          [id]: influenceRange,
        },
      })),
      multiWeightingModes: {},
      getWeightingMode: (id) => get().multiWeightingModes[id] ?? defaults.weightingMode,
      setWeightingMode: (id, mode) => set((state) => ({
        multiWeightingModes: {
          ...state.multiWeightingModes,
          [id]: mode,
        },
      })),
      multiPolynomialExponents: {},
      getPolynomialExponent: (id) => get().multiPolynomialExponents[id] ?? defaults.polynomialExponent,
      setPolynomialExponent: (id, exponent) => set((state) => ({
        multiPolynomialExponents: {
          ...state.multiPolynomialExponents,
          [id]: exponent,
        },
      })),
      multiExponentialBases: {},
      getExponentialBase: (id) => get().multiExponentialBases[id] ?? defaults.exponentialBase,
      setExponentialBase: (id, base) => set((state) => ({
        multiExponentialBases: {
          ...state.multiExponentialBases,
          [id]: base,
        },
      })),
      multiPolynomialMultipliers: {},
      getPolynomialMultiplier: (id) => get().multiPolynomialMultipliers[id] ?? defaults.polynomialMultiplier,
      setPolynomialMultiplier: (id, multiplier) => set((state) => ({
        multiPolynomialMultipliers: {
          ...state.multiPolynomialMultipliers,
          [id]: multiplier,
        },
      })),
      multiExponentialMultipliers: {},
      getExponentialMultiplier: (id) => get().multiExponentialMultipliers[id] ?? defaults.exponentialMultiplier,
      setExponentialMultiplier: (id, multiplier) => set((state) => ({
        multiExponentialMultipliers: {
          ...state.multiExponentialMultipliers,
          [id]: multiplier,
        },
      })),

      reset: (id) => {
        get().setHeightOffset(id, defaults.heightOffset);
        get().setAnglesRange(id, defaults.anglesRange as GenPair);
        get().setAnglesConcentration(id, defaults.anglesConcentration);
        get().setAvoidWalls(id, defaults.avoidWalls);

        get().setDoPairGeneration(id, defaults.doPairGeneration);
        get().setPairDistanceRange(id, defaults.pairDistance as GenPair);
        get().setPairDistanceConcentration(id, defaults.pairDistanceConcentration);
        get().setPairAngle(id, defaults.pairAngle);
        get().setPairAngleConcentration(id, defaults.pairAngleConcentration);

        get().setFovRange(id, defaults.fovRange as GenPair);
        get().setFovConcentration(id, defaults.fovConcentration);
        get().setNumSeries(id, defaults.numSeries);
        get().setImageDimensions(id, defaults.imageDimensions as GenPair);

        get().setUsePosttrainingImages(id, defaults.usePosttrainingImages);
        get().setNumPosttrainingImages(id, defaults.numPosttrainingImages);

        get().setUse360Shading(id, defaults.use360Shading);
        get().setMaxShadingImages(id, defaults.maxShadingImages);
        get().setMaxShadingDistance(id, defaults.maxShadingDistance);
        get().setPitchAngleRange(id, defaults.pitchAngleRange as GenPair);

        get().setMaxImagesToKeep(id, defaults.maxImagesToKeep);
        get().setInfluenceRange(id, defaults.influenceRange as GenPair);
        get().setWeightingMode(id, defaults.weightingMode);
        get().setPolynomialExponent(id, defaults.polynomialExponent);
        get().setExponentialBase(id, defaults.exponentialBase);
        get().setPolynomialMultiplier(id, defaults.polynomialMultiplier);
        get().setExponentialMultiplier(id, defaults.exponentialMultiplier);
      }
    }),
    {
      name: 'multi-generation-store',
    }
  )
)

export default useMultiGenerationStore;