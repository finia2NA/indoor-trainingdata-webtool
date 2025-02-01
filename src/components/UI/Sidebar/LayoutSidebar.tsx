import { useParams } from 'react-router-dom';
import useMultiTransformationStore from '../../../hooks/useMultiTransformationStore';
import { LuExpand, LuMove, LuRotate3D } from "react-icons/lu";
import useEditorStore, { EditorState } from '../../../hooks/useEditorStore';
import { InteractiveInput } from '@designbyadrian/react-interactive-input';
import SidebarSection from './SidebarSection';




interface SingleChannelProps {
  name: string,
  values: number[],
  // eslint-disable-next-line no-unused-vars
  onChange: (val: number[]) => void,
  step?: number,
  min?: number,
  max?: number,
}

const SingleChannel = ({ name, values, onChange, step = 1, min = -100, max = 100 }: SingleChannelProps) => {

  const { transformMode, setTransformMode } = useEditorStore((state) => state as EditorState);
  const isActive = transformMode === name.toLowerCase();

  const individualChanger = (axis: number, val: number) => {
    const newVal = [...values];
    newVal[axis] = val;
    onChange(newVal);
  }

  let icon = null
  switch (name) {
    case "Translate":
      icon = <LuMove />
      break;
    case "Rotate":
      icon = <LuRotate3D />
      break;
    case "Scale":
      icon = <LuExpand />
      break;
    default:
      throw new Error("Invalid channel name");
  }

  return (
    <div className='flex flex-row px-1 gap-1'>
      <button className={`flex h-6 items-center ${isActive ? "text-orangeweb" : ""}`}
        onClick={() => setTransformMode(name.toLowerCase() as EditorState["transformMode"])}
      >
        {icon}
      </button>
      <div className='flex flex-col gap-1'>
        <button className={`flex h-6 items-center ${isActive ? "text-orangeweb" : ""}`}
          onClick={() => setTransformMode(name.toLowerCase() as EditorState["transformMode"])}
        >
          <h3>{name}</h3>
        </button>
        <div className='flex flex-row gap-1 pl-1 pb-1'>
          {values.map((val, idx) => (
            <InteractiveInput
              className='w-20 text-right bg-dim_gray  basis-1/3'
              type="number" key={idx}
              min={min} max={max} step={step}
              // TODO: I want to limit the display to 3 decimal places, but without changing the actual value
              value={val}
              onChange={e => individualChanger(idx, Number(e.target.value))} />
          ))}
        </div>
      </div>
    </div >
  )
}

const LayoutSidebar = () => {
  const { id } = useParams();
  const idnum = Number(id);

  const { addTransformation, getTransformation, setTranslation, setRotation, setScale } = useMultiTransformationStore();

  if (!getTransformation(idnum)) {
    addTransformation(idnum);
  }

  const myTransformation = getTransformation(idnum);
  if (!myTransformation) {
    return <></>
  }

  const translateSetter = (newVals: number[]) => {
    const sanitizedVals = newVals.map((val) => {
      if (isNaN(val)) {
        return 0;
      }
      return val;
    });
    setTranslation(idnum, sanitizedVals);
  }
  const rotateSetter = (newVals: number[]) => {
    const sanitizedVals = newVals.map((val) => {
      if (isNaN(val)) {
        return 0;
      }
      return val;
    });
    setRotation(idnum, sanitizedVals);
  }
  const scaleSetter = (newVals: number[]) => {
    const sanitizedVals = newVals.map((val) => {
      if (isNaN(val)) {
        return 1;
      }
      return val;
    });
    setScale(idnum, sanitizedVals);
  }

  return (
    <>
      <SidebarSection title="Channelbox">
        <SingleChannel name="Translate" min={-10} max={10} step={0.1}
          values={myTransformation.translation} onChange={translateSetter} />
        <SingleChannel name="Rotate" min={-Math.PI} max={Math.PI} step={0.05}
          values={myTransformation.rotation} onChange={rotateSetter} />
        <SingleChannel name="Scale" min={0.1} max={3} step={0.1}
          values={myTransformation.scale} onChange={scaleSetter} />
      </SidebarSection>
    </>
  )

};

export default LayoutSidebar;
