import { useEffect, useState } from 'react';
import { Project } from '../../data/db';
import * as THREE from 'three';
import { Image360, get360s } from '../../util/get360s';
import useCameraPoseStore from '../../hooks/sync/useCameraPoseStore';
import useMultiTransformationStore from '../../hooks/state/useMultiTransformationStore';
import View360Sphere from './View360Sphere';


type Image360MarkersProps = {
  project: Project;
  onImageSelected?: (image: Image360 | null) => void;
};

const Image360Markers = ({ project, onImageSelected }: Image360MarkersProps) => {
  const [positions, setPositions] = useState<Image360[]>([]);
  const [selectedImage, setSelectedImage] = useState<Image360 | null>(null);
  const { moveCameraTo, saveCameraPose, currentCameraPosition, currentCameraTarget, is360ViewActive } = useCameraPoseStore();
  const { getTransformation, getCourseCorrection } = useMultiTransformationStore();

  const projectId = project.id;
  if (!projectId) {
    throw new Error("Project has no id");
  }

  // Get transformation for "360s"
  const transformation = getTransformation(projectId, "360s");

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const images = await get360s(project, true); // Load with images for textures
        if (!images) {
          console.log('No 360 images found in project metadata');
          return;
        }
        setPositions(images);
      } catch (error) {
        console.error('Error loading 360 images:', error);
      }
    };

    loadMetadata();
  }, [project.metadataFile]);

  // Clear selected image when exiting 360° view
  useEffect(() => {
    if (!is360ViewActive) {
      setSelectedImage(null);
      if (onImageSelected) onImageSelected(null);
    }
  }, [is360ViewActive, onImageSelected]);

  const handleSphereClick = (pos: Image360) => {
    // Store current camera position before entering 360° view
    saveCameraPose(currentCameraPosition, currentCameraTarget);

    // Set the selected image for texture display
    setSelectedImage(pos);
    if (onImageSelected) onImageSelected(pos);

    // Apply transformation to the sphere position
    const originalPosition = new THREE.Vector3(pos.x, pos.y, pos.z);

    // Create transformation matrix
    const matrix = new THREE.Matrix4();
    if (transformation) {
      const quaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(...transformation.rotation)
      );
      matrix.compose(
        new THREE.Vector3(...transformation.translation),
        quaternion,
        new THREE.Vector3(...transformation.scale)
      );
    }

    // Apply transformation to the original position
    const transformedPosition = originalPosition.applyMatrix4(matrix);

    // Calculate camera position based on negative course direction (camera looks back towards sphere)
    const offset = -0.005;
    const courseCorrection = getCourseCorrection(projectId, pos.name) ?? 0;
    const totalCourse = pos.course + courseCorrection;
    const courseRadians = THREE.MathUtils.degToRad(totalCourse);
    const courseVector = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), courseRadians);
    
    // Apply full transformation (including scale) to the course vector
    if (transformation) {
      const matrix = new THREE.Matrix4();
      const quaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(...transformation.rotation)
      );
      matrix.compose(
        new THREE.Vector3(0, 0, 0), // No translation for direction vector
        quaternion,
        new THREE.Vector3(...transformation.scale) // Include scale!
      );
      courseVector.applyMatrix4(matrix);
    }
    
    courseVector.multiplyScalar(offset); // Negative to position camera opposite to course direction

    const cameraPosition: [number, number, number] = [
      transformedPosition.x + courseVector.x,
      transformedPosition.y + courseVector.y,
      transformedPosition.z + courseVector.z
    ];
    const target: [number, number, number] = [transformedPosition.x, transformedPosition.y, transformedPosition.z];
    moveCameraTo(cameraPosition, target);
  };

  return (
    <>
      {/* Wrap all 360 markers in a group with transformation */}
      <group
        position={transformation ? transformation.translation as [number, number, number] : [0, 0, 0]}
        rotation={transformation ? transformation.rotation as [number, number, number] : [0, 0, 0]}
        scale={transformation ? transformation.scale as [number, number, number] : [1, 1, 1]}
      >
        {positions.map((pos, index) => (
          <group key={index} position={[pos.x, pos.y, pos.z]}>
            {/* Sphere marker */}
            <mesh onClick={is360ViewActive ? undefined : () => handleSphereClick(pos)}>
              <sphereGeometry args={[0.03, 16, 16]} />
              <meshBasicMaterial color="#ffff00" />
            </mesh>

            {/* Direction indicator cylinder */}
            <group rotation={[0, THREE.MathUtils.degToRad(pos.course + (getCourseCorrection(projectId, pos.name) ?? 0)), 0]}>
              <mesh position={[0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.005, 0.005, 0.3, 8]} />
                <meshBasicMaterial color="#ff0000" />
              </mesh>
            </group>
          </group>
        ))}
      </group>

      {/* 360° view sphere with texture */}
      <View360Sphere selectedImage={selectedImage} transformation={transformation} project={project} />
    </>
  );
};

export default Image360Markers; 