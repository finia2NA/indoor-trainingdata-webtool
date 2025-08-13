import { useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { Quaternion, Vector2, Vector3 } from "three";
import useMultiGenerationStore from "../state/useMultiGenerationStore";
import { createDistribution, takeRandomSample } from "../../util/probability";
import Triangulation from "../../util/triangulate";
import useMultiPolygonStore from "../state/useMultiPolygonStore";
import usePrecomputedPoses from "../state/usePrecomputedPoses";
import { Id, toast } from "react-toastify";
import { ProgressToast, ProgressType } from "../../components/UI/Toasts";
import useOffscreenThree from "./useOffscreenThree";
import useWorkerManager from "./useWorkerManager";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Matrix4 } from "three";
import db from "../../data/db";
import { get360s } from "../../util/get360s";

const logging = false;
const wallAvoidanceThreshold = 0.3;

export enum PoseType {
  SINGLE = 'single',
  PAIR = 'pair',
}

export type ScreenShotResult<T extends Pose> = {
  blob: Blob;
  pose: T;
  width: number;
  height: number;
}

type PolygonEX = {
  polygon: Vector3[];
  triangulation: Triangulation;
  area: number;
}

export type Pose = {
  position: Vector3;
  target: Vector3;
  quaternion: Quaternion;
  fov: number;
  series: number;
  type: PoseType
}

export type PostTrainingPose = Pose & {
  imageName: string;
}

/**
 * Function that rounds a number to 2 decimal places
 */
const to2accuracy = (values: number[] | number) => {
  if (Array.isArray(values)) {
    return values.map(v => Math.round(v * 100) / 100);
  } else {
    return Math.round(values * 100) / 100;
  }
}

const getQuaternionFromTarget = (position: Vector3, target: Vector3) => {
  const up = new Vector3(0, 1, 0);
  const m = new Matrix4();
  m.lookAt(position, target, up);
  return new Quaternion().setFromRotationMatrix(m);
}

