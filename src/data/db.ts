import Dexie, { Table } from 'dexie';
import Transformation from './Transformation';

// Data model
export interface ModelWithoutContent {
  id?: number;
  name: string;
  size: number;
}
export class Model3D implements ModelWithoutContent {
  id?: number;
  name: string;
  size: number;
  content: string;
  transform: Transformation;

  constructor(file: File, fileData: ArrayBuffer) {
    this.name = file.name;
    this.size = file.size;

    this.content = new TextDecoder().decode(fileData);
    this.transform = new Transformation();
  }
}


// DB definition
class MyAppDatabase extends Dexie {
  models!: Table<Model3D>;

  constructor() {
    super('webtool');
    this.version(1).stores({
      models: '++id, name, content, size, transform',
    });
  }

  // Data manipulation methods
  async addModel(model: Model3D): Promise<number> {
    return await this.models.add(model);
  }

  /**
   * Retrieves a model from the database based on the provided ID.
   * @param id - The ID of the model to retrieve.
   * @returns A Promise that resolves to the retrieved model, or undefined if the model is not found.
   */
  async getModel(id: number): Promise<Model3D | undefined> {
    return await this.models.get(id);
  }

  /**
   * Retrieves models from the database.
   * @returns A promise that resolves to an array of models without content.
   */
  async getModels(): Promise<ModelWithoutContent[]> {
    const models = await this.models.toArray();
    return models.map(({ id, name, size }) => ({ id, name, size }));
  }


  /**
   * Updates the name of a model in the database.
   * @param id - The ID of the model to update.
   * @param newName - The new name for the model.
   * @returns A Promise that resolves when the update is complete.
   */
  async editModelName(id: number, newName: string): Promise<void> {
    await this.models.update(id, { name: newName });
  }

  /**
   * Edits the transformation of a model with the specified ID.
   *
   * @param id - The unique identifier of the model to be updated.
   * @param newTransform - The new transformation to be applied to the model.
   * @returns A promise that resolves when the update is complete.
   */
  async setModelTransform(id: number, newTransform: Transformation): Promise<void> {
    await this.models.update(id, { transform: newTransform });
  }

  async setTranslation(id: number, newTranslation: number[]): Promise<void> {

    console.log("hi");

    const model = await this.models.get(id);
    if (model) {
      model.transform.translation = newTranslation;
      await this.models.update(id, { transform: model.transform });
    }
  }

  /**
   * Deletes a model from the database based on the provided ID.
   * @param id - The ID of the model to delete.
   * @returns A promise that resolves when the model is deleted.
   */
  async deleteModel(id: number): Promise<void> {
    await this.models.delete(id);
  }

  /**
   * Clears all tables in the database.
   * @returns A promise that resolves when all tables are cleared.
   */
  async clearAllTables(): Promise<void> {
    const tableNames = this.tables.map(table => table.name);
    await Promise.all(tableNames.map(tableName => this.table(tableName).clear()));
    console.log('All tables cleared!');
  }
}

const db = new MyAppDatabase();
export default db;
