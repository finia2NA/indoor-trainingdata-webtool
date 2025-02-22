import { useCallback, useRef } from 'react';
import * as THREE from 'three';
import { useLiveQuery } from 'dexie-react-hooks';
import { useParams } from 'react-router-dom';
import db, { Project } from "../data/db";
import { Pose, ScreenShotResult } from './useDataGeneratorUtils';
import { loadModel } from '../utils/loadModel';
import { Id, toast } from 'react-toastify';
import { ProgressToast, ProgressType } from '../components/UI/Toasts';
import useMultiTransformationStore from './useMultiTransformationStore';

type takeScreenshotProps = {
  poses: Pose[];
  numImages: number;
  width: number;
  height: number;
}

const useOffscreenScreenshot = () => {
  const { id: projectId } = useParams();
  const progressToastId = useRef<null | Id>(null);
  const { getTransformation, getVisibility } = useMultiTransformationStore();



  const project = useLiveQuery<Project | null>(
    async () => {
      return (await db.projects.where('id').equals(Number(projectId)).first()) ?? null;
    },
    [projectId]
  );

  const takeOffscreenScreenshots = useCallback(async ({ poses, width, height }: takeScreenshotProps) => {
    if (!project) throw new Error('Model not found');
    if (!project.id) throw new Error('Model id not found');
    if (!poses || poses.length === 0) throw new Error('Poses not given');


    // first, basic setup: canvas, scene, renderer, lights, camera, etc
    const offscreen = new OffscreenCanvas(width, height);
    const renderer = new THREE.WebGLRenderer({ canvas: offscreen, preserveDrawingBuffer: true });
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x484848);
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // now, add all applicable models to the scene
    const models = project.models;
    if (!models) throw new Error('Models not found');
    for (const model of models) {
      if (!getVisibility(project.id, model.id)) continue;

      const transformation = getTransformation(project.id, model.id);
      if (!transformation) throw new Error(`Transformation not found for model${model.name}, ids p-${projectId}, m-${model.id}`);

      const loadedObject = await loadModel(model.name, model.content);
      loadedObject.position.set(transformation.translation[0], transformation.translation[1], transformation.translation[2]);
      loadedObject.setRotationFromEuler(new THREE.Euler(transformation.rotation[0], transformation.rotation[1], transformation.rotation[2]));
      loadedObject.scale.set(transformation.scale[0], transformation.scale[1], transformation.scale[2]);
      scene.add(loadedObject);
    }


    // take the pictures.
    // we need to keep track of the progress, and also allow the user to stop the process
    let stop = false;
    const doStop = () => {
      stop = true;
    }

    const results: ScreenShotResult[] = [];
    for (let i = 0; i < poses.length; i++) {
      if (stop) break;
      const progress = (i + 1) / poses.length;


      if (progressToastId.current === null) {
        progressToastId.current = toast(ProgressToast, {
          progress, data: { progress, type: ProgressType.SCREENSHOT }, type: "info", onClose(reason) {
            if (reason === "stop") {
              doStop();
            }
          },
        });
      } else {
        toast.update(progressToastId.current, { progress, data: { progress, type: ProgressType.SCREENSHOT } });
      }
      const pose = poses[i];
      camera.position.set(...pose.position.toArray());
      camera.fov = pose.fov;
      camera.updateProjectionMatrix();
      camera.lookAt(...pose.target.toArray());
      renderer.render(scene, camera);
      const blob = await offscreen.convertToBlob({ type: 'image/png' });
      results.push({
        blob,
        pose,
        width,
        height,
      });
    }

    if (!stop)
      toast("Screenshots complete", { type: "success" });
    else
      toast("Screenshots stopped", { type: "warning" });

    if (progressToastId.current !== null) {
      toast.dismiss(progressToastId.current);
      progressToastId.current = null;
    }

    return results;
  }, [getTransformation, getVisibility, project, projectId]);

  return { takeOffscreenScreenshots };
};

export default useOffscreenScreenshot;
