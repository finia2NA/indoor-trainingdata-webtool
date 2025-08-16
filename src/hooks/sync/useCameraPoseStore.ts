

import { create } from 'zustand';

/**
 * Camera Pose Store
 * 
 * This store manages camera state using two distinct patterns:
 * 
 * 1. CURRENT STATE (Read-only): Reflects the actual camera position/rotation
 *    - Updated every frame by CameraController and WrappedOrbitControls
 *    - Used by UI components to display current camera information
 *    - Follows Command-Query Separation: these are "queries" for current state
 * 
 * 2. TARGET COMMANDS (Write-only): Triggers programmatic camera movements
 *    - Set once to initiate smooth camera transitions
 *    - Automatically cleared after animation completes
 *    - Follows Command-Query Separation: these are "commands" to move camera
 * 
 * This separation prevents race conditions and makes the data flow clear:
 * - UI shows current state
 * - Commands trigger movements
 * - Never mix the two purposes
 */

type CameraPoseState = {
  // ===== CURRENT STATE (Read-only, for UI display) =====
  /** Current camera position in 3D space - updated every frame */
  currentCameraPosition: [number, number, number];
  /** Updates the current camera position (called by CameraController) */
  setCurrentCameraPosition: (position: [number, number, number]) => void;

  /** Current camera rotation in 3D space - updated every frame */
  currentCameraRotation: [number, number, number];
  /** Updates the current camera rotation (called by CameraController) */
  setCurrentCameraRotation: (rotation: [number, number, number]) => void;

  /** Current orbit controls target position - updated every frame */
  currentCameraTarget: [number, number, number];
  /** Updates the current camera target position (called by WrappedOrbitControls) */
  setCurrentCameraTarget: (target: [number, number, number]) => void;

  // ===== TARGET COMMANDS (Write-only, triggers camera movement) =====
  /** Target position for camera animation - triggers movement when set */
  targetCameraPosition: [number, number, number] | null;
  /** Target position for orbit controls - triggers movement when set */
  targetCameraTarget: [number, number, number] | null;
  /** Command: Move camera to specific position and target (triggers animation) */
  moveCameraTo: (position: [number, number, number], target: [number, number, number]) => void;
  /** Command: Clear current camera movement targets (stops animation) */
  clearCameraTarget: () => void;

  // 360° view state
  is360ViewActive: boolean;
  originalCameraPosition: [number, number, number] | null;
  originalCameraTarget: [number, number, number] | null;
  sphereOpacity: number;
  setSphereOpacity: (opacity: number) => void;
  saveCameraPose: (originalPosition: [number, number, number], originalTarget: [number, number, number]) => void;
  restoreCameraPose: () => void;
  exit360ViewWithoutReset: () => void;
};

const useCameraPoseStore = create<CameraPoseState>((set, get) => ({
  // ===== CURRENT STATE (Read-only, for UI display) =====
  currentCameraPosition: [0, 0, 0],
  setCurrentCameraPosition: (position) => set({ currentCameraPosition: position }),

  currentCameraRotation: [0, 0, 0],
  setCurrentCameraRotation: (rotation) => set({ currentCameraRotation: rotation }),

  currentCameraTarget: [0, 0, 0],
  setCurrentCameraTarget: (target) => set({ currentCameraTarget: target }),

  // ===== TARGET COMMANDS (Write-only, triggers camera movement) =====
  targetCameraPosition: null,
  targetCameraTarget: null,
  moveCameraTo: (position, target) => set({ targetCameraPosition: position, targetCameraTarget: target }),
  clearCameraTarget: () => set({ targetCameraPosition: null, targetCameraTarget: null }),

  // 360° view state
  is360ViewActive: false,
  originalCameraPosition: null,
  originalCameraTarget: null,
  sphereOpacity: 0.5,
  setSphereOpacity: (opacity) => set({ sphereOpacity: opacity }),
  saveCameraPose: (originalPosition, originalTarget) => set({ 
    is360ViewActive: true, 
    originalCameraPosition: originalPosition, 
    originalCameraTarget: originalTarget 
  }),
  restoreCameraPose: () => {
    const state = get();
    if (state.originalCameraPosition && state.originalCameraTarget) {
      set({ 
        targetCameraPosition: state.originalCameraPosition,
        targetCameraTarget: state.originalCameraTarget,
        is360ViewActive: false,
        originalCameraPosition: null,
        originalCameraTarget: null
      });
    }
  },
  exit360ViewWithoutReset: () => {
    set({ 
      is360ViewActive: false,
      originalCameraPosition: null,
      originalCameraTarget: null
    });
  },
}));

export default useCameraPoseStore;