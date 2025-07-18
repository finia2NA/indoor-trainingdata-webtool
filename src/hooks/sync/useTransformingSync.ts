import { create } from 'zustand';


type TransformingSyncState = {
  isTransforming: boolean;
  setIsTransforming: (value: boolean) => void;
};

const useTransformingSync = create<TransformingSyncState>((set) => ({
  isTransforming: false,
  setIsTransforming: (value) => set({ isTransforming: value }),
}));

export default useTransformingSync;