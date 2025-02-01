/**
 * Zustand hook that stores data for the wrapped Orbit Controls. Non-persistent.
 */

import { create } from 'zustand';

interface OrbitAngleSync {
  orbitAngles: { azimuthAngle: number; polarAngle: number };
  // eslint-disable-next-line no-unused-vars
  setOrbitAngles: (angles: { azimuthAngle: number; polarAngle: number }) => void;
  // eslint-disable-next-line no-unused-vars
  updateOrbitAngles: (update: (prev: { azimuthAngle: number; polarAngle: number }) => { azimuthAngle: number; polarAngle: number }) => void;
}

const useOrbitAngleSync = create<OrbitAngleSync>((set) => ({
  orbitAngles: { azimuthAngle: 0, polarAngle: Math.PI / 2 },
  setOrbitAngles: (angles) => set({ orbitAngles: angles }),
  updateOrbitAngles: (update) => set((state) => ({ orbitAngles: update(state.orbitAngles) })),
}));

export default useOrbitAngleSync;