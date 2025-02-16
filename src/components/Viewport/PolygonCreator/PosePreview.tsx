
import usePrecomputedPoses from "../../../hooks/usePrecomputedPoses";
import React from "react";

const PosesPreview = () => {
  const { poses } = usePrecomputedPoses();
  const withSmallerTarget = poses.map((pose) => {
    return {
      position: pose.position,
      target: pose.target.clone().sub(pose.position).multiplyScalar(0.1).add(pose.position),
      type: pose.type
    }
  });

  return (
    <>
      {withSmallerTarget.map((pose, index) => (
        <React.Fragment key={index}>
          <mesh position={pose.position}>
            <sphereGeometry args={[0.02, 16, 16]} />
            <meshBasicMaterial color={pose.type === "pair" ? "blue" : "white"} />
          </mesh>
          <line>
            <bufferGeometry attach="geometry" ref={(geometry) => geometry && geometry.setFromPoints([pose.position, pose.target])} />
            <lineBasicMaterial attach="material" color={pose.type === "pair" ? "blue" : "white"} />
          </line>
        </React.Fragment>
      ))
      }
    </>
  );
}


export default PosesPreview;