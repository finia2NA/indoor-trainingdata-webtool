import { useEffect, useState } from 'react';
import * as THREE from 'three';
import useCameraPoseStore from '../../hooks/sync/useCameraPoseStore';
import { Image360 } from '../../util/get360s';
import Transformation from '../../data/Transformation';
import { Project } from '../../data/db';
import useMultiTransformationStore from '../../hooks/state/useMultiTransformationStore';

type View360SphereProps = {
  selectedImage: Image360 | null;
  transformation: Transformation | null;
  project: Project;
};

/**
 * This react-three-fiber component renders a 
 */
// React components are functions that return JSX, which describes the UI.
// They take in outside data as props and can contain their own state.
const View360Sphere = ({ selectedImage, transformation, project }: View360SphereProps) => {
  // Global state can be accessed using helper functions, called hooks.
  const { is360ViewActive, sphereOpacity } = useCameraPoseStore();
  const { getCourseCorrection, getFineCourseCorrection } = useMultiTransformationStore();

  const projectId = project.id;
  if (!projectId) {
    throw new Error("Project has no id");
  }

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

  // Calculate transformed position and rotation
  const coarseCorrection = getCourseCorrection(projectId, selectedImage.name);
  const fineCorrection = getFineCourseCorrection(projectId, selectedImage.name);
  const totalCourse = selectedImage.course + coarseCorrection + fineCorrection;
  
  let transformedPosition: [number, number, number] = [selectedImage.x, selectedImage.y, selectedImage.z];
  let transformedRotation: [number, number, number] = [0, THREE.MathUtils.degToRad(totalCourse), 0];
  let transformedScale: [number, number, number] = [1, 1, 1];

  if (transformation) {
    // Apply transformation to the original position
    const originalPosition = new THREE.Vector3(selectedImage.x, selectedImage.y, selectedImage.z);
    
    // Create transformation matrix
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(...transformation.rotation)
    );
    matrix.compose(
      new THREE.Vector3(...transformation.translation),
      quaternion,
      new THREE.Vector3(...transformation.scale)
    );
    
    // Apply transformation to the original position
    const finalPosition = originalPosition.applyMatrix4(matrix);
    transformedPosition = [finalPosition.x, finalPosition.y, finalPosition.z];

    // Get course corrections and apply them to the original course
    const coarseCorrection = getCourseCorrection(projectId, selectedImage.name);
    const fineCorrection = getFineCourseCorrection(projectId, selectedImage.name);
    const totalCourse = selectedImage.course + coarseCorrection + fineCorrection;
    
    // Combine the corrected course rotation with the transformation rotation
    const originalRotation = new THREE.Euler(0, THREE.MathUtils.degToRad(totalCourse), 0);
    const transformationRotation = new THREE.Euler(...transformation.rotation);
    
    // Add the rotations
    transformedRotation = [
      originalRotation.x + transformationRotation.x,
      originalRotation.y + transformationRotation.y,
      originalRotation.z + transformationRotation.z
    ];

    transformedScale = transformation.scale as [number, number, number];
  }

  return (
    <mesh
      position={transformedPosition}
      rotation={transformedRotation}
      scale={transformedScale}
    >
      <sphereGeometry args={[20, 32, 32]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={sphereOpacity}
        side={THREE.DoubleSide}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
};

export default View360Sphere;