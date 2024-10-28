import { create } from 'zustand';


interface StoreState {
  isTransforming: boolean;
  // eslint-disable-next-line no-unused-vars
  setIsTransforming: (value: boolean) => void;
}

const useOrbitTransformSync = create<StoreState>((set) => ({
  isTransforming: false,
  setIsTransforming: (value) => set({ isTransforming: value }),
}));

export default useOrbitTransformSync;