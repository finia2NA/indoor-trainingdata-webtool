import { create } from 'zustand'
import { Pose, PostTrainingPose } from '../offscreen/useDataGeneratorUtils'

interface PrecomputedPosesState {
  poses: Pose[];
  posttrainingPoses: PostTrainingPose[];
  setPoses: (poses: Pose[]) => void;
  setPosttrainingPoses: (poses: PostTrainingPose[]) => void;
  addPose: (pose: Pose) => void;
  addPosttrainingPose: (pose: PostTrainingPose) => void;
  clearPoses: () => void;
  clearPosttrainingPoses: () => void;
  clearAllPoses: () => void;
}

const usePrecomputedPoses = create<PrecomputedPosesState>((set) => ({
  poses: [],
  posttrainingPoses: [],
  setPoses: (poses) => set({ poses }),
  setPosttrainingPoses: (poses) => set({ posttrainingPoses: poses }),
  addPose: (pose) => set((state) => ({ poses: [...state.poses, pose] })),
  addPosttrainingPose: (pose) => set((state) => ({ posttrainingPoses: [...state.posttrainingPoses, pose] })),
  clearPoses: () => set({ poses: [] }),
  clearPosttrainingPoses: () => set({ posttrainingPoses: [] }),
  clearAllPoses: () => set({ poses: [], posttrainingPoses: [] }),
}))

export default usePrecomputedPoses