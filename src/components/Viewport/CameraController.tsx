import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import useCameraPoseStore from '../../hooks/sync/useCameraPoseStore';

const CameraController = () => {
  const { camera, gl } = useThree();
  const { 
    targetCameraPosition, 
    targetCameraTarget, 
    clearCameraTarget,
    setReactiveCameraPosition,
    setReactiveCameraRotation 
  } = useCameraPoseStore();
  
  const animationRef = useRef<{
    startPosition: THREE.Vector3;
    startTarget: THREE.Vector3;
    endPosition: THREE.Vector3;
    endTarget: THREE.Vector3;
    startTime: number;
    duration: number;
  } | null>(null);
  
  const controlsRef = useRef<any>(null);

  // Find the orbit controls in the scene
  useFrame(() => {
    if (!controlsRef.current) {
      // Try multiple ways to find the controls
      const canvas = gl.domElement;
      const scene = camera.parent;
      
      // Look for controls attached to the camera or scene
      const controls = (canvas as any).__orbitControls ||
                      (camera as any).__orbitControls ||
                      (scene as any).__orbitControls;
      
      if (controls) {
        controlsRef.current = controls;
      }
    }
    
    // Update reactive camera pose
    setReactiveCameraPosition([camera.position.x, camera.position.y, camera.position.z]);
    setReactiveCameraRotation([camera.rotation.x, camera.rotation.y, camera.rotation.z]);
  });

  useEffect(() => {
    if (targetCameraPosition && targetCameraTarget) {
      const currentTarget = controlsRef.current?.target || new THREE.Vector3(0, 0, 0);
      
      animationRef.current = {
        startPosition: camera.position.clone(),
        startTarget: currentTarget.clone(),
        endPosition: new THREE.Vector3(...targetCameraPosition),
        endTarget: new THREE.Vector3(...targetCameraTarget),
        startTime: Date.now(),
        duration: 1500, // 1.5 second animation
      };
    }
  }, [targetCameraPosition, targetCameraTarget, camera]);

  useFrame(() => {
    if (!animationRef.current) return;

    const { startPosition, startTarget, endPosition, endTarget, startTime, duration } = animationRef.current;
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Smooth easing function
    const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easedProgress = easeInOut(progress);

    // Interpolate camera position
    const currentPosition = new THREE.Vector3().lerpVectors(startPosition, endPosition, easedProgress);
    camera.position.copy(currentPosition);

    // Update orbit controls target if they exist
    if (controlsRef.current && controlsRef.current.target) {
      const currentTarget = new THREE.Vector3().lerpVectors(startTarget, endTarget, easedProgress);
      controlsRef.current.target.copy(currentTarget);
      controlsRef.current.update();
    }

    // Complete animation
    if (progress >= 1) {
      animationRef.current = null;
      clearCameraTarget();
    }
  });

  return null;
};

export default CameraController;