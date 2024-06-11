import React, { useEffect, useState } from 'react';
import db, { ModelWithoutContent } from '../data/db';
import byteSize from 'byte-size'

const ModelOverview = () => {
  const [models, setModels] = useState<ModelWithoutContent[]>([]);

  useEffect(() => {
    const fetchModels = async () => {
      const modelsData = await db.getModels();
      setModels(modelsData);
    };

    fetchModels();
  }, []);

  const onRowClick = (id?: number) => {
    if (id === undefined) return;
    console.log(id);
  }

  const onDeleteClick = (id?: number) => {
    if (id === undefined) return;
    console.log(id);

    db.deleteModel(id);
  }



  return (
    <div>
      <h1>Models</h1>
      {/* <ul>
        {models.map(model => (
          <li key={model.id}>{model.name} {byteSize(model.size, { units: 'iec', precision: 1 }).toString()}</li>
        ))}
      </ul> */}

      <table className='border-2'>
        <thead>
          <tr>
            <th>Name</th>
            <th>Size</th>
          </tr>
        </thead>
        <tbody>
          {models.map(model => (
            <tr key={model.id} className='border-2'>
              <td className='border-2'>{model.name}</td>
              <td className='border-2'>{byteSize(model.size, { units: 'iec', precision: 1 }).toString()}</td>
              <td onClick={() => onRowClick(model.id)} className='border-2'>View</td>
              <td onClick={() => onDeleteClick(model.id)} className='border-2'>Delete</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ModelOverview;
