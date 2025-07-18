import useMultiTransformationStore from '../../../hooks/state/useMultiTransformationStore';
import { LuExpand, LuMove, LuRotate3D } from "react-icons/lu";
import useEditorStore, { EditorState } from '../../../hooks/state/useEditorStore';
import { InteractiveInput } from '@designbyadrian/react-interactive-input';
import SidebarSection from './SidebarSection';
import { Model3D, Project } from '../../../data/db';
import { Fragment } from 'react/jsx-runtime';

import { IoMdEye, IoMdEyeOff } from "react-icons/io";



type SingleChannelProps = {
  name: string,
  values: number[],
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
      <button className={`flex h-6 items-center ${isActive ? "text-primary" : ""}`}
        onClick={() => setTransformMode(name.toLowerCase() as EditorState["transformMode"])}
      >
        {icon}
      </button>
      <div className='flex flex-col gap-1'>
        <button className={`flex h-6 items-center ${isActive ? "text-primary" : ""}`}
          onClick={() => setTransformMode(name.toLowerCase() as EditorState["transformMode"])}
        >
          <h3>{name}</h3>
        </button>
        <div className='flex flex-row gap-1 pl-1 pb-1'>
          {values.map((val, idx) => (
            <InteractiveInput
              className='w-20 bg-inactive  basis-1/3 text-center'
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

type ModelChannelProps = {
  model: Model3D
  modelId: number
  projectId: number
}

const ModelChannel = ({ model, modelId, projectId }: ModelChannelProps) => {
  const { getTransformation, setTranslation, setRotation, setScale, getVisibility, setVisibility } = useMultiTransformationStore();
  const myTransformation = getTransformation(projectId, modelId);
  const myVisibility = getVisibility(projectId, modelId);

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
    setTranslation(projectId, modelId, sanitizedVals);
  }

  const rotateSetter = (newVals: number[]) => {
    const sanitizedVals = newVals.map((val) => {
      if (isNaN(val)) {
        return 0;
      }
      return val;
    });
    setRotation(projectId, modelId, sanitizedVals);
  }

  const scaleSetter = (newVals: number[]) => {
    const sanitizedVals = newVals.map((val) => {
      if (isNaN(val)) {
        return 1;
      }
      return val;
    });
    setScale(projectId, modelId, sanitizedVals);
  }

  const visibilitySetter = (newVal: boolean) => {
    setVisibility(projectId, modelId, newVal);
  }

  const titleSection =
    <div className='flex flex-row gap-2 items-center'>
      <button
        className={`flex h-6 items-center ${myVisibility ? "text-confirm" : "text-danger"}`}
        onClick={() => visibilitySetter(!myVisibility)}>
        {myVisibility ? <IoMdEye /> : <IoMdEyeOff />}
      </button>
      <span>{model.name}</span>
    </div>

  return (
    <SidebarSection title={titleSection}>
      <SingleChannel name="Translate" min={-10} max={10} step={0.1}
        values={myTransformation.translation} onChange={translateSetter} />
      <SingleChannel name="Rotate" min={-Math.PI} max={Math.PI} step={0.05}
        values={myTransformation.rotation} onChange={rotateSetter} />
      <SingleChannel name="Scale" min={0.1} max={3} step={0.1}
        values={myTransformation.scale} onChange={scaleSetter} />
    </SidebarSection>
  )
}

type LayoutSidebarProps = {
  project: Project
}

const LayoutSidebar = ({ project }: LayoutSidebarProps) => {
  // eslint-disable-next-line react-compiler/react-compiler
  "use no memo"; // LATER: upgrade react compiler, see if that fixes this // make a bug report

  const { addTransformation, getTransformation } = useMultiTransformationStore();

  const projectId = project.id;
  if (!projectId) {
    throw new Error("Project has no id");
  }
  const models = project.models;
  for (const model of models) {
    if (!getTransformation(projectId, model.id)) {
      addTransformation(projectId, model.id);
    }
  }

  return (
    <>
      {models.map((model) => {
        if (model.id === undefined) {
          throw new Error("Model has no id");
        }
        return (
          <Fragment key={model.id}>
            <ModelChannel model={model} modelId={model.id} projectId={projectId!} />
          </Fragment>
        )
      })
      }
    </>
  )
};

export default LayoutSidebar;
