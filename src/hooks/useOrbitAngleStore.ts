import { create } from 'zustand';

interface OrbitAnglesStore {
  orbitAngles: { azimuthAngle: number; polarAngle: number };
  setOrbitAngles: (angles: { azimuthAngle: number; polarAngle: number }) => void;
  updateOrbitAngles: (update: (prev: { azimuthAngle: number; polarAngle: number }) => { azimuthAngle: number; polarAngle: number }) => void;
}

const useOrbitAngleStore = create<OrbitAnglesStore>((set) => ({
  orbitAngles: { azimuthAngle: 0, polarAngle: Math.PI / 2 },
  setOrbitAngles: (angles) => set({ orbitAngles: angles }),
  updateOrbitAngles: (update) => set((state) => ({ orbitAngles: update(state.orbitAngles) })),
}));

export default useOrbitAngleStore;