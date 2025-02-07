import useCameraPoseStore from "../../hooks/useCameraPoseStore";

const toNPrecision = (num: number, n = 3) => {
  const fixed = num.toFixed(n);
  return num >= 0 ? "\u00A0" + fixed : fixed;
}

const toDegrees = (radians: number) => {
  return (radians * 180) / Math.PI;
}

const toZeroPad = (inStr: string) => {
  const sign = inStr[0];
  const workingString = inStr.slice(1, inStr.length);

  const [whole, decimal] = workingString.split('.');
  const wholePadded = whole.padStart(3, '0');
  return `${sign}${wholePadded}.${decimal}`;
}

const CameraPoseDisplay = () => {
  const { reactiveCameraPosition: cameraPosition, reactiveCameraRotation: cameraRotation } = useCameraPoseStore();
  const pos = cameraPosition.map(x => toNPrecision(x, 3));
  const rot = cameraRotation.map(toDegrees).map(x => toNPrecision(x, 1)).map(toZeroPad);

  return (
    <div className="bg-oxford_blue bg-opacity-60 text-gray-100 px-2 py-3 gap-2 font-mono pointer-events-auto text-sm">
      <h3 className="text-gray-400">Camera Position</h3>
      <p>{`[${pos[0]}, ${pos[1]}, ${pos[2]}]`}</p>
      <h3 className="text-gray-400">Camera Rotation</h3>
      <p>{`[${rot[0]}, ${rot[1]}, ${rot[2]}]`}</p>
    </div>
  );
}

export default CameraPoseDisplay;
