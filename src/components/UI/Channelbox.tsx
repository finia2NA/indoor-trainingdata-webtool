import { useParams } from 'react-router-dom';
import useTransform from '../../hooks/useTransform';
import InputWithDrag from 'react-input-with-drag';
import useTranslate from '../../hooks/useTranslate';
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
  const { id } = useParams();
  // const {
  //   translation, setTranslation,
  //   rotation, setRotation,
  //   scale, setScale
  // } = useTransform(Number(id));

  // const onTranslationChange = (axis: number, val: number) => {
  //   if (!translation) {
  //     return;
  //   }
  //   const newTranslation = [...translation];
  //   newTranslation[axis] = val;
  //   setTranslation(newTranslation);
  // };

  // const onRotationChange = (axis: number, val: number) => {
  //   if (!rotation) {
  //     return;
  //   }
  //   const newRotation = [...rotation];
  //   newRotation[axis] = val;
  //   setRotation(newRotation);
  // }

  // const onScaleChange = (axis: number, val: number) => {
  //   if (!scale) {
  //     return;
  //   }
  //   const newScale = [...scale];
  //   newScale[axis] = val;
  //   setScale(newScale);
  // }

  const [translation, setTranslation] = useTranslate(Number(id));
  const onTranslationChange = setTranslation;

  return (
    <>
      <h2>Model Transforms</h2>
      {translation && // rotation && scale &&
        (
          <>
            <input type="text" value={translation[0]} onChange={(v) => onTranslationChange(0, Number(v.target.value))} />
            {/* <SingleChannel title="Translation" value={translation} onChange={onTranslationChange} />
          <SingleChannel title="Rotation" value={rotation} onChange={onRotationChange} />
          <SingleChannel title="Scale" value={scale} onChange={onScaleChange} /> */}
          </>
        )}
    </>
  );
};

export default Channelbox;
