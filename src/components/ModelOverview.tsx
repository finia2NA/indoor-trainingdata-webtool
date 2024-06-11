import db from '../data/db';
import byteSize from 'byte-size';
import { useLiveQuery } from 'dexie-react-hooks';

const ModelOverview = () => {
  const models = useLiveQuery(() => db.models.toArray(), []);

  const onView = (id?: number) => {
    if (id === undefined) return;
    console.log(id);
  };

  const onRename = (id?: number) => {
    if (id === undefined) return;
    console.log(id);

    const newName = prompt('Enter the new name for the model:');
    if (newName === null || newName === "") return;

    db.editModelName(id, newName);

  }

  const onDelete = async (id?: number) => {
    if (id === undefined) return;
    console.log(id);

    await db.deleteModel(id);
  };

  return (
    <div>
      <h1>Models</h1>
      <table className='border-2'>
        <thead>
          <tr>
            <th>Name</th>
            <th>Size</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {models && models.map(model => (
            <tr key={model.id} className='border-2'>
              <td className='border-2'>{model.name}</td>
              <td className='border-2'>{byteSize(model.size, { units: 'iec', precision: 1 }).toString()}</td>
              <td onClick={() => onView(model.id)} className='border-2'>View</td>
              <td onClick={() => onRename(model.id)} className='border-2'>Rename</td>
              <td onClick={() => onDelete(model.id)} className='border-2'>Delete</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ModelOverview;
