import { OrbitControls, OrbitControlsProps } from "@react-three/drei";
import React, { useEffect, useRef, useCallback } from "react";
import useOrbitAngleStore from "../../hooks/useOrbitAngleStore";

const WrappedOrbitControls = React.memo((props: OrbitControlsProps) => {

  const { orbitAngles, updateOrbitAngles } = useOrbitAngleStore((state) => state);

  // Default values
  const azimuthAngle = orbitAngles?.azimuthAngle ?? 0;
  const polarAngle = orbitAngles?.polarAngle ?? Math.PI / 2;

  const updateAzimuthAngle = useCallback((angle: number) => {
    if (updateOrbitAngles) {
      updateOrbitAngles(prev => {
        if (prev.azimuthAngle !== angle) {
          return { ...prev, azimuthAngle: angle };
        }
        return prev;
      });
    }
  }, [updateOrbitAngles]);

  const updatePolarAngle = useCallback((angle: number) => {
    if (updateOrbitAngles) {
      updateOrbitAngles(prev => {
        if (prev.polarAngle !== angle) {
          return { ...prev, polarAngle: angle };
        }
        return prev;
      });
    }
  }, [updateOrbitAngles]);

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
          updateAzimuthAngle(theRef.current.getAzimuthalAngle());
          updatePolarAngle(theRef.current.getPolarAngle());
        }
      }}
      {...props} />
  )
});

export default WrappedOrbitControls;
