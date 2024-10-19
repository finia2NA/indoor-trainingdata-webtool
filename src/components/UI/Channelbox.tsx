
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../data/db';
import { useParams } from 'react-router-dom';

// interface SingleInputProps {
//   val: number[];
//   setVal: (val: number[]) => void;
// }

// const SingleInput = () => {

// }

const Channelbox = () => {
  const { id } = useParams();

  const transform = useLiveQuery(
    async () => {
      let curr = null;
      if (!id) {
        return null;
      }
      curr = await db.models.get(Number(id));
      if (!curr) {
        return null;
      }
      return curr.transform;
    },
    [id]
  );


  const onTranslationChange = (axis: number, val: number) => {
    if (!transform) return
    const newVal = [...transform.translation];
    newVal[axis] = val;
    db.setTranslation(Number(id), newVal);
  }

  return (
    <>
      <h2>Model Transforms</h2>
      {transform &&
        transform.translation.map((val, index) =>
          <input type="number" key={index}
            value={val}
            onChange={(e) => onTranslationChange(index, Number(e.target.value))}
          />
        )
      }

    </>
  )
}

export default Channelbox;