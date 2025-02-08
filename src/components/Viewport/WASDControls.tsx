import { useState, useEffect } from 'react';
import useDataGeneratorUtils from '../../hooks/useDataGeneratorUtils';
import { useFrame, useThree } from '@react-three/fiber';
import useCameraPoseStore from '../../hooks/useCameraPoseStore';
import { Vector3 } from 'three';

const speed = 0.1;

const WASDControls = () => {
  const { setPose } = useDataGeneratorUtils();
  const { camera } = useThree();
  const { reactiveTarget } = useCameraPoseStore();

  // Keep track of pressed keys
  const [pressedKeys, setKeysPressed] = useState<Set<string>>(new Set());
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setKeysPressed(prev => new Set([...prev, event.key.toLowerCase()]));
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      setKeysPressed(prev => {
        const next = new Set([...prev]);
        next.delete(event.key.toLowerCase());
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame(() => {
    const position = camera.position.clone();
    const target = new Vector3(...reactiveTarget);

    const forwardVector = camera.getWorldDirection(new Vector3()).multiplyScalar(speed);
    const rightVector = camera.getWorldDirection(new Vector3()).cross(camera.up).multiplyScalar(speed);

    console.log(pressedKeys);
    if (pressedKeys.has('w')) {
      position.add(forwardVector);
      target.add(forwardVector);
    }
    if (pressedKeys.has('s')) {
      position.sub(forwardVector);
      target.sub(forwardVector);
    }
    if (pressedKeys.has('a')) {
      position.sub(rightVector);
      target.sub(rightVector);
    }
    if (pressedKeys.has('d')) {
      position.add(rightVector);
      target.add(rightVector);
    }
    // NOTE: this does not work, proably because of making updates to the component iself based on the location change
    // if (setPose)
    //   setPose(position, target);
  });


  return null;
}

export default WASDControls;