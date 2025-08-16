import { useEffect, useState } from 'react';
import * as THREE from 'three';
import useCameraPoseStore from '../../hooks/sync/useCameraPoseStore';
import { Image360 } from '../../util/get360s';
import Transformation from '../../data/Transformation';

type View360SphereProps = {
  selectedImage: Image360 | null;
  transformation: Transformation | null;
};

/**
 * This react-three-fiber component renders a 
 */
// React components are functions that return JSX, which describes the UI.
// They take in outside data as props and can contain their own state.
const View360Sphere = ({ selectedImage, transformation }: View360SphereProps) => {
  // Global state can be accessed using helper functions, called hooks.
  const { is360ViewActive, sphereOpacity } = useCameraPoseStore();

  // Component level state can be initiated using useState.
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  // By using useEffect, we can execute code when the component is first displayed, or when the dependency array changes.
  useEffect(() => {
    if (selectedImage?.texture) {
      setTexture(selectedImage.texture);
    }
  }, [selectedImage]);


  // The presentation of a react component is defined in its return statement.
  if (!is360ViewActive || !selectedImage || !texture) return null;
  return (
    <mesh
      position={[selectedImage.x, selectedImage.y, selectedImage.z]}
      rotation={[0, THREE.MathUtils.degToRad(selectedImage.course), 0]}
      scale={transformation ? transformation.scale as [number, number, number] : [1, 1, 1]}
    >
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={sphereOpacity}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export default View360Sphere;