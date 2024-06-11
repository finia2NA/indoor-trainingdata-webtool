import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Upload() {
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        localStorage.setItem('uploadedFile', e.target.result);
        navigate('/display');
      };
      reader.readAsDataURL(file); // or readAsText if the file is a text file
    }
  };

  return (
    <div>
      <h1>Upload File</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}

export default Upload;
