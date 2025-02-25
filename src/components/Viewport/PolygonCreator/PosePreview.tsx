
import { PoseType } from "../../../hooks/useDataGeneratorUtils";
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
  const posePairs = [];
  for (const p1 of poses) {
    if (p1.type === PoseType.PAIR) {
      // find the 1st image
      const pair = poses.find(p2 => p2.type === PoseType.SINGLE && p1.series === p2.series);
      if (pair) {
        posePairs.push({ p1, p2: pair });
      }
    }
  }

  return (
    <>
      {withSmallerTarget.map((pose, index) => (
        <React.Fragment key={index}>
          <mesh position={pose.position}>
            <sphereGeometry args={[0.02, 16, 16]} />
            <meshBasicMaterial color={pose.type === PoseType.PAIR ? "violet" : "white"} />
          </mesh>
          <line>
            <bufferGeometry attach="geometry" ref={(geometry) => geometry && geometry.setFromPoints([pose.position, pose.target])} />
            <lineBasicMaterial attach="material" color={pose.type === "pair" ? "violet" : "white"} />
          </line>
        </React.Fragment>

      ))
      }
      {posePairs.map((pair, index) => (
        <React.Fragment key={index}>
          <line>
            <bufferGeometry attach="geometry" ref={(geometry) => geometry && geometry.setFromPoints([pair.p1.position, pair.p2.position])} />
            <lineBasicMaterial attach="material" color="green" />
          </line>
        </React.Fragment>
      ))}
    </>
  );
}


export default PosesPreview;