// src/hooks/usePolygonCreatorStore.ts
import { create } from 'zustand';

interface PolygonCreatorState {
  height: number;
  setHeight: (newHeight: number) => void;
}

const usePolygonCreatorStore = create<PolygonCreatorState>((set) => ({
  height: 0,
  setHeight: (newHeight) => set({ height: newHeight }),
}));

export default usePolygonCreatorStore;