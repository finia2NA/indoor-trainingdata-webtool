import { create } from 'zustand';


interface StoreState {
  isTransforming: boolean;
  setIsTransforming: (value: boolean) => void;
}

const useTransformingSync = create<StoreState>((set) => ({
  isTransforming: false,
  setIsTransforming: (value) => set({ isTransforming: value }),
}));

export default useTransformingSync;