import { useNavigate } from 'react-router-dom';
import db from '../data/db';
import byteSize from 'byte-size';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import Modal, { ProjectModal } from './Modal';

const ModelOverview = () => {
  const models = useLiveQuery(() => db.models.toArray(), []);
  const navigate = useNavigate(); // Import and use the useNavigate hook

  const [editingProject, setEditingProject] = useState<number | null>(null);

  const onView = (id?: number) => {
    if (id === undefined) return;
    navigate(`/view/${id}`); // Navigate to the desired URL
  };

  const onRename = (name: string, id?: number) => {
    if (id === undefined) return;
    console.log(`Renaming project ${id} to ${name}`);

    const newName = prompt('Enter the new name for the model:', name);
    if (newName === null || newName === "") return;

    db.editModelName(id, newName);
  };

  const onEdit = (id?: number) => {
    if (id === undefined) return;
    setEditingProject(id);
  }

  const onDelete = async (id?: number) => {
    if (id === undefined) return;
    console.log(`Deleting project ${id}`);

    await db.deleteModel(id);
  };

  return (
    <>
      <div>
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
                <td onClick={() => onView(model.id)} className='border-2 cursor-pointer'>View</td>
                <td onClick={() => onEdit(model.id)} className='border-2 cursor-pointer'>Edit</td>
                <td onClick={() => onDelete(model.id)} className='border-2 cursor-pointer'>Delete</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editingProject !== null && (
        <ProjectModal
          projectId={editingProject}
          onClose={() => { setEditingProject(null) }}
        />
      )}
    </>
  );
};

export default ModelOverview;
