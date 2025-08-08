

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
};

const useCameraPoseStore = create<CameraPoseState>((set) => ({
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
}));

export default useCameraPoseStore;