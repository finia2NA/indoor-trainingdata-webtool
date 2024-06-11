import React, { useEffect, useState } from 'react';

function Display() {
  const [fileContent, setFileContent] = useState(null);

  useEffect(() => {
    const fileData = localStorage.getItem('uploadedFile');
    if (fileData) {
      setFileContent(fileData);
    }
  }, []);

  return (
    <div>
      <h1>Display File Content</h1>
      {fileContent ? (
        <div>
          <p>File content:</p>
          <img src={fileContent} alt="Uploaded File" />
        </div>
      ) : (
        <p>No file uploaded</p>
      )}
    </div>
  );
}

export default Display;
