import { Vector3 } from "three";
import { create } from "zustand";

type DataGeneratorState = {
  // Orbit target needed for camera orbit controls
  orbitTarget: Vector3;
  setOrbitTarget: (target: Vector3) => void;

  setPose?: (pos: Vector3, target: Vector3) => void;
  registerSetPose: (cb: (pos: Vector3, target: Vector3) => void) => void;

  takeScreenshot?: () => Promise<void>;
  registerTakeScreenshot: (cb: () => Promise<void>) => void;
}

export const useDataGeneratorStore = create<DataGeneratorState>((set) => ({
  orbitTarget: new Vector3(0, 0, 0),
  setOrbitTarget: (target) => set({ orbitTarget: target }),

  setPose: undefined,
  registerSetPose: (cb) => set({ setPose: cb }),

  takeScreenshot: undefined,
  registerTakeScreenshot: (cb) => set({ takeScreenshot: cb }),
}));

const useScreenshotUtils = () => {
  const { takeScreenshot, setPose } = useDataGeneratorStore();

  const setTrulyRandomPose = (min?: Vector3, max?: Vector3) => {
    if (!setPose) return;
    if (!min)
      min = new Vector3(-10, -10, -10);
    if (!max)
      max = new Vector3(10, 10, 10);

    const randomPosition = new Vector3(
      Math.random() * (max.x - min.x) + min.x,
      Math.random() * (max.y - min.y) + min.y,
      Math.random() * (max.z - min.z) + min.z
    );

    const randomTarget = new Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    ).normalize().add(randomPosition);

    setPose(randomPosition, randomTarget);
  }


  return { takeScreenshot, setPose, setTrulyRandomPose };
}

export default useScreenshotUtils;