import useCameraPoseStore from "../../hooks/state/useCameraPoseStore";
import { VscChevronDown, VscChevronUp } from "react-icons/vsc";
import { atom, useAtom } from "jotai";

const toNPrecision = (num: number, n = 3) => {
  const fixed = num.toFixed(n);
  return num >= 0 ? "\u00A0" + fixed : fixed;
}

const toDegrees = (radians: number) => {
  return (radians * 180) / Math.PI;
}

const toZeroPad = (inStr: string) => {
  const sign = inStr[0];
  const workingString = inStr.slice(1);

  const [whole, decimal] = workingString.split('.');
  const wholePadded = whole.padStart(3, '0');
  return `${sign}${wholePadded}.${decimal}`;
}

// I want this to persist accros projects. Using jotai for this bc I don't feel like using zustand
const isOpenAtom = atom(false);

const CameraPoseDisplay = () => {
  const { reactiveCameraPosition: cameraPosition, reactiveCameraRotation: cameraRotation } = useCameraPoseStore();
  const pos = cameraPosition.map(x => toNPrecision(x, 3));
  const rot = cameraRotation.map(toDegrees).map(x => toNPrecision(x, 1)).map(toZeroPad);

  const [isOpen, setIsOpen] = useAtom(isOpenAtom);
  const toggleIsOpen = () => setIsOpen(!isOpen);

  return (
    <div className="pointer-events-auto">
      <div
        className="flex items-center cursor-pointer text-gray-100 gap-1"
        onClick={toggleIsOpen}
      >
        {isOpen ? <VscChevronDown /> : <VscChevronUp />}
        <h3 className="text-sm">Camera Pose</h3>
      </div>
      {isOpen && (
        <div className="bg-bg bg-opacity-60 text-gray-100 px-2 py-3 gap-2 font-mono text-sm">
          <h4 className="text-gray-400">Camera Position</h4>
          <p>{`[${pos[0]}, ${pos[1]}, ${pos[2]}]`}</p>
          <h4 className="text-gray-400">Camera Rotation</h4>
          <p>{`[${rot[0]}, ${rot[1]}, ${rot[2]}]`}</p>
        </div>
      )}
    </div>
  );
}

export default CameraPoseDisplay;
