import { useParams } from 'react-router-dom';
import useTranslate from '../../hooks/useTranslate';

const Channelbox = () => {
  const { id } = useParams();
  const [translate, setTranslate] = useTranslate(Number(id));

  const onTranslationChange = (axis: number, val: number) => {
    setTranslate(axis, val);
  };

  return (
    <>
      <h2>Model Transforms</h2>
      {translate &&
        translate.map((val, index) => (
          <input
            type="number"
            key={index}
            value={val}
            onChange={(e) => onTranslationChange(index, Number(e.target.value))}
          />
        ))}
    </>
  );
};

export default Channelbox;
