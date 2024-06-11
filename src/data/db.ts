import Dexie, { Table } from 'dexie';

// Data model

interface ModelWithoutContent {
  id?: number;
  name: string;
  size: number;
}
interface Model extends ModelWithoutContent {
  content: string;
}

// DB definition
class MyAppDatabase extends Dexie {
  models!: Table<Model>;

  constructor() {
    super('webtool');
    this.version(1).stores({
      models: '++id, name, content, size'
    });
  }
}

export const db = new MyAppDatabase();

// Data manipulation methods
export const addModel = async (model: Model): Promise<number> => {
  return await db.models.add(model);
};


/**
 * Retrieves a model from the database based on the provided ID.
 * @param id - The ID of the model to retrieve.
 * @returns A Promise that resolves to the retrieved model, or undefined if the model is not found.
 */
export const getModel = async (id: number): Promise<Model | undefined> => {
  return await db.models.get(id);
};


/**
 * Retrieves models from the database.
 * @returns A promise that resolves to an array of models without content.
 */
export const getModels = async (): Promise<ModelWithoutContent[]> => {
  const models = await db.models.toArray();
  return models.map(({ id, name, size }) => ({ id, name, size }));
};
