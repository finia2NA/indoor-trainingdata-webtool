import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../data/db';

type Transform = {
  translation: number[];
};

// eslint-disable-next-line no-unused-vars
const useTranslate = (id: number): [number[] | null, (axis: number, val: number) => void] => {
  const [localTranslate, setLocalTranslate] = useState<number[] | null>(null);
  const debounceTimeout = useRef<number | null>(null);

  const transform = useLiveQuery<Transform | null>(
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

  useEffect(() => {
    if (transform) {
      setLocalTranslate(transform.translation);
    }
  }, [transform]);

  const setTranslate = (axis: number, val: number) => {
    if (!localTranslate) return;
    const newVal = [...localTranslate];
    newVal[axis] = val;
    setLocalTranslate(newVal);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      db.setTranslation(Number(id), newVal);
    }, 500);
  };

  return [localTranslate, setTranslate];
};

export default useTranslate;
