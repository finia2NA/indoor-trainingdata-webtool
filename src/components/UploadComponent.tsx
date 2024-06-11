import React from 'react';
import { useDropzone } from 'react-dropzone';
import db from '../data/db';

const UploadComponent: React.FC = () => {
  const onDrop = async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const fileData = await file.arrayBuffer();
      const size = file.size;
      const name = file.name;
      const content = new TextDecoder().decode(fileData);

      // TODO: here is where we would do validation, not rn though :)

      // Add the file to the database
      await db.addModel({ name, content, size });
      console.log(`File ${name} added to the database`);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} className='border-2 border-dashed border-sky-500 rounded-md p-5 text-center cursor-pointer'>
      <input {...getInputProps()} />
      <p>Drag + drop some files here, or click to select files</p>
    </div>
  );
};


export default UploadComponent;
