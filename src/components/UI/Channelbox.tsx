import { useParams } from 'react-router-dom';
import useMultiTransformationStore from '../../hooks/useTransforms';
import InputWithDrag from 'react-input-with-drag';


interface SingleChannelProps {
  name: string,
  values: number[],
  onChange: (val: number[]) => void,
  step?: number,
  min?: number,
  max?: number,
}

const SingleChannel = ({ name, values, onChange, step = 1, min = -100, max = 100 }: SingleChannelProps) => {

  const individualChanger = (axis: number, val: number) => {
    const newVal = [...values];
    newVal[axis] = val;
    onChange(newVal);
  }

  return (
    <div className='flex flex-col'>
      <h3>{name}</h3>
      <div className='flex flex-row gap-1'>
        {values.map((val, idx) => (
          <InputWithDrag
            className='w-16 text-right' type="number" key={idx}
            min={min} max={max} step={step}
            value={val} onChange={i => individualChanger(idx, i)} />
        ))}
      </div>
    </div>
  )
}


const Channelbox = () => {
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
    setTranslation(idnum, newVals);
  }
  const rotateSetter = (newVals: number[]) => {
    setRotation(idnum, newVals);
  }
  const scaleSetter = (newVals: number[]) => {
    setScale(idnum, newVals);
  }

  return (
    <>
      <h2 className='text-xl'>Channelbox</h2>
      <div>
        <SingleChannel name="Translate" min={-10} max={10} step={0.1}
          values={myTransformation.translation} onChange={translateSetter} />
        <SingleChannel name="Rotate" min={-Math.PI} max={Math.PI} step={0.05}
          values={myTransformation.rotation} onChange={rotateSetter} />
        <SingleChannel name="Scale" min={0.1} max={3} step={0.1}
          values={myTransformation.scale} onChange={scaleSetter} />
      </div>
    </>
  )

};

export default Channelbox;
