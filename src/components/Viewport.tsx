// src/components/Model.jsx
import { Canvas, useLoader } from '@react-three/fiber'
import { Suspense } from 'react';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

const Model = () => {
  const gltf = useLoader(GLTFLoader, "./Poimandres.gltf");
  return (
    <>
      <primitive object={gltf.scene} />
    </>
  );
};

const Viewport = () => {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <Suspense fallback={null}>
        <Model />
      </Suspense>
    </Canvas>
  );
}

export default Viewport;