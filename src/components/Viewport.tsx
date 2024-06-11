// App.tsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

// Custom component to load and render the GLTF model
const Model: React.FC = () => {
  const { scene } = useGLTF('/example.glb');
  return <primitive object={scene} />;
}

const Viewport: React.FC = () => {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Model />
      <OrbitControls />
    </Canvas>
  );
}

export default Viewport;
