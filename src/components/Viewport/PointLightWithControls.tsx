import { useEffect, useRef } from 'react';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import useDebugStore from '../../hooks/state/useDebugStore';
import useTransformingSync from '../../hooks/sync/useTransformingSync';

const PointLightWithControls = () => {
  const { setIsTransforming } = useTransformingSync();
  const meshRef = useRef<THREE.Mesh>(null);
  
  const {
    pointLightActive,
    pointLightX,
    pointLightY,
    pointLightZ,
    pointLightIntensity,
    pointLightDistance,
    pointLightDecay,
    setPointLightX,
    setPointLightY,
    setPointLightZ,
  } = useDebugStore();

  // Update mesh position when store values change
  useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.position.set(pointLightX, pointLightY, pointLightZ);
  }, [pointLightX, pointLightY, pointLightZ]);

  // Handle transform changes from controls
  const onTransform = () => {
    if (!meshRef.current) return;
    
    const pos = meshRef.current.position;
    setPointLightX(pos.x);
    setPointLightY(pos.y);
    setPointLightZ(pos.z);
  };

  if (!pointLightActive) return null;

  return (
    <>
      {/* Point Light */}
      <pointLight 
        position={[pointLightX, pointLightY, pointLightZ]} 
        intensity={pointLightIntensity}
        distance={pointLightDistance}
        decay={pointLightDecay}
        color="white"
      />
      
      {/* Visual indicator sphere */}
      <mesh 
        ref={meshRef}
        position={[pointLightX, pointLightY, pointLightZ]}
      >
        <circleGeometry args={[0.2, 16]} />
        <meshBasicMaterial color="violet" transparent opacity={0.8} />
      </mesh>
      
      {/* Transform Controls - always visible and in translate mode */}
      {meshRef.current && (
        <TransformControls
          object={meshRef.current}
          position={new THREE.Vector3(pointLightX, pointLightY, pointLightZ)}
          mode="translate"
          onMouseDown={() => setIsTransforming(true)}
          onMouseUp={() => setIsTransforming(false)}
          onObjectChange={onTransform}
        />
      )}
    </>
  );
};

export default PointLightWithControls;