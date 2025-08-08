import { useEffect, useState } from 'react';
import * as THREE from 'three';
import useCameraPoseStore from '../../hooks/sync/useCameraPoseStore';
import { Image360 } from '../../util/get360s';

type View360SphereProps = {
  selectedImage: Image360 | null;
};

const View360Sphere = ({ selectedImage }: View360SphereProps) => {
  const { is360ViewActive, sphereOpacity } = useCameraPoseStore();
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (selectedImage?.texture) {
      setTexture(selectedImage.texture);
    }
  }, [selectedImage]);

  if (!is360ViewActive || !selectedImage || !texture) return null;

  return (
    <mesh 
      position={[selectedImage.x, selectedImage.y, selectedImage.z]}
      rotation={[0, THREE.MathUtils.degToRad(selectedImage.course), 0]}
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