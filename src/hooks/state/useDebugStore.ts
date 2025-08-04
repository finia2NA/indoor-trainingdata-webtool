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
  
  // Reset function for project switches
  resetDebugConfig: () => void;
};

// Store creation
const useDebugStore = create<DebugState>((set) => ({
  // Ambient Light defaults
  useAmbientLight: true,
  setUseAmbientLight: (use: boolean) => set({ useAmbientLight: use }),
  
  ambientLightIntensity: 0.5,
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
  
  resetDebugConfig: () => set({
    useAmbientLight: true,
    ambientLightIntensity: 0.5,
    pointLightActive: false,
    pointLightX: 0,
    pointLightY: 5,
    pointLightZ: 0,
  }),
}));

export default useDebugStore;