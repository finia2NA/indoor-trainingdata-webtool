/**
 * Zustand hook that stores debug settings state.
 * This includes lighting controls and debugging options.
 * Non-persistent and resets when project switches.
 */

import { create } from 'zustand';

export type DebugState = {
  // Ambient Light
  useAmbientLight: boolean;
  setUseAmbientLight: (use: boolean) => void;
  
  ambientLightIntensity: number;
  setAmbientLightIntensity: (intensity: number) => void;
  
  // Point Light
  pointLightActive: boolean;
  setPointLightActive: (active: boolean) => void;
  
  pointLightX: number;
  setPointLightX: (x: number) => void;
  
  pointLightY: number;
  setPointLightY: (y: number) => void;
  
  pointLightZ: number;
  setPointLightZ: (z: number) => void;
  
  pointLightIntensity: number;
  setPointLightIntensity: (intensity: number) => void;
  
  pointLightDistance: number;
  setPointLightDistance: (distance: number) => void;
  
  pointLightDecay: number;
  setPointLightDecay: (decay: number) => void;
  
  // Screenshot debug options
  renderScreenshotsFromAbove: boolean;
  setRenderScreenshotsFromAbove: (fromAbove: boolean) => void;
  
  // Measuring
  measuringActive: boolean;
  setMeasuringActive: (active: boolean) => void;
  measuredPoint: [number, number, number] | null;
  setMeasuredPoint: (pt: [number, number, number]) => void;
  clearMeasuredPoint: () => void;
  
  // Reset function for project switches
  resetDebugConfig: () => void;
};

// Store creation
const useDebugStore = create<DebugState>((set) => ({
  // Ambient Light defaults
  useAmbientLight: true,
  setUseAmbientLight: (use: boolean) => set({ useAmbientLight: use }),
  
  ambientLightIntensity: 1,
  setAmbientLightIntensity: (intensity: number) => set({ ambientLightIntensity: intensity }),
  
  // Point Light defaults
  pointLightActive: false,
  setPointLightActive: (active: boolean) => set({ pointLightActive: active }),
  
  pointLightX: 0,
  setPointLightX: (x: number) => set({ pointLightX: x }),
  
  pointLightY: 5,
  setPointLightY: (y: number) => set({ pointLightY: y }),
  
  pointLightZ: 0,
  setPointLightZ: (z: number) => set({ pointLightZ: z }),
  
  pointLightIntensity: 1,
  setPointLightIntensity: (intensity: number) => set({ pointLightIntensity: intensity }),
  
  pointLightDistance: 0,
  setPointLightDistance: (distance: number) => set({ pointLightDistance: distance }),
  
  pointLightDecay: 2,
  setPointLightDecay: (decay: number) => set({ pointLightDecay: decay }),
  
  // Screenshot debug options defaults
  renderScreenshotsFromAbove: false,
  setRenderScreenshotsFromAbove: (fromAbove: boolean) => set({ renderScreenshotsFromAbove: fromAbove }),
  
  // Measuring defaults
  measuringActive: false,
  setMeasuringActive: (active: boolean) => set({ measuringActive: active }),
  measuredPoint: null,
  setMeasuredPoint: (pt: [number, number, number]) => set({ measuredPoint: pt }),
  clearMeasuredPoint: () => set({ measuredPoint: null }),
  
  resetDebugConfig: () => set({
    useAmbientLight: true,
    ambientLightIntensity: 1,
    pointLightActive: false,
    pointLightX: 0,
    pointLightY: 5,
    pointLightZ: 0,
    pointLightIntensity: 1,
    pointLightDistance: 0,
    pointLightDecay: 2,
    renderScreenshotsFromAbove: false,
    measuringActive: false,
    measuredPoint: null,
  }),
}));

export default useDebugStore;