// App.tsx
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, TransformControls } from '@react-three/drei';
import { Model } from '../data/db';
import { useEffect, useState, useRef, LegacyRef } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Group, Object3DEventMap, Mesh, Camera } from 'three';


interface ViewportProps {
  model: Model;
}

interface SceneObjectProps {
  model: Model;
  onClick: (object: Mesh) => void;
}

const SceneObject = ({ model, onClick }: SceneObjectProps) => {

  const [scene, setScene] = useState<Group<Object3DEventMap> | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.parse(model.content, '', (gltf) => {
      const scene = gltf.scene;


      // TODO: fix the midpoint so that the transform is displayed in the right place
      // // Fixing the object
      // // get the bb
      // const bb = new THREE.Box3().setFromObject(scene);
      // // get the mid point
      // const mid = new THREE.Vector3();
      // bb.getCenter(mid);
      // // move the object to the origin
      // scene.position.sub(mid);


      setScene(gltf.scene);
    });
  }, [model]);

  return scene ? (
    <primitive
      object={scene}
      onClick={(e) => {
        // we want to handle shift-clicks
        if (!e.shiftKey) return;
        e.stopPropagation(); // Prevent the event from propagating to the canvas
        onClick(e.object as Mesh);
      }}
    />
  ) : null;
}

const Viewport = ({ model }: ViewportProps) => {
  const [selectedObject, setSelectedObject] = useState<Mesh | null>(null);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const transformRef = useRef(null);

  return (
    <div className='h-full'>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        <SceneObject model={model} onClick={(object) => {
          if (object !== selectedObject) {
            setSelectedObject(object);
          } else {
            // rotate through the transform modes
            if (transformMode === 'translate') {
              setTransformMode('rotate');
            } else if (transformMode === 'rotate') {
              setTransformMode('scale');
            } else {
              setTransformMode('translate');
              setSelectedObject(null);
              // TODO: clean this up
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              if (transformRef.current) transformRef.current.detach();
            }

          }

        }} />

        {selectedObject && (
          <TransformControls
            position={selectedObject.position}
            ref={transformRef}
            object={selectedObject}
            mode={transformMode}
          />
        )}

        {!selectedObject && <OrbitControls />}
        <gridHelper args={[10, 10]} />
        <axesHelper args={[5]} />
        <color attach="background" args={['#827b70']} />
      </Canvas>
    </div>
  );
}

export default Viewport;
