import { OrbitControls, OrbitControlsProps } from "@react-three/drei";
import React, { useEffect, useRef, useCallback } from "react";

interface WrappedOrbitControlsProps extends OrbitControlsProps {
  orbitAngles?: { azimuthAngle: number, polarAngle: number };
  setOrbitAngles?: React.Dispatch<React.SetStateAction<{ azimuthAngle: number; polarAngle: number; }>>;
}

const WrappedOrbitControls = React.memo(({ orbitAngles, setOrbitAngles, ...props }: WrappedOrbitControlsProps) => {

  // Default values
  const azimuthAngle = orbitAngles?.azimuthAngle ?? 0;
  const polarAngle = orbitAngles?.polarAngle ?? Math.PI / 2;

  const setAzimuthAngle = useCallback((angle: number) => {
    if (setOrbitAngles) {
      setOrbitAngles(prev => {
        if (prev.azimuthAngle !== angle) {
          return { ...prev, azimuthAngle: angle };
        }
        return prev;
      });
    }
  }, [setOrbitAngles]);

  const setPolarAngle = useCallback((angle: number) => {
    if (setOrbitAngles) {
      setOrbitAngles(prev => {
        if (prev.polarAngle !== angle) {
          return { ...prev, polarAngle: angle };
        }
        return prev;
      });
    }
  }, [setOrbitAngles]);

  // @ts-expect-error aaa 
  const theRef = useRef<OrbitControls>(null);

  useEffect(() => {
    if (theRef.current) {
      let updated = false;

      if (theRef.current.azimuthAngle !== azimuthAngle) {
        theRef.current.minAzimuthAngle = azimuthAngle;
        theRef.current.maxAzimuthAngle = azimuthAngle;
        updated = true;
      }
      if (theRef.current.polarAngle !== polarAngle) {
        theRef.current.minPolarAngle = polarAngle;
        theRef.current.maxPolarAngle = polarAngle;
        updated = true;
      }

      if (updated) {
        theRef.current.update();
      }

      // reset
      theRef.current.minAzimuthAngle = -Infinity;
      theRef.current.maxAzimuthAngle = Infinity;
      theRef.current.minPolarAngle = 0;
      theRef.current.maxPolarAngle = Math.PI;
    }
  }, [azimuthAngle, polarAngle]);

  return (
    <OrbitControls
      ref={theRef}
      onChange={() => {
        if (theRef.current) {
          setAzimuthAngle(theRef.current.getAzimuthalAngle());
          setPolarAngle(theRef.current.getPolarAngle());
        }
      }}
      {...props} />
  )
});

export default WrappedOrbitControls;
