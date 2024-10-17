import { OrbitControls, OrbitControlsProps } from "@react-three/drei";
import { useEffect, useRef } from "react";


interface WrappedOrbitControlsProps extends OrbitControlsProps {
  orbitAngles?: { azimuthAngle: number, polarAngle: number };
  setOrbitAngles?: React.Dispatch<React.SetStateAction<{ azimuthAngle: number; polarAngle: number; }>>;
}

const WrappedOrbitControls = ({ orbitAngles, setOrbitAngles, ...props }: WrappedOrbitControlsProps) => {

  // Default values
  const azimuthAngle = orbitAngles?.azimuthAngle ?? 0;
  const polarAngle = orbitAngles?.polarAngle ?? Math.PI / 2;

  const setAzimuthAngle = (angle: number) => {
    if (setOrbitAngles) {
      setOrbitAngles(prev => ({ ...prev, azimuthAngle: angle }));
    }
  };

  const setPolarAngle = (angle: number) => {
    if (setOrbitAngles) {
      setOrbitAngles(prev => ({ ...prev, polarAngle: angle }));
    }
  };

  // @ts-expect-error No idea what type this is supposed to be. Tbh, I don't really care.
  // https://media1.tenor.com/m/PuKLSZxC-GwAAAAd/patrick-bateman-i-dont-care.gif
  const theRef = useRef<OrbitControls>(null);

  useEffect(() => {
    if (theRef.current) {
      if (theRef.current.azimuthAngle !== azimuthAngle) {
        theRef.current.minAzimuthAngle = azimuthAngle;
        theRef.current.maxAzimuthAngle = azimuthAngle;
      }
      if (theRef.current.polarAngle !== polarAngle) {
        theRef.current.minPolarAngle = polarAngle;
        theRef.current.maxPolarAngle = polarAngle;
      }

      theRef.current.update();

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
}

export default WrappedOrbitControls;