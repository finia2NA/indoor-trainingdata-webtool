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
    pointLightPosition,
    pointLightIntensity,
    pointLightDistance,
    pointLightDecay,
    setPointLightPosition,
  } = useDebugStore();

  // Update mesh position when store values change
  useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.position.set(pointLightPosition[0], pointLightPosition[1], pointLightPosition[2]);
  }, [pointLightPosition]);

  // Handle transform changes from controls
  const onTransform = () => {
    if (!meshRef.current) return;

    const pos = meshRef.current.position;
    setPointLightPosition([pos.x, pos.y, pos.z]);
  };

  if (!pointLightActive) return null;

  return (
    <>
      {/* Point Light */}
      <pointLight
        position={pointLightPosition}
        intensity={pointLightIntensity}
        distance={pointLightDistance}
        decay={pointLightDecay}
        color="white"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-radius={10}
        shadow-bias={-0.0001}
      />

      {/* Visual indicator sphere */}
      <mesh
        ref={meshRef}
        position={pointLightPosition}
      >
        <sphereGeometry args={[0.2, 16, 12]} />
        <meshBasicMaterial color="violet" transparent opacity={0.8} />
      </mesh>

      {/* Transform Controls - always visible and in translate mode */}
      <TransformControls
        // @ts-expect-error FIXME: This works, but technically the ref might not exist yet
        object={meshRef}
        mode="translate"
        onMouseDown={() => setIsTransforming(true)}
        onMouseUp={() => setIsTransforming(false)}
        onObjectChange={onTransform}
      />
    </>
  );
};

export default PointLightWithControls;