import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db, { Transformation } from '../data/db';

type UseTransformReturn = [
  transform: Transformation | null,
  // eslint-disable-next-line no-unused-vars
  setTransform: (newTransform: Transformation) => void
]

const useTransform = (id: number): UseTransformReturn => {

  // Store data and debounce
  const [localTransform, setLocalTransform] = useState<Transformation | null>(null)
  const debounceTimeout = useRef<number | null>(null);

  // store db transform
  const dbTransform = useLiveQuery<Transformation | null>(
    async () => {
      if (!id) {
        return null;
      }
      const curr = await db.models.get(Number(id));
      if (!curr) {
        return null;
      }
      return curr.transform;
    },
    [id]
  );

  // when the db transform changes, update our local version
  useEffect(() => {
    if (dbTransform) {
      setLocalTransform(dbTransform);
    }
  }, [dbTransform]);

  const setTransform = (transform: Transformation) => {
    // update the local version immmmmeeddiatttlyyy
    setLocalTransform(transform)

    // if another timer is already running and we are newer, to the shadow realm with it
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // set a short timer, after which the persistent storage gets overwritten with local
    debounceTimeout.current = setTimeout(() => {
      if (!localTransform) {
        throw new Error("localTransform is null. This should never happen.");
      }
      db.setModelTransform(id, localTransform);
    }, 500);

  }

  return [localTransform, setTransform];

}

export default useTransform;