import { OrbitControls, OrbitControlsProps } from "@react-three/drei";
import React, { useEffect, useRef, useCallback } from "react";
import useOrbitAngleSync from "../../hooks/useOrbitAngleSync";
import useTransformingSync from "../../hooks/useTransformingSync";

export enum OrbitUsecase {
  CUBE = 'cube',
  VIEWPORT = 'viewport'
}

type WrappedOrbitControlsProps = OrbitControlsProps & {
  useCase?: OrbitUsecase;
};

const WrappedOrbitControls = React.memo((props: WrappedOrbitControlsProps) => {

  // get shared orbit state
  const { orbitAngles, updateOrbitAngles } = useOrbitAngleSync((state) => state);

  // we only want to apply the orbit control when the user is not transforming
  const { isTransforming } = useTransformingSync();

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
  const controlsRef = useRef<OrbitControls>(null);

  useEffect(() => {
    if (controlsRef.current) {
      let updated = false;

      if (controlsRef.current.azimuthAngle !== azimuthAngle) {
        controlsRef.current.minAzimuthAngle = azimuthAngle;
        controlsRef.current.maxAzimuthAngle = azimuthAngle;
        updated = true;
      }
      if (controlsRef.current.polarAngle !== polarAngle) {
        controlsRef.current.minPolarAngle = polarAngle;
        controlsRef.current.maxPolarAngle = polarAngle;
        updated = true;
      }

      if (updated) {
        controlsRef.current.update();
      }

      // reset
      controlsRef.current.minAzimuthAngle = -Infinity;
      controlsRef.current.maxAzimuthAngle = Infinity;
      controlsRef.current.minPolarAngle = 0;
      controlsRef.current.maxPolarAngle = Math.PI;
    }
  }, [azimuthAngle, polarAngle]);

  return (isTransforming ? null :
    <OrbitControls
      ref={controlsRef}
      enableZoom={!(props.useCase === 'cube')}
      onChange={() => {
        if (controlsRef.current) {
          updateAzimuthAngle(controlsRef.current.getAzimuthalAngle());
          updatePolarAngle(controlsRef.current.getPolarAngle());
        }
      }}
      {...props}
      target={props.useCase === "viewport" ? props.target : undefined}
    />
  )
});

export default WrappedOrbitControls;
