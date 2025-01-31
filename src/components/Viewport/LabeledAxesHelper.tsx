import React from 'react';
import { Html } from '@react-three/drei'
import useEditorStore, { EditorState } from '../../hooks/useEditorStore';


interface LabeledAxesHelperProps {
  size?: number;
}

function htmlStyle(axis: string) {
  return {
    color: axis === 'x' ? 'red' : axis === 'y' ? 'green' : 'blue',
    fontSize: '2rem',
    fontWeight: 'bold'
  }
}

const LabeledAxesHelper: React.FC<LabeledAxesHelperProps> = ({ size = 5 }) => {
  const { showLabels } = useEditorStore((state) => (state as EditorState));

  return (
    <>
      <axesHelper args={[size]} />
      {showLabels &&
        <>
          <mesh position={[size, 0, 0]}>
            <Html style={htmlStyle("x")}>x</Html>
          </mesh>
          <mesh position={[0, size, 0]}>
            <Html style={htmlStyle("y")}>y</Html>
          </mesh>
          <mesh position={[0, 0, size]}>
            <Html style={htmlStyle("z")}>z</Html>
          </mesh>
        </>
      }
    </>
  );
};

export default LabeledAxesHelper;