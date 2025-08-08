

import { create } from 'zustand';

type CameraPoseState = {
  reactiveCameraPosition: [number, number, number];
  setReactiveCameraPosition: (position: [number, number, number]) => void;

  reactiveCameraRotation: [number, number, number];
  setReactiveCameraRotation: (rotation: [number, number, number]) => void;

  reactiveTarget: [number, number, number];
  setReactiveTarget: (target: [number, number, number]) => void;

  // Programmatic camera movement
  targetCameraPosition: [number, number, number] | null;
  targetCameraTarget: [number, number, number] | null;
  moveCameraTo: (position: [number, number, number], target: [number, number, number]) => void;
  clearCameraTarget: () => void;

  // 360° view state
  is360ViewActive: boolean;
  originalCameraPosition: [number, number, number] | null;
  originalCameraTarget: [number, number, number] | null;
  sphereOpacity: number;
  setSphereOpacity: (opacity: number) => void;
  enter360View: (originalPosition: [number, number, number], originalTarget: [number, number, number]) => void;
  exit360View: () => void;
  exit360ViewWithoutReset: () => void;
};

const useCameraPoseStore = create<CameraPoseState>((set, get) => ({
  reactiveCameraPosition: [0, 0, 0],
  setReactiveCameraPosition: (position) => set({ reactiveCameraPosition: position }),

  reactiveCameraRotation: [0, 0, 0],
  setReactiveCameraRotation: (rotation) => set({ reactiveCameraRotation: rotation }),

  reactiveTarget: [0, 0, 0],
  setReactiveTarget: (target) => set({ reactiveTarget: target }),

  // Programmatic camera movement
  targetCameraPosition: null,
  targetCameraTarget: null,
  moveCameraTo: (position, target) => set({ targetCameraPosition: position, targetCameraTarget: target }),
  clearCameraTarget: () => set({ targetCameraPosition: null, targetCameraTarget: null }),

  // 360° view state
  is360ViewActive: false,
  originalCameraPosition: null,
  originalCameraTarget: null,
  sphereOpacity: 0.5,
  setSphereOpacity: (opacity) => set({ sphereOpacity: opacity }),
  enter360View: (originalPosition, originalTarget) => set({ 
    is360ViewActive: true, 
    originalCameraPosition: originalPosition, 
    originalCameraTarget: originalTarget 
  }),
  exit360View: () => {
    const state = get();
    if (state.originalCameraPosition && state.originalCameraTarget) {
      set({ 
        targetCameraPosition: state.originalCameraPosition,
        targetCameraTarget: state.originalCameraTarget,
        is360ViewActive: false,
        originalCameraPosition: null,
        originalCameraTarget: null
      });
    }
  },
  exit360ViewWithoutReset: () => {
    set({ 
      is360ViewActive: false,
      originalCameraPosition: null,
      originalCameraTarget: null
    });
  },
}));

export default useCameraPoseStore;