import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db, { Transformation } from '../data/db';

type UseTransformReturn = {
  // Whole transform base
  transform: Transformation | null,
  // eslint-disable-next-line no-unused-vars
  setTransform: (newTransform: Transformation) => void

  // Individual components
  translation: number[] | null,
  // eslint-disable-next-line no-unused-vars
  setTranslation: (translationVector: number[]) => void
  rotation: number[] | null,
  // eslint-disable-next-line no-unused-vars
  setRotation: (rotationVector: number[]) => void
  scale: number[] | null,
  // eslint-disable-next-line no-unused-vars
  setScale: (scaleVector: number[]) => void
}

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
      return new Transformation(curr.transform.translation, curr.transform.rotation, curr.transform.scale);
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

  const translation = localTransform?.translation ?? null;
  const setTranslation = (translationVector: number[]) => {
    if (!localTransform) {
      throw new Error("localTransform is null. This should never happen.");
    }
    const newTransform = localTransform.copy();
    newTransform.translation = translationVector;
    setTransform(newTransform);
  }

  const rotation = localTransform?.rotation ?? null;
  const setRotation = (rotationVector: number[]) => {
    if (!localTransform) {
      throw new Error("localTransform is null. This should never happen.");
    }
    const newTransform = localTransform.copy();
    newTransform.rotation = rotationVector;
    setTransform(newTransform);
  }

  const scale = localTransform?.scale ?? null;
  const setScale = (scaleVector: number[]) => {
    if (!localTransform) {
      throw new Error("localTransform is null. This should never happen.");
    }
    const newTransform = localTransform.copy();
    newTransform.scale = scaleVector;
    setTransform(newTransform);
  }

  return {
    transform: localTransform,
    setTransform,
    translation,
    setTranslation,
    rotation,
    setRotation,
    scale,
    setScale
  }

}

export default useTransform;