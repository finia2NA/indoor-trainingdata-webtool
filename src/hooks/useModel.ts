/**
 * Dexie hook that returns a model. Currently not in use (check this before deletion).
 */

import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { isNumeric } from "../utils";
import db from "../data/db";


const useModel = (id: string) => {
  const navigate = useNavigate();

  const model = useLiveQuery(
    async () => {
      let curr = null;
      if (!id || !isNumeric(id)) {
        navigate('/404');
        return null;
      }

      curr = await db.models.where('id').equals(Number(id)).first();
      if (!curr) {
        navigate('/404');
        return null;
      }

      return curr;
    },
    [id]
  );

  return model;
};

export default useModel;