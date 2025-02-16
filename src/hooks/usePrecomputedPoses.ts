import { create } from 'zustand'
import { Pose } from './useDataGeneratorUtils'

interface PrecomputedPosesState {
  poses: Pose[];
  setPoses: (poses: Pose[]) => void;
  addPose: (pose: Pose) => void;
  clearPoses: () => void;
}

const usePrecomputedPoses = create<PrecomputedPosesState>((set) => ({
  poses: [],
  setPoses: (poses) => set({ poses }),
  addPose: (pose) => set((state) => ({ poses: [...state.poses, pose] })),
  clearPoses: () => set({ poses: [] }),
}))

export default usePrecomputedPoses