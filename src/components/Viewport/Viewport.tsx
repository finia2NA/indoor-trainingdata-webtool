import { Canvas } from '@react-three/fiber';
import { Model3D } from '../../data/db';
import { useEffect, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Group, Object3DEventMap } from 'three';
import WrappedOrbitControls from './WrappedOrbitControls';
import useEditorStore, { EditorState } from '../../hooks/useEditorState';
import SwitchableCamera from './SwitchableCamera';
import useMultiTransformationStore from '../../hooks/useTransforms';
import * as THREE from 'three';


interface ViewportProps {
  model: Model3D;
}

interface SceneObjectProps {
  model: Model3D;
}

const SceneObject = ({ model }: SceneObjectProps) => {
  if (!model) throw new Error('No model provided');
  if (!model.id) throw new Error('No model id provided');

  const [scene, setScene] = useState<Group<Object3DEventMap> | null>(null);

  const { getTransformation } = useMultiTransformationStore();
  const transformation = getTransformation(model.id);
  if (!transformation) throw new Error('No transformation found for model');

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

  return scene ? <primitive object={scene} /> : null;
}

const Viewport = ({ model }: ViewportProps) => {

  const { showGrid } = useEditorStore((state) => (state as EditorState));


  return (
    <div className='h-full'>
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        <SceneObject model={model} />

        <WrappedOrbitControls />
        {/* <OrbitControls /> */}
        {showGrid &&
          <>
            <gridHelper args={[10, 10]} />
            <axesHelper args={[5]} />
          </>
        }
        <color attach="background" args={['#484848']} />

        <SwitchableCamera />
      </Canvas>
    </div>
  );
}

export default Viewport;
