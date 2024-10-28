import { Model3D } from '../../data/db';
import { useEffect, useRef, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Group, Object3DEventMap } from 'three';
import useMultiTransformationStore from '../../hooks/useTransforms';
import * as THREE from 'three';
import useEditorStore, { EditorState } from '../../hooks/useEditorStore';
import { TransformControls } from '@react-three/drei';
import useOrbitTransformSync from '../../hooks/useOrbitTransformSync';
import Transformation from '../../data/Transformation';

interface SceneObjectProps {
  model: Model3D;
}

const SceneObject = ({ model }: SceneObjectProps) => {
  // Error handling (I think this is actually against the rules of hooks 😅)
  if (!model) throw new Error('No model provided');
  if (!model.id) throw new Error('No model id provided');

  // Getting current model transformation
  const { getTransformation, setTransformation } = useMultiTransformationStore();
  const transformation = getTransformation(model.id);
  if (!transformation) throw new Error('No transformation found for model');

  // Load scene and apply transformation
  const [scene, setScene] = useState<Group<Object3DEventMap> | null>(null);
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.parse(model.content, '', (gltf) => {
      setScene(gltf.scene);
    });
  }, [model]);
  useEffect(() => {
    if (!scene) return;
    scene.position.set(transformation.translation[0], transformation.translation[1], transformation.translation[2]);
    scene.setRotationFromEuler(new THREE.Euler(transformation.rotation[0], transformation.rotation[1], transformation.rotation[2]));
    scene.scale.set(transformation.scale[0], transformation.scale[1], transformation.scale[2]);
  }, [scene, transformation.translation, transformation.rotation, transformation.scale]);

  // Getting current UI transform mode
  const { transformMode } = useEditorStore((state) => (state as EditorState));
  const { setIsTransforming } = useOrbitTransformSync();

  const sceneRef = useRef<THREE.Object3D | null>(null);

  const onTransform = () => {
    if (!sceneRef.current) return;
    if (!model.id) return;

    const obj = sceneRef.current;

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

  return (!scene ?
    // Nothing if scene is not loaded
    null :
    <>
      <primitive object={scene} ref={sceneRef} />
      {transformMode !== 'none' &&
        <TransformControls
          object={scene}
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