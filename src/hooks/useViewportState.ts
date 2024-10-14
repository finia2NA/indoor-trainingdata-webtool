import { create } from 'zustand';

// Data definition
enum CameraMode {
  PERSPECTIVE = 'perspective',
  ORTHOGRAPHIC = 'orthographic',
}

type CameraState = {
  cameraMode: CameraMode;
  setCameraMode: (mode: CameraMode) => void;
};

// --------------------------------------------

// Store creation
const useCameraStore = create((set) => ({
  cameraMode: 'perspective', // default is perspective, can be 'orthographic' or 'perspective'
  setCameraMode: (mode: CameraMode) => set({ cameraMode: mode }),

}));

export default useCameraStore;