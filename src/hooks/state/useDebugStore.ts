/**
 * Zustand hook that stores debug settings state.
 * This includes lighting controls and debugging options.
 * Non-persistent and resets when project switches.
 */

import { create } from 'zustand';

export type DebugState = {
  // Ambient Light
  ambientLightActive: boolean;
  setUseAmbientLight: (use: boolean) => void;
  
  ambientLightIntensity: number;
  setAmbientLightIntensity: (intensity: number) => void;
  
  // Point Light
  pointLightActive: boolean;
  setPointLightActive: (active: boolean) => void;
  
  pointLightPosition: [number, number, number];
  setPointLightPosition: (position: [number, number, number]) => void;
  
  pointLightIntensity: number;
  setPointLightIntensity: (intensity: number) => void;
  
  pointLightDistance: number;
  setPointLightDistance: (distance: number) => void;
  
  pointLightDecay: number;
  setPointLightDecay: (decay: number) => void;
  
  // Screenshot debug options
  renderScreenshotsFromAbove: boolean;
  setRenderScreenshotsFromAbove: (fromAbove: boolean) => void;
  
  // Offscreen rendering debug options
  doCleanup: boolean;
  setDoCleanup: (cleanup: boolean) => void;
  
  debugRenderTargets: boolean;
  setDebugRenderTargets: (debug: boolean) => void;
  
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
  ambientLightActive: true,
  setUseAmbientLight: (use: boolean) => set({ ambientLightActive: use }),
  
  ambientLightIntensity: 1,
  setAmbientLightIntensity: (intensity: number) => set({ ambientLightIntensity: intensity }),
  
  // Point Light defaults
  pointLightActive: false,
  setPointLightActive: (active: boolean) => set({ pointLightActive: active }),
  
  pointLightPosition: [0, 5, 0],
  setPointLightPosition: (position: [number, number, number]) => set({ pointLightPosition: position }),
  
  pointLightIntensity: 1,
  setPointLightIntensity: (intensity: number) => set({ pointLightIntensity: intensity }),
  
  pointLightDistance: 0,
  setPointLightDistance: (distance: number) => set({ pointLightDistance: distance }),
  
  pointLightDecay: 2,
  setPointLightDecay: (decay: number) => set({ pointLightDecay: decay }),
  
  // Screenshot debug options defaults
  renderScreenshotsFromAbove: false,
  setRenderScreenshotsFromAbove: (fromAbove: boolean) => set({ renderScreenshotsFromAbove: fromAbove }),
  
  // Offscreen rendering debug options defaults
  doCleanup: false,
  setDoCleanup: (cleanup: boolean) => set({ doCleanup: cleanup }),
  
  debugRenderTargets: false,
  setDebugRenderTargets: (debug: boolean) => set({ debugRenderTargets: debug }),
  
  // Measuring defaults
  measuringActive: false,
  setMeasuringActive: (active: boolean) => set({ measuringActive: active }),
  measuredPoint: null,
  setMeasuredPoint: (pt: [number, number, number]) => set({ measuredPoint: pt }),
  clearMeasuredPoint: () => set({ measuredPoint: null }),
  
  resetDebugConfig: () => set({
    ambientLightActive: true,
    ambientLightIntensity: 1,
    pointLightActive: false,
    pointLightPosition: [0, 5, 0],
    pointLightIntensity: 1,
    pointLightDistance: 0,
    pointLightDecay: 2,
    renderScreenshotsFromAbove: false,
    doCleanup: false,
    debugRenderTargets: false,
    measuringActive: false,
    measuredPoint: null,
  }),
}));

export default useDebugStore;