/**
 * Zustand hook that stores data for the wrapped Orbit Controls. Non-persistent.
 */

import { create } from 'zustand';

type OrbitAngleState = {
  orbitAngles: { azimuthAngle: number; polarAngle: number };
  setOrbitAngles: (angles: { azimuthAngle: number; polarAngle: number }) => void;
  updateOrbitAngles: (update: (prev: { azimuthAngle: number; polarAngle: number }) => { azimuthAngle: number; polarAngle: number }) => void;
};

const useOrbitAngleSync = create<OrbitAngleState>((set) => ({
  orbitAngles: { azimuthAngle: 0, polarAngle: Math.PI / 2 },
  setOrbitAngles: (angles) => set({ orbitAngles: angles }),
  updateOrbitAngles: (update) => set((state) => ({ orbitAngles: update(state.orbitAngles) })),
}));

export default useOrbitAngleSync;