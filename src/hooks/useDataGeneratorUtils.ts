import { useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { Quaternion, Vector2, Vector3 } from "three";
import { create } from "zustand";
import useMultiGenerationStore from "../hooks/useMultiGenerationStore";
import { createDistribution, takeRandomSample } from "../util/probability";
import Triangulation from "../util/triangulate";
import useMultiPolygonStore from "./useMultiPolygonStore";
import usePrecomputedPoses from "./usePrecomputedPoses";
import { Id, toast } from "react-toastify";
import { ProgressToast, ProgressType } from "../components/UI/Toasts";
import useOffscreenScreenshot from "./useOffscreenScreenshot";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const logging = false;
const progressLogging = false;

export type ScreenShotResult = {
  blob: Blob;
  width: number;
  height: number;
  fov: number;
}

type PolygonEX = {
  polygon: Vector3[];
  triangulation: Triangulation;
  area: number;
}

export type Pose = {
  position: Vector3;
  target: Vector3;
  type?: 'single' | 'pair';
}

const to2accuracy = (values: number[] | number) => {
  if (Array.isArray(values)) {
    return values.map(v => Math.round(v * 100) / 100);
  } else {
    return Math.round(values * 100) / 100;
  }
}


type DataGeneratorState = {
  orbitTarget: Vector3;
  setOrbitTarget: (target: Vector3) => void;

  setPose?: (pos: Vector3, target: Vector3) => void;
  registerSetPose: (cb: (pos: Vector3, target: Vector3) => void) => void;

  takeScreenshot?: (screenshotWidth: number, screenshotHeight: number) => Promise<ScreenShotResult | null>;
  registerTakeScreenshot: (cb: (screenshotWidth: number, screenshotHeight: number) => Promise<ScreenShotResult>) => void;
}



/**
 * @deprecated Screenshots are now taken offscreen, so this is not necessary any more
 */
export const useDataGeneratorStore = create<DataGeneratorState>((set) => ({
  orbitTarget: new Vector3(0, 0, 0),
  setOrbitTarget: (target) => set({ orbitTarget: target }),

  setPose: undefined,
  registerSetPose: (cb) => set({ setPose: cb }),

  takeScreenshot: undefined,
  registerTakeScreenshot: (cb) => set({ takeScreenshot: cb }),
}));

const useDataGeneratorUtils = () => {
  const { takeOffscreenScreenshots } = useOffscreenScreenshot();
  const { poses, addPose, clearPoses } = usePrecomputedPoses();
  const id = Number(useParams<{ id: string }>().id);
  const { getPolygons } = useMultiPolygonStore();
  const polygons = getPolygons(id);
  const progressToastId = useRef<null | Id>(null);

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
  const heightOffset = getHeightOffset(id);
  const anglesRange = getAnglesRange(id);
  const anglesConcentration = getAnglesConcentration(id);
  const pair = getDoPairGeneration(id);
  const pairDistanceRange = getPairDistanceRange(id);
  const pairDistanceConcentration = getPairDistanceConcentration(id);
  const pairAngleOffset = getPairAngle(id);
  const pairAngleConcentration = getPairAngleConcentration(id);
  const numImages = getNumImages(id);
  const imageSize = getImageDimensions(id);


  // we need the areas of the polygons often, so let's precompute
  const polygonsEX: PolygonEX[] = useMemo(() => {
    return polygons.map(polygon => {
      const triangulation = new Triangulation(polygon);
      return {
        polygon,
        triangulation,
        area: triangulation.getArea(),
      } as PolygonEX;
    });
  }, [polygons]);

  const totalArea = useMemo(() => {
    return polygonsEX.reduce((acc, { area }) => acc + area, 0);
  }, [polygonsEX]);





  // A stand in for when we can get a point inside a polygon
  // This one works on the react canvas
  // const setTrulyRandomPose = async (min?: Vector3, max?: Vector3) => {
  //   if (!setPose) throw new Error('setPose is not set');
  //   if (!min)
  //     min = new Vector3(-10, -10, -10);
  //   if (!max)
  //     max = new Vector3(10, 10, 10);

  //   const randomPosition = new Vector3(
  //     Math.random() * (max.x - min.x) + min.x,
  //     Math.random() * (max.y - min.y) + min.y,
  //     Math.random() * (max.z - min.z) + min.z
  //   );

  //   const randomTarget = new Vector3(
  //     Math.random() * 2 - 1,
  //     Math.random() * 2 - 1,
  //     Math.random() * 2 - 1
  //   ).normalize().add(randomPosition);

  //   setPose(randomPosition, randomTarget);
  //   await new Promise(requestAnimationFrame);
  // }

  const getRandomPoseInPolygons = async () => {
    // pick a random polygon. This is similar to how it is in triangulate.ts.
    // Then, use the polygon's triangulation to get a random point inside the polygon
    const randomArea = Math.random() * totalArea;
    let currentArea = 0;
    let selectedPolygon: PolygonEX | undefined;
    for (let i = 0; i < polygonsEX.length; i++) {
      currentArea += polygonsEX[i].area;
      if (currentArea >= randomArea) {
        selectedPolygon = polygonsEX[i];
        break;
      }
    }
    const { point: selectedPoint } = selectedPolygon!.triangulation.getRandomPoint();

    // We now have a point in the triange. Next, add random offset.
    const rndHeightOffset = (Math.random() * 2 - 1) * heightOffset;
    selectedPoint.add(new Vector3(0, rndHeightOffset, 0));

    // sample pitch angle
    const anglesDist = createDistribution(anglesConcentration);
    const angleSample = takeRandomSample({ dist: anglesDist }); // this one is in [-1, 1]

    const rangeWidth = anglesRange[1] - anglesRange[0];
    const midPoint = (anglesRange[1] + anglesRange[0]) / 2;
    const angleVal = angleSample * rangeWidth / 2 + midPoint; // in degrees

    // XZ direction is completely random
    const directionXZ = new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1);
    if (directionXZ.length() > 0) {
      directionXZ.normalize();
    } else {
      directionXZ.set(1, 0);
    }

    // Compute the Y component using the pitch angle
    const y = Math.sin((angleVal / 180.0) * Math.PI); // Upward component
    const horizontalScale = Math.cos((angleVal / 180.0) * Math.PI); // Scale for XZ to maintain unit length
    // Final target vector
    const targetPoint = new Vector3(
      selectedPoint.x + directionXZ.x * horizontalScale,
      selectedPoint.y + y,
      selectedPoint.z + directionXZ.y * horizontalScale
    );

    if (logging) {
      console.table({
        Position: (to2accuracy(selectedPoint.toArray()) as number[]).join(', '),
        Target: (to2accuracy(targetPoint.toArray()) as number[]).join(', '),
        Pitch: to2accuracy(angleVal) + "°",
      });
    }

    return { position: selectedPoint, target: targetPoint };
  }

  const getPairPoint = async (pose: Pose, numTries = 1000) => {
    if (numTries <= 0) {
      throw new Error('getPairPoint failed after maximum attempts');
    }

    // Sample a distance and angle
    const distanceDist = createDistribution(pairDistanceConcentration);
    const distanceSample = takeRandomSample({ dist: distanceDist, positive: true });
    const distanceVal = distanceSample * (pairDistanceRange[1] - pairDistanceRange[0]) + pairDistanceRange[0];

    const angleDist = createDistribution(pairAngleConcentration);
    const angleSample = takeRandomSample({ dist: angleDist });
    const angleVal = angleSample * pairAngleOffset * (Math.PI / 180);

    // Create the second point
    const newPos = pose.position.clone().add(new Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    ).multiplyScalar(distanceVal));


    // get relevant directions
    const direction = pose.target.clone().sub(pose.position).normalize();
    const up = new Vector3(0, 1, 0);
    const right = new Vector3().crossVectors(up, direction).normalize();

    // Randomly split angleVal into yaw and pitch
    const t = Math.random();
    const yawAngle = (2 * Math.random() - 1) * t * angleVal;
    const pitchAngle = (2 * Math.random() - 1) * (1 - t) * angleVal;

    // Apply Yaw (rotation around up vector)
    const yawQuat = new Quaternion().setFromAxisAngle(up, yawAngle);
    direction.applyQuaternion(yawQuat);

    // Apply Pitch (rotation around right vector)
    const pitchQuat = new Quaternion().setFromAxisAngle(right, pitchAngle);
    direction.applyQuaternion(pitchQuat);

    direction.normalize();

    // Compute the new target position
    const newTarget = newPos.clone().add(direction);

    // check if we are in the polygon. If not, recurse
    const isInPolygon = polygonsEX.some((polygonEX) => {
      polygonEX.triangulation.isInPolygon(newPos);
    });
    if (!isInPolygon) {
      return getPairPoint(pose, numTries - 1);
    }

    return { newPos, newTarget };
  }

  const takeScreenshots = async () => {
    const blobs = await takeOffscreenScreenshots({ poses, width: imageSize[0], height: imageSize[1], numImages });
    const zip = new JSZip();
    const folder = zip.folder("screenshots");
    blobs.forEach((blob, index) => {
      folder?.file(`screenshot_${index + 1}.png`, blob);
    });
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "screenshots.zip");
  }


  const generatePoses = async () => {
    clearPoses();

    let stop = false
    const doStop = () => {
      console.log("Aborting pose generation");
      stop = true;
    }

    for (let i = 0; i < numImages; i++) {
      if (stop)
        break;
      const progress = ((i + 1) / numImages);

      if (progressToastId.current === null) {
        progressToastId.current = toast(ProgressToast, {
          progress, data: { progress, type: ProgressType.POSES }, type: "info", onClose(reason) {
            if (reason === "stop") {
              doStop();
            }
          },
        });
      } else {
        toast.update(progressToastId.current, { progress, data: { progress, type: ProgressType.POSES } });
      }
      const pose = await getRandomPoseInPolygons();
      addPose(pose);
      if (progressLogging) console.log(`Generated ${i + 1}/${numImages} poses`);

      // Yield control to avoid blocking the UI.
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (!stop)
      toast("Pose generation complete", { type: "success" });
    else
      toast("Pose generation stopped", { type: "warning" });

    if (progressToastId.current !== null) {
      toast.dismiss(progressToastId.current);
      progressToastId.current = null;
    }
  }


  return { takeScreenshots, generatePoses };
}

export default useDataGeneratorUtils;