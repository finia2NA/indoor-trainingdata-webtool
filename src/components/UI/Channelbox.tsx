import { useParams } from 'react-router-dom';
import InputWithDrag from 'react-input-with-drag';
import useTransformationStore from '../../hooks/useTransform2';
// import type { InputWithDragChangeHandler } from 'react-input-with-drag';



interface SingleChannelProps {
  title: string;
  value: number[];
  // eslint-disable-next-line no-unused-vars
  onChange: (axis: number, val: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

const SingleChannel = ({ title, value, onChange, step = 1, min = -Infinity, max = Infinity }: SingleChannelProps) => {
  return (
    <div className='flex flex-col'>
      <h2>{title}</h2>
      <div className='flex flex-row'>
        {value.map((val, i) => (
          <InputWithDrag
            className='bg-white text-black'
            key={i}
            value={val}
            step={step}
            min={min}
            max={max}
            onChange={value => onChange(i, value)}
          />
        ))}
      </div>
    </div>
  )

}


const Channelbox = () => {
  const { id: idParam } = useParams();
  const id = Number(idParam);

  const { addTransformation, getTransformation, removeTransformation, reset, setRotation, setScale, setTranslation, transformations } = useTransformationStore();

  let transformation = getTransformation(id.toString());
  if (!transformation) {
    addTransformation(id.toString());
    transformation = getTransformation(id.toString());
  }

  // console.log(transformation)

  
  const translation = transformation?.translation || [0, 0, 0];
  const onTranslationChange = (axis: number, val: number) => {
    if (!translation) {
      return;
    }
    const newTranslation = [...translation];
    newTranslation[axis] = val;
    setTranslation(id.toString(), newTranslation);
  };

  const rotation = transformation?.rotation || [0, 0, 0];
  const onRotationChange = (axis: number, val: number) => {
    if (!translation || !rotation) {
      return;
    }
    const newRotation = [...rotation];
    newRotation[axis] = val;
    setRotation(id.toString(), newRotation);
  }

  const scale = transformation?.scale || [1, 1, 1];
  const onScaleChange = (axis: number, val: number) => {
    if (!translation) {
      return;
    }
    const newScale = [...scale];
    newScale[axis] = val;
    setScale(id.toString(), newScale);
  }

  return (
    // <></>
    <>
      <h2>Model Transforms</h2>
      {translation && // rotation && scale &&
        (
          <>
            <SingleChannel title="Translation" value={translation} onChange={onTranslationChange} />
            <SingleChannel title="Rotation" value={rotation} onChange={onRotationChange} />
            <SingleChannel title="Scale" value={scale} onChange={onScaleChange} />
          </>
        )}
    </>
  );
};

export default Channelbox;
