// src/hooks/usePolygonCreatorStore.ts
import { create } from 'zustand';

interface PolygonCreatorState {
  height: number;
  // eslint-disable-next-line no-unused-vars
  setHeight: (newHeight: number) => void;

  size: number;
  // eslint-disable-next-line no-unused-vars
  setSize: (newSize: number) => void;
}

const usePolygonCreatorStore = create<PolygonCreatorState>((set) => ({
  height: 0,
  size: 5,
  setHeight: (newHeight) => set({ height: newHeight }),
  setSize: (newSize) => set({ size: newSize }),
}));

export default usePolygonCreatorStore;