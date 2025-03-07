

import { create } from 'zustand';

type CameraPoseState = {
  reactiveCameraPosition: [number, number, number];
  setReactiveCameraPosition: (position: [number, number, number]) => void;

  reactiveCameraRotation: [number, number, number];
  setReactiveCameraRotation: (rotation: [number, number, number]) => void;

  reactiveTarget: [number, number, number];
  setReactiveTarget: (target: [number, number, number]) => void;
};

const useCameraPoseStore = create<CameraPoseState>((set) => ({
  reactiveCameraPosition: [0, 0, 0],
  setReactiveCameraPosition: (position) => set({ reactiveCameraPosition: position }),

  reactiveCameraRotation: [0, 0, 0],
  setReactiveCameraRotation: (rotation) => set({ reactiveCameraRotation: rotation }),

  reactiveTarget: [0, 0, 0],
  setReactiveTarget: (target) => set({ reactiveTarget: target }),
}));

export default useCameraPoseStore;