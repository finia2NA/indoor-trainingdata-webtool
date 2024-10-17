// App.tsx
import { Canvas } from '@react-three/fiber';
import { Model } from '../data/db';
import { useEffect, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Group, Object3DEventMap } from 'three';
import WrappedOrbitControls from './Viewport/WrappedOrbitControls';
import { ViewcubeVizProps } from './Viewport/ViewcubeViz';
import useEditorStore, { EditorState } from '../hooks/useEditorState';

interface ViewportProps extends ViewcubeVizProps {
  model: Model;
}

interface SceneObjectProps {
  model: Model;
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

const Viewport = ({ model, orbitAngles, setOrbitAngles }: ViewportProps) => {

  const { showGrid } = useEditorStore((state) => (state as EditorState));

  return (
    <div className='h-full'>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        <SceneObject model={model} />

        <WrappedOrbitControls orbitAngles={orbitAngles} setOrbitAngles={setOrbitAngles} />
        {showGrid &&
          <>
            <gridHelper args={[10, 10]} />
            <axesHelper args={[5]} />
          </>
        }
        <color attach="background" args={['#484848']} />
      </Canvas>
    </div>
  );
}

export default Viewport;
