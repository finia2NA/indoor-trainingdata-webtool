import { useParams } from 'react-router-dom';
import useMultiTransformationStore3 from '../../hooks/useTransform3';




const Channelbox = () => {
  const { id } = useParams();
  const idnum = Number(id);

  const { addTransformation, transformations, getTransformation } = useMultiTransformationStore3();

  if (!transformations[idnum]) {
    addTransformation(idnum);
  }

  const aa = getTransformation(27);
  const bb = transformations[27];

  return (
    <></>
  )

};

export default Channelbox;
