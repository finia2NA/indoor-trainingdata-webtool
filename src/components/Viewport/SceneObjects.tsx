import { Model3D, Project } from '../../data/db';
import { useEffect, useState } from 'react';
import { Object3DEventMap } from 'three';
import useMultiTransformationStore from '../../hooks/state/useMultiTransformationStore';
import * as THREE from 'three';
import useEditorStore from '../../hooks/state/useEditorStore';
import { TransformControls } from '@react-three/drei';
import useTransformingSync from '../../hooks/sync/useTransformingSync';
import Transformation from '../../data/Transformation';
import { loadModel } from '../../util/loadModel';
import { useParams } from 'react-router-dom';
import useDebugStore from '../../hooks/state/useDebugStore';
import type { ThreeEvent } from '@react-three/fiber';
import { VertexNormalsHelper } from 'three/examples/jsm/helpers/VertexNormalsHelper.js';

type SceneObjectProps = {
  model: Model3D;
};

const SceneObject = ({ model }: SceneObjectProps) => {
  // IDs, editor state
  const projectId = Number(useParams<{ id: string }>().id);
  const modelId = model.id;
  const { transformMode, wireframeMode, showNormals } = useEditorStore();
  const { setIsTransforming } = useTransformingSync();
  const { measuringActive, setMeasuredPoint } = useDebugStore();

  // Transformations
  const { getTransformation, setTransformation, getVisibility } = useMultiTransformationStore();
  const transformation = getTransformation(projectId, modelId);
  if (!transformation) throw new Error('No transformation found for model');
  const iAmVisible = getVisibility(projectId, modelId);

  // Storing the object, both the three object and the ref to it
  const [object3D, setObject3D] = useState<THREE.Object3D<Object3DEventMap> | null>(null);
  const [normalHelpers, setNormalHelpers] = useState<VertexNormalsHelper[]>([]);

  // Load scene into object3D
  useEffect(() => {
    (async () => {
      try {
        // Clean up existing normal helpers when loading new model
        normalHelpers.forEach(helper => {
          helper.dispose();
        });
        setNormalHelpers([]);
        
        const obj = await loadModel(model.name, model.content, false);
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

  // Apply wireframe mode
  useEffect(() => {
    if (!object3D) return;
    
    object3D.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => {
              material.wireframe = wireframeMode;
            });
          } else {
            child.material.wireframe = wireframeMode;
          }
        }
      }
    });
  }, [object3D, wireframeMode]);

  // Manage normal helpers
  useEffect(() => {
    // Clean up existing normal helpers
    normalHelpers.forEach(helper => {
      if (object3D && helper.parent === object3D) {
        object3D.remove(helper);
      }
      helper.dispose();
    });
    setNormalHelpers([]);

    if (!object3D || !showNormals) return;

    // Create new normal helpers
    const newHelpers: VertexNormalsHelper[] = [];
    object3D.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const helper = new VertexNormalsHelper(child, 0.05, 0x00ff00);
        newHelpers.push(helper);
        object3D.add(helper);
      }
    });
    
    setNormalHelpers(newHelpers);
  }, [object3D, showNormals]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      normalHelpers.forEach(helper => {
        helper.dispose();
      });
    };
  }, []);

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
      {object3D && (
        <primitive
          object={object3D}
          onPointerDown={(e: ThreeEvent<PointerEvent>) => {
            if (!measuringActive) return;
            e.stopPropagation();
          }}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            if (!measuringActive) return;
            // Prevent orbit controls
            e.stopPropagation();
            const p = e.point;
            setMeasuredPoint([p.x, p.y, p.z]);
          }}
        />
      )}
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