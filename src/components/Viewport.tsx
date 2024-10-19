import { Canvas } from '@react-three/fiber';
import { Model3D } from '../data/db';
import { useEffect, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Group, Object3DEventMap } from 'three';
import WrappedOrbitControls from './Viewport/WrappedOrbitControls';
import useEditorStore, { EditorState } from '../hooks/useEditorState';
import SwitchableCamera from './Viewport/SwitchableCamera';

interface ViewportProps {
  model: Model3D;
}

interface SceneObjectProps {
  model: Model3D;
}

const SceneObject = ({ model }: SceneObjectProps) => {
  const [scene, setScene] = useState<Group<Object3DEventMap> | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.parse(model.content, '', (gltf) => {
      setScene(gltf.scene);
    });
  }, [model]);

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
