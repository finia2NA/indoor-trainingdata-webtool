

import { create } from 'zustand';

type CameraPoseState = {
  cameraPosition: [number, number, number];
  setCameraPosition: (position: [number, number, number]) => void;

  cameraRotation: [number, number, number];
  setCameraRotation: (rotation: [number, number, number]) => void;
};

const useCameraPoseStore = create<CameraPoseState>((set) => ({
  cameraPosition: [0, 0, 0],
  setCameraPosition: (position) => set({ cameraPosition: position }),

  cameraRotation: [0, 0, 0],
  setCameraRotation: (rotation) => set({ cameraRotation: rotation }),
}));

export default useCameraPoseStore;