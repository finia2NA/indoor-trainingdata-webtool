import { useParams } from 'react-router-dom';
import useMultiTransformationStore3 from '../../hooks/useTransform3';


interface SingleChannelProps {
  name: string,
  values: number[],
  onChange: (val: number[]) => void,
}

const SingleChannel = ({ name, values, onChange }: SingleChannelProps) => {

  const individualChanger = (axis: number, val: number) => {
    const newVal = [...values];
    newVal[axis] = val;
    onChange(newVal);
  }

  return (
    <>
      <h2>{name}</h2>
      {values.map((val, i) => (
        <input key={i} type="number" value={val} onChange={(e) => individualChanger(i, Number(e.target.value))} />
      ))}
    </>
  )
}




const Channelbox = () => {
  const { id } = useParams();
  const idnum = Number(id);

  const { addTransformation, getTransformation, setTranslation, setRotation, setScale } = useMultiTransformationStore3();

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
      <SingleChannel name="Translate" values={myTransformation.translation} onChange={translateSetter} />
      <SingleChannel name="Rotate" values={myTransformation.rotation} onChange={rotateSetter} />
      <SingleChannel name="Scale" values={myTransformation.scale} onChange={scaleSetter} />
    </>
  )

};

export default Channelbox;
