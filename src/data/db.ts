import Dexie, { Table } from 'dexie';

// Data model
export interface ModelWithoutContent {
  id?: number;
  name: string;
  size: number;
}
export interface Model extends ModelWithoutContent {
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

  // Data manipulation methods
  async addModel(model: Model): Promise<number> {
    return await this.models.add(model);
  }

  /**
   * Retrieves a model from the database based on the provided ID.
   * @param id - The ID of the model to retrieve.
   * @returns A Promise that resolves to the retrieved model, or undefined if the model is not found.
   */
  async getModel(id: number): Promise<Model | undefined> {
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
