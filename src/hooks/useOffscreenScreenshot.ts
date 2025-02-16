import { useCallback, useRef } from 'react';
import * as THREE from 'three';
import { useLiveQuery } from 'dexie-react-hooks';
import { useParams } from 'react-router-dom';
import db, { Model3D } from "../data/db";
import { Pose } from './useDataGeneratorUtils';
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
  const { id } = useParams();
  const progressToastId = useRef<null | Id>(null);
  const { getTransformation, setTransformation } = useMultiTransformationStore();



  const model = useLiveQuery<Model3D | null>(
    async () => {
      return (await db.models.where('id').equals(Number(id)).first()) ?? null;
    },
    [id]
  );

  const takeOffscreenScreenshots = useCallback(async ({ poses, width, height }: takeScreenshotProps) => {
    if (!model) throw new Error('Model not found');
    if(!model.id) throw new Error('Model id not found');
    if (!poses || poses.length === 0) throw new Error('Poses not given');
    const transformation = getTransformation(model.id);


    // setup
    const offscreen = new OffscreenCanvas(width, height);
    const renderer = new THREE.WebGLRenderer({ canvas: offscreen, preserveDrawingBuffer: true });
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x484848);
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // load model using util function
    const loadedObject = await loadModel(model.name, model.content);
    loadedObject.position.set(transformation.translation[0], transformation.translation[1], transformation.translation[2]);
    loadedObject.setRotationFromEuler(new THREE.Euler(transformation.rotation[0], transformation.rotation[1], transformation.rotation[2]));
    loadedObject.scale.set(transformation.scale[0], transformation.scale[1], transformation.scale[2]);
    scene.add(loadedObject);

    let stop = false;
    const doStop = () => {
      stop = true;
    }

    const blobs: Blob[] = [];
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
      camera.lookAt(...pose.target.toArray());
      renderer.render(scene, camera);
      const blob = await offscreen.convertToBlob({ type: 'image/png' });
      blobs.push(blob);
    }

    if (!stop)
      toast("Screenshots complete", { type: "success" });
    else
      toast("Screenshots stopped", { type: "warning" });

    if (progressToastId.current !== null) {
      toast.dismiss(progressToastId.current);
      progressToastId.current = null;
    }

    return blobs;
  }, [model]);

  return { takeOffscreenScreenshots };
};

export default useOffscreenScreenshot;
