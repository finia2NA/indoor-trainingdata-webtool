import { useParams } from 'react-router-dom';
import useMultiTransformationStore3 from '../../hooks/useTransform3';




const Channelbox = () => {
  const { id } = useParams();
  const idnum = Number(id);

  const { addTransformation, getTransformation, setTranslation } = useMultiTransformationStore3();

  if (!getTransformation(idnum)) {
    addTransformation(idnum);
  }

  const myTransformation = getTransformation(idnum);
  if (!myTransformation) {
    return <></>
  }

  const setter = (val: number[]) => {
    const prevVal = myTransformation.translation;
    const newVal = [...prevVal];
    newVal[0] = val[0];
    setTranslation(idnum, newVal);
  }

  return (
    <input type="number" value={myTransformation.translation[0]} onChange={(e) => setter([Number(e.target.value), 0, 0])} />
  )

};

export default Channelbox;
