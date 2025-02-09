import { Vector3 } from "three";
import { create } from "zustand";
import useMultiPolygonStore from "./useMultiPolygonStore";
import { useParams } from "react-router-dom";
import useMultiGenerationStore from "../hooks/useMultiGenerationStore";


export type ScreenShotResult = {
  blob: Blob;
  width: number;
  height: number;
  fov: number;
}

type DataGeneratorState = {
  orbitTarget: Vector3;
  setOrbitTarget: (target: Vector3) => void;

  setPose?: (pos: Vector3, target: Vector3) => void;
  registerSetPose: (cb: (pos: Vector3, target: Vector3) => void) => void;

  takeScreenshot?: (screenshotWidth: number, screenshotHeight: number) => Promise<ScreenShotResult | null>;
  registerTakeScreenshot: (cb: (screenshotWidth: number, screenshotHeight: number) => Promise<ScreenShotResult>) => void;
}

export const useDataGeneratorStore = create<DataGeneratorState>((set) => ({
  orbitTarget: new Vector3(0, 0, 0),
  setOrbitTarget: (target) => set({ orbitTarget: target }),

  setPose: undefined,
  registerSetPose: (cb) => set({ setPose: cb }),

  takeScreenshot: undefined,
  registerTakeScreenshot: (cb) => set({ takeScreenshot: cb }),
}));

const useDataGeneratorUtils = () => {
  const { takeScreenshot, setPose } = useDataGeneratorStore();

  const id = Number(useParams<{ id: string }>().id);
  const { getPolygons } = useMultiPolygonStore();
  const polygons = getPolygons(id);

  const {
    getHeightOffset,
    getAnglesRange,
    getAnglesConcentration,
    getDoPairGeneration,
    getPairDistanceRange,
    getPairDistanceConcentration,
    getPairAngle,
    getPairAngleConcentration,
    getNumImages,
    getImageDimensions,
  } = useMultiGenerationStore();
  const offset = getHeightOffset(id);
  const angles = getAnglesRange(id);
  const anglesConcentration = getAnglesConcentration(id);
  const pair = getDoPairGeneration(id);
  const pairDistanceRange = getPairDistanceRange(id);
  const pairDistanceConcentration = getPairDistanceConcentration(id);
  const pairAngleOffset = getPairAngle(id);
  const pairAngleConcentration = getPairAngleConcentration(id);
  const numImages = getNumImages(id);
  const imageSize = getImageDimensions(id);


  // A stand in for when we can get a point inside a polygon
  const setTrulyRandomPose = async (min?: Vector3, max?: Vector3) => {
    if (!setPose) throw new Error('setPose is not set');
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
    await new Promise(requestAnimationFrame);
  }

  const setPoseInPolygons = async () => {

  }


  const generate = async () => {
    if (!setTrulyRandomPose) throw new Error('setTrulyRandomPose is not set');
    if (!takeScreenshot) throw new Error('takeScreenshot is not set');
    setTrulyRandomPose();
    await takeScreenshot(imageSize[0], imageSize[1]);
  }


  return { takeScreenshot, setPose, setTrulyRandomPose, generate };
}

export default useDataGeneratorUtils;