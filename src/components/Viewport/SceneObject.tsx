import { Model3D } from '../../data/db';
import { useEffect, useRef, useState } from 'react';
import { Object3DEventMap } from 'three';
import useMultiTransformationStore from '../../hooks/useMultiTransformationStore';
import * as THREE from 'three';
import useEditorStore from '../../hooks/useEditorStore';
import { TransformControls } from '@react-three/drei';
import useTransformingSync from '../../hooks/useTransformingSync';
import Transformation from '../../data/Transformation';
import { loadModel } from '../../utils/loadModel';

type SceneObjectProps = {
  model: Model3D;
};

const SceneObject = ({ model }: SceneObjectProps) => {
  // Error handling (I think this is actually against the rules of hooks 😅)
  if (!model) throw new Error('No model provided');
  if (!model.id) throw new Error('No model id provided');

  // Getting current model transformation
  const { getTransformation, setTransformation } = useMultiTransformationStore();
  const transformation = getTransformation(model.id);
  if (!transformation) throw new Error('No transformation found for model');

  // console.log("Object transformation", transformation);

  // -------------------

  // Load scene and apply transformation
  const [object3D, setObject3D] = useState<THREE.Object3D<Object3DEventMap> | null>(null);
  useEffect(() => {
    // Async function to load the model using util
    (async () => {
      try {
        const obj = await loadModel(model.name, model.content);
        setObject3D(obj);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [model]);
  // Apply transformation to object
  useEffect(() => {
    if (!object3D) return;
    object3D.position.set(transformation.translation[0], transformation.translation[1], transformation.translation[2]);
    object3D.setRotationFromEuler(new THREE.Euler(transformation.rotation[0], transformation.rotation[1], transformation.rotation[2]));
    object3D.scale.set(transformation.scale[0], transformation.scale[1], transformation.scale[2]);
  }, [object3D, transformation.translation, transformation.rotation, transformation.scale]);

  // -------------------

  // Getting current UI transform mode
  const { transformMode } = useEditorStore();
  const { setIsTransforming } = useTransformingSync();

  // Specify what should happen when the object is transformed
  const objectRef = useRef<THREE.Object3D | null>(null);
  const onTransform = () => {
    if (!objectRef.current) return;
    if (!model.id) return;

    const obj = objectRef.current;

    const pos = obj.position;
    const rot = obj.rotation;
    const scale = obj.scale;

    const newTransform = new Transformation(
      [pos.x, pos.y, pos.z],
      [rot.x, rot.y, rot.z],
      [scale.x, scale.y, scale.z]
    )

    setTransformation(model.id, newTransform);
  }

  // -------------------

  // render
  return (!object3D ?
    // Nothing if scene is not loaded
    null :
    <>
      <primitive object={object3D} ref={objectRef} />
      {transformMode !== 'none' &&
        <TransformControls
          object={object3D}
          position={new THREE.Vector3(...transformation.translation)}
          mode={transformMode}
          onMouseDown={() => setIsTransforming(true)}
          onMouseUp={() => setIsTransforming(false)}
          onChange={() => {
            onTransform();
          }}
        />}
    </>
  );
}

export default SceneObject;