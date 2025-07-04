import { Model3D, Project } from '../../data/db';
import { useEffect, useState } from 'react';
import { Object3DEventMap } from 'three';
import useMultiTransformationStore from '../../hooks/useMultiTransformationStore';
import * as THREE from 'three';
import useEditorStore from '../../hooks/useEditorStore';
import { TransformControls } from '@react-three/drei';
import useTransformingSync from '../../hooks/useTransformingSync';
import Transformation from '../../data/Transformation';
import { loadModel } from '../../util/loadModel';
import { useParams } from 'react-router-dom';

type SceneObjectProps = {
  model: Model3D;
};

const SceneObject = ({ model }: SceneObjectProps) => {
  // IDs, editor state
  const projectId = Number(useParams<{ id: string }>().id);
  const modelId = model.id;
  const { transformMode } = useEditorStore();
  const { setIsTransforming } = useTransformingSync();

  // Transformations
  const { getTransformation, setTransformation, getVisibility } = useMultiTransformationStore();
  const transformation = getTransformation(projectId, modelId);
  if (!transformation) throw new Error('No transformation found for model');
  const iAmVisible = getVisibility(projectId, modelId);

  // Storing the object, both the three object and the ref to it
  const [object3D, setObject3D] = useState<THREE.Object3D<Object3DEventMap> | null>(null);

  // Load scene into object3D
  useEffect(() => {
    (async () => {
      try {
        const obj = await loadModel(model.name, model.content);
        setObject3D(obj);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [model]);

  // Apply transformation to it
  useEffect(() => {
    if (!object3D) return;
    object3D.position.set(transformation.translation[0], transformation.translation[1], transformation.translation[2]);
    object3D.setRotationFromEuler(new THREE.Euler(transformation.rotation[0], transformation.rotation[1], transformation.rotation[2]));
    object3D.scale.set(transformation.scale[0], transformation.scale[1], transformation.scale[2]);
  }, [object3D, transformation.translation, transformation.rotation, transformation.scale]);


  // When transforming using handles, apply it to the zustand store
  const onTransform = () => {
    if (!object3D) return;
    if (model.id === undefined || model.id < 0) return;

    const pos = object3D.position;
    const rot = object3D.rotation;
    const scale = object3D.scale;

    const newTransform = new Transformation(
      [pos.x, pos.y, pos.z],
      [rot.x, rot.y, rot.z],
      [scale.x, scale.y, scale.z]
    )

    setTransformation(projectId, modelId, newTransform);
  }


  // render
  return (
    iAmVisible &&
    <>
      {object3D &&
        <primitive object={object3D} />
      }
      {transformMode !== 'none' && object3D &&
        <TransformControls
          object={object3D}
          position={new THREE.Vector3(...transformation.translation)}
          mode={transformMode}
          onMouseDown={() => setIsTransforming(true)}
          onMouseUp={() => setIsTransforming(false)}
          onObjectChange={() => {
            onTransform();
          }}
        />}
    </>
  );

}

type SceneObjectsProps = {
  project: Project;
};

const SceneObjects = ({ project }: SceneObjectsProps) => {
  // Error handling (I think this is actually against the rules of hooks 😅)
  if (!project) throw new Error('No project provided');
  if (!project.id) throw new Error('No project id provided');


  return (
    <>
      {
        project.models.map((model, idx) => (
          <SceneObject key={idx} model={model} />
        ))
      }
    </>
  );
}


export default SceneObjects;