const useDataGeneratorUtils = () => {
  const { takeOffscreenScreenshots, take360Screenshots, doOffscreenRaycast } = useOffscreenThree();
  const { generatePosesParallel, generatePosttrainingPosesParallel, cleanup: cleanupWorkers } = useWorkerManager();
  const { poses, posttrainingPoses, addPose, addPosttrainingPose, clearPoses, clearPosttrainingPoses } = usePrecomputedPoses();
  const id = Number(useParams<{ id: string }>().id);
  const { getPolygons } = useMultiPolygonStore();
  const polygons = getPolygons(id);
  const progressToastId = useRef<null | Id>(null);
  const posttrainingProgressToastId = useRef<null | Id>(null);

  const {
    getHeightOffset,
    getAnglesRange,
    getAnglesConcentration,
    getAvoidWalls,
    getDoPairGeneration,
    getPairDistanceRange,
    getPairDistanceConcentration,
    getPairAngle,
    getPairAngleConcentration,
    getFovRange,
    getFovConcentration,
    getNumSeries,
    getImageDimensions,
    getNumPosttrainingImages,
  } = useMultiGenerationStore();
  const heightOffset = getHeightOffset(id);
  const anglesRange = getAnglesRange(id);
  const anglesConcentration = getAnglesConcentration(id);
  const avoidWalls = getAvoidWalls(id);
  const pair = getDoPairGeneration(id);
  const pairDistanceRange = getPairDistanceRange(id);
  const pairDistanceConcentration = getPairDistanceConcentration(id);
  const pairAngleOffset = getPairAngle(id);
  const pairAngleConcentration = getPairAngleConcentration(id);
  const fovRange = getFovRange(id);
  const fovConcentration = getFovConcentration(id);
  const numSeries = getNumSeries(id);
  const numPosttrainingImages = getNumPosttrainingImages(id);
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



  const getRandomPoseInPolygons = async (numSeries: number, maxTries = 10000) => {

    if (maxTries <= 0) {
      throw new Error('getRandomPoseInPolygons failed after maximum attempts');
    }

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

    // Let's first do the XZ angle
    const directionXZ = new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1);

    // sample pitch angle
    const anglesDist = createDistribution(anglesConcentration);
    const angleSample = takeRandomSample({ dist: anglesDist });
    const angleVal = (anglesRange[0] + anglesRange[1]) / 2 + // midpoint
      angleSample * anglesRange[1] - anglesRange[0] / 2; // random sampled offset /2 bc range of sampled values is [-1, 1]

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

    // Compute the quaternion rotation from the position-target pair.
    const quaternionRotation = getQuaternionFromTarget(selectedPoint, targetPoint);

    // generate random fov
    const fovDist = createDistribution(fovConcentration);
    const fovSample = takeRandomSample({ dist: fovDist });
    const fov = (fovRange[0] + fovRange[1]) / 2 + fovSample * (fovRange[1] - fovRange[0]) / 2;


    // THE DEALBREAKERS
    if (avoidWalls) {
      const intersections = await doOffscreenRaycast(selectedPoint, targetPoint, false);
      if (intersections.length > 0) {
        const intersection = intersections[0];
        const distance = selectedPoint.distanceTo(intersection.point);
        if (distance < wallAvoidanceThreshold) {
          return getRandomPoseInPolygons(numSeries, maxTries - 1);
        }
      }
    }


    if (logging) {
      console.table({
        Series: numSeries + "a",
        Position: (to2accuracy(selectedPoint.toArray()) as number[]).join(', '),
        "Relative Target": (to2accuracy(targetPoint.clone().sub(selectedPoint).toArray()) as number[]).join(', '),
        Pitch: to2accuracy(angleVal) + "°",
        Fov: to2accuracy(fov) + "°",
      });
    }

    return {
      position: selectedPoint,
      target: targetPoint,
      quaternion: quaternionRotation,
      fov,
      type: PoseType.SINGLE,
      series: numSeries,
    };
  }

  const getPairPoint = async (pose: Pose, numSeries: number, numTries = 10000) => {
    if (numTries <= 0) {
      throw new Error('getPairPoint failed after maximum attempts');
    }

    // SAMPING
    const distanceDist = createDistribution(pairDistanceConcentration);
    const distanceSample = takeRandomSample({ dist: distanceDist, positive: true });
    const distanceVal = pairDistanceRange[0] + // base
      distanceSample * (pairDistanceRange[1] - pairDistanceRange[0]); // random offset

    const pairAngleDist = createDistribution(pairAngleConcentration);
    const pairAngleSample = takeRandomSample({ dist: pairAngleDist });
    const pairAngleVal = pairAngleSample * pairAngleOffset * (Math.PI / 180);

    // POSITION
    const newPos = pose.position.clone().add(new Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    ).multiplyScalar(distanceVal));


    // ANGLE
    // get relevant directions
    const direction = pose.target.clone().sub(pose.position).normalize();
    const up = new Vector3(0, 1, 0);
    const right = new Vector3().crossVectors(up, direction).normalize();

    // Randomly split angleVal into yaw and pitch
    const t = Math.random();
    const yawAngle = t * pairAngleVal;
    const pitchAngle = (1 - t) * pairAngleVal;
    // Apply Yaw (rotation around up vector)
    const yawQuat = new Quaternion().setFromAxisAngle(up, yawAngle);
    direction.applyQuaternion(yawQuat);
    // Apply Pitch (rotation around right vector)
    const pitchQuat = new Quaternion().setFromAxisAngle(right, pitchAngle);
    direction.applyQuaternion(pitchQuat);
    direction.normalize();
    // Compute the new target position and quaternion
    const newTarget = newPos.clone().add(direction);
    const quaternionRotation = getQuaternionFromTarget(newPos, newTarget);

    // THE DEALBREAKERS

    // // If we are outside the allowed pitch angle.. too bad, try again
    // // This works, but we need to think about if this is something we want :)
    // if (pitchAngle / Math.PI * 180 > anglesRange[1] || pitchAngle / Math.PI * 180 < anglesRange[0]) {
    //   return getPairPoint(pose, numSeries, numTries - 1);
    // }

    // check if we are in the polygon. If not, recurse
    let isInExtrudedPolygon = false;
    for (const polygon of polygonsEX) {
      if (polygon.triangulation.isInExtrudedPolygon(newPos, heightOffset)) {
        isInExtrudedPolygon = true;
        break;
      }
    }
    if (!isInExtrudedPolygon) {
      return getPairPoint(pose, numSeries, numTries - 1);
    }

    // check if we accidentally went through a wall. If so, recurse
    const intersections = await doOffscreenRaycast(pose.position, newPos, true);
    if (intersections.length > 0) {
      return getPairPoint(pose, numSeries, numTries - 1);
    }

    // check if we are too close to a wall. If so, recurse
    if (avoidWalls) {
      const wallIntersections = await doOffscreenRaycast(newPos, newTarget, false);
      if (wallIntersections.length > 0) {
        const intersection = wallIntersections[0];
        const distance = newPos.distanceTo(intersection.point);
        if (distance < wallAvoidanceThreshold) {
          return getPairPoint(pose, numSeries, numTries - 1);
        }
      }
    }


    // HAPPY PATH
    // If we are here, all checks have passed. We can now log and return the pose

    if (logging) {
      console.table({
        Series: numSeries + "b",
        Position: (to2accuracy(newPos.toArray()) as number[]).join(', '),
        "Relative Target": (to2accuracy(newTarget.clone().sub(newPos).toArray()) as number[]).join(', '),
        Pitch: to2accuracy(pitchAngle),
        "Distance to first": to2accuracy(distanceVal),
        "Angle to first": to2accuracy(pairAngleVal),
        Iterations: 1000 - numTries,
      });
    }

    return {
      position: newPos,
      target: newTarget,
      quaternion: quaternionRotation,
      fov: pose.fov,
      type: PoseType.PAIR,
      series: numSeries,
    };
  }

  const takeScreenshots = async () => {
    console.log("Creating screenshot zip");
    const timeStamp = new Date().toISOString().replace(/:/g, '-');
    const zip = new JSZip();
    const screenshotsFolder = zip.folder("screenshots_" + timeStamp);
    const meshFolder = screenshotsFolder?.folder("mesh");
    const posttrainingFolder = screenshotsFolder?.folder("posttraining");

    // We're using closures to gc memory after the screenshots are taken. I'm worried about memory usage, so that's why
    {
      console.log("Taking mesh screenshots");
      const meshScreenshots = await takeOffscreenScreenshots({ poses: poses, width: imageSize[0], height: imageSize[1] });
      meshScreenshots.forEach((screenshot) => {
        const { blob, pose, width, height } = screenshot;
        const label = {
          pose,
          width,
          height,
        }
        const filename = `screenshot_${pose.series + (pose.type === PoseType.PAIR ? "b" : "a")}`;
        meshFolder?.file(`screenshot_${filename}.png`, blob);
        meshFolder?.file(`screenshot_${filename}.json`, JSON.stringify(label, null, 2));
      });
    }

    {
      console.log("Taking posttraining screenshots");
      const postTrainingScreenshots = await take360Screenshots({ poses: posttrainingPoses, width: imageSize[0], height: imageSize[1] });
      postTrainingScreenshots.forEach((screenshot) => {
        const { blob, pose, width, height } = screenshot;
        const label = {
          pose,
          width,
          height,
        }
        const filename = `screenshot_${pose.series + (pose.type === PoseType.PAIR ? "b" : "a")}`;
        posttrainingFolder?.file(`screenshot_${filename}.png`, blob);
        posttrainingFolder?.file(`screenshot_${filename}.json`, JSON.stringify(label, null, 2));
      });
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "screenshots.zip");
  }

  const generatePoses = async () => {
    const project = await db.projects.get(id);
    const promises = [generateMeshPoses()];

    if (project?.metadataFile) {
      promises.push(generatePosttrainingPoses());
    }

    await Promise.all(promises);
  }


  const generateMeshPoses = async () => {
    console.log("Generating mesh poses with worker threads");
    clearPoses();

    console.log("Polygons", polygons);
    // Check if we have any polygons to generate poses in
    if (polygons.length === 0 || polygons[0].length === 0) {
      toast.error("No polygons defined. Please create at least one polygon before generating poses.");
      return;
    }

    let stop = false;
    const doStop = () => {
      console.log("Aborting pose generation");
      stop = true;
      cleanupWorkers();
    };

    // Prepare triangulation data for workers (serialize Vector3 objects)
    const polygonsForWorkers = polygonsEX.map(polygon => ({
      polygon: polygon.polygon.map(v => ({ x: v.x, y: v.y, z: v.z })),
      triangulation: {
        triangles: polygon.triangulation.triangles.map(([a, b, c]) => [
          { x: a.position.x, y: a.position.y, z: a.position.z },
          { x: b.position.x, y: b.position.y, z: b.position.z },
          { x: c.position.x, y: c.position.y, z: c.position.z }
        ]),
        area: polygon.triangulation.getArea(),
      },
      area: polygon.area,
    }));

    try {
      // Initialize progress toast
      progressToastId.current = toast(ProgressToast, {
        progress: 0.00001, 
        data: { progress: 0.00001, type: ProgressType.POSES }, 
        type: "info", 
        onClose(reason) {
          if (reason === "stop") {
            doStop();
          }
        },
      });

      // Generate poses using workers
      const generatedPoses = await generatePosesParallel(
        numSeries,
        {
          polygonsEX: polygonsForWorkers,
          totalArea,
          heightOffset,
          anglesRange,
          anglesConcentration,
          fovRange,
          fovConcentration,
          avoidWalls,
          pair,
          pairDistanceRange,
          pairDistanceConcentration,
          pairAngleOffset,
          pairAngleConcentration,
        },
        (progress) => {
          if (progressToastId.current !== null && !stop) {
            toast.update(progressToastId.current, { 
              progress, 
              data: { progress, type: ProgressType.POSES } 
            });
          }
        },
        (newPoses) => {
          // Add poses incrementally as they're generated
          newPoses.forEach(pose => addPose(pose));
        },
        (error) => {
          console.error("Worker error:", error);
          toast.error(`Pose generation error: ${error}`);
        }
      );

      if (!stop) {
        console.log("Pose generation complete");
        toast("Mesh pose generation complete", { type: "success" });
      } else {
        console.log("Pose generation stopped prematurely");
        toast("Mesh pose generation stopped", { type: "warning" });
      }

    } catch (error) {
      console.error("Pose generation error:", error);
      toast.error(`Pose generation failed: ${(error as Error).message}`);
    } finally {
      if (progressToastId.current !== null) {
        toast.dismiss(progressToastId.current);
        progressToastId.current = null;
      }
    }
  }

  const generatePosttrainingPoses = async () => {
    console.log("Generating posttraining images with worker threads");
    clearPosttrainingPoses();

    let stop = false;
    const doStop = () => {
      console.log("Aborting pose generation");
      stop = true;
      cleanupWorkers();
    };

    // Get the project and its metadata
    const project = await db.projects.get(id);
    if (!project || !project.metadataFile) {
      toast.error("No 360° image metadata found");
      return;
    }

    // Load the metadata
    const positions = await get360s(project, false);

    if (!positions || positions.length === 0) {
      toast.error("No 360° image positions found in metadata");
      return;
    }

    try {
      // Initialize progress toast
      posttrainingProgressToastId.current = toast(ProgressToast, {
        progress: 0.00001,
        data: { progress: 0.00001, type: ProgressType.POSTTRAINING },
        type: "info",
        onClose(reason) {
          if (reason === "stop") {
            doStop();
          }
        },
      });

      // Convert positions to the format expected by workers
      const positionsForWorkers = positions.map(pos => ({
        x: pos.x,
        y: pos.y,
        z: pos.z,
        name: pos.name,
      }));

      // Generate poses using workers
      const generatedPoses = await generatePosttrainingPosesParallel(
        positionsForWorkers,
        {
          numPosttrainingImages,
          anglesRange,
          anglesConcentration,
          fovRange,
          fovConcentration,
          avoidWalls,
          pair,
          pairDistanceRange,
          pairDistanceConcentration,
          pairAngleOffset,
          pairAngleConcentration,
        },
        (progress) => {
          if (posttrainingProgressToastId.current !== null && !stop) {
            toast.update(posttrainingProgressToastId.current, { 
              progress, 
              data: { progress, type: ProgressType.POSTTRAINING } 
            });
          }
        },
        (newPoses) => {
          // Add poses incrementally as they're generated
          newPoses.forEach(pose => addPosttrainingPose(pose));
        },
        (error) => {
          console.error("Worker error:", error);
          toast.error(`Posttraining pose generation error: ${error}`);
        }
      );

      if (!stop) {
        console.log("Posttraining pose generation complete");
        toast("Posttraining pose generation complete", { type: "success" });
      } else {
        console.log("Posttraining pose generation stopped prematurely");
        toast("Posttraining pose generation stopped", { type: "warning" });
      }

    } catch (error) {
      console.error("Posttraining pose generation error:", error);
      toast.error(`Posttraining pose generation failed: ${(error as Error).message}`);
    } finally {
      if (posttrainingProgressToastId.current !== null) {
        toast.dismiss(posttrainingProgressToastId.current);
        posttrainingProgressToastId.current = null;
      }
    }
  }


  return { takeScreenshots, generatePoses, generateMeshPoses, generatePosttrainingPoses, cleanupWorkers };
}

export default useDataGeneratorUtils;