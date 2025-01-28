import React from 'react';
import { useDropzone } from 'react-dropzone';
import db, { Model3D } from '../data/db';

const UploadComponent: React.FC = () => {
  const onDrop = async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const model3D: Model3D = new Model3D(file);

      // Add the file to the database
      // await db.addModel({ name, content, size });
      await db.addModel(model3D);
      console.log(`File ${model3D.name} added to the database`);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} className='border-2 border-dashed border-orangeweb rounded-md p-5 text-center cursor-pointer'>
      <input {...getInputProps()} />
      <p>Drag + drop some files here, or click to select files</p>
    </div>
  );
};


export default UploadComponent;
