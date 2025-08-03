import { createPortal } from "react-dom";
import React, { useEffect, useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { ProjectDeletionToast } from "./UI/Toasts";
import UploadComponent from "./UploadComponent";
import db, { Image360, MetadataFile } from "../data/db";
import { useLiveQuery } from "dexie-react-hooks";
import byteSize from "byte-size";


type ProjectFileProps = {
  name: string,
  size: number,
  onDelete: () => void,
  index?: number,
};

const ProjectFile: React.FC<ProjectFileProps> = ({ name, size, index, onDelete }) => {
  const bgColor = index !== undefined && index % 2 === 0 ?
    "bg-blue-100" : "bg-white";

  const sizeInMb = byteSize(size, { units: 'iec', precision: 1 }).toString()
  return (
    <div className={`${bgColor} flex flex-row gap-2 items-center`}>
      <div className="w-32 overflow-x-auto whitespace-nowrap">
        {name}
      </div>
      <span className="text-gray-400">|</span>
      <div className="w-20 overflow-x-auto whitespace-nowrap">
        {sizeInMb}
      </div>
      <span className="text-gray-400">|</span>
      <button>
        <FiTrash2 className="text-danger" onClick={onDelete} />
      </button>
    </div>
  );
}

type ImageUploadProps = {
  projectId: number;
};

const ImageUpload: React.FC<ImageUploadProps> = ({ projectId }) => {
  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const image360 = new Image360(file);
        await db.addImageToProject(projectId, image360);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="cursor-pointer bg-blue-500 text-white p-2 rounded-md text-center hover:bg-blue-600">
        Upload 360° Images
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImageUpload(e.target.files)}
        />
      </label>
    </div>
  );
};

type MetadataUploadProps = {
  projectId: number;
  metadataFile?: MetadataFile;
};

const MetadataUpload: React.FC<MetadataUploadProps> = ({ projectId, metadataFile }) => {
  const handleMetadataUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.name.endsWith('.json')) {
      const metadata = new MetadataFile(file);
      await db.setMetadataFile(projectId, metadata);
    }
  };

  const handleMetadataDelete = async () => {
    await db.setMetadataFile(projectId, undefined);
  };

  return (
    <div className="flex flex-col gap-2">
      {metadataFile ? (
        <div className="bg-green-100 p-2 rounded-md flex justify-between items-center">
          <span>{metadataFile.name} ({byteSize(metadataFile.size, { units: 'iec', precision: 1 }).toString()})</span>
          <button onClick={handleMetadataDelete}>
            <FiTrash2 className="text-danger" />
          </button>
        </div>
      ) : (
        <label className="cursor-pointer bg-green-500 text-white p-2 rounded-md text-center hover:bg-green-600">
          Upload JSON Metadata
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => handleMetadataUpload(e.target.files)}
          />
        </label>
      )}
    </div>
  );
};

enum CloseReason {
  BACKGROUND = "background",
  CANCEL = "cancel",
  CONFIRM = "confirm",
}

type ProjectModalProps = {
  onClose: (reason?: CloseReason) => void,
  projectId: number,
  isNew?: boolean,
};



export const ProjectModal = ({ onClose, projectId, isNew }: ProjectModalProps) => {
  const project = useLiveQuery(() => db.projects.get(projectId), []);
  const [name, setName] = useState(project?.name || "");
  const models = project?.models || [];
  const images360 = project?.images360 || [];
  const metadataFile = project?.metadataFile;

  useEffect(() => {
    async function fetchData() {
      const project = await db.getProject(projectId);
      if (!project) return;
      const loadedName = project.name;
      setName(loadedName);
    }
    fetchData();
  }, [projectId]);


  const onConfirm = async () => {
    db.setProjectName(projectId, name);
    onClose(CloseReason.CONFIRM);
  }

  const onDelete = () => {
    toast.warn(ProjectDeletionToast, {
      onClose: async (reason) => {
        if (reason === "delete") {
          await db.deleteProject(projectId);
          onClose(CloseReason.CONFIRM)
        };
      },
    });
  }

  const h1 = (isNew ? "Creating Project" : "Editing Project") + " " + projectId;

  return (
    <Modal
      className="
      w-full sm:min-w-[32rem] sm:w-auto
      "
      onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-medium">{h1}</h1>
          <button
            className="bg-gray-200 p-2 rounded-md"
            title="Delete project"
            onClick={onDelete}
          >
            <FiTrash2 className="text-danger" />
          </button>
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-medium">Project Details</h2>
          <div className="flex flex-row gap-2 items-center">
            <label htmlFor="name">Project Name</label>
            <input
              id="Project "
              type="text"
              className="border-b-2 pl-1 pr-1"
              placeholder="Insert Project Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <hr className="mt-2" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-medium">Project Files</h2>
          {models.length > 0 &&
            <div className="border-bg border-2 border-dashed p-2 rounded-md">
              {models.map((model, i) => (
                <ProjectFile
                  key={i}
                  index={i}
                  name={model.name}
                  size={model.size}
                  onDelete={() => { db.deleteModelFromProject(projectId, model.id) }}
                />
              ))}
            </div>
          }
          <div className="flex flex-col pt-2">
            <h3 className="font-medium">Upload a new model</h3>

            <UploadComponent projectId={projectId} />
          </div>
          <hr className="mt-2" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-medium">360° Images</h2>
            {images360.length > 0 && (
              <button
                className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600"
                onClick={async () => {
                  try {
                    await db.deleteAllImagesFromProject(projectId);
                  } catch (error) {
                    console.error('Failed to delete all images:', error);
                  }
                }}
              >
                Delete All Images
              </button>
            )}
          </div>
          {images360.length > 0 &&
            <div className="border-bg border-2 border-dashed p-2 rounded-md">
              {images360.map((image, i) => (
                <ProjectFile
                  key={`image-${i}`}
                  index={i}
                  name={image.name}
                  size={image.size}
                  onDelete={async () => { 
                    try {
                      await db.deleteImageFromProject(projectId, image.id);
                    } catch (error) {
                      console.error('Failed to delete image:', error);
                    }
                  }}
                />
              ))}
            </div>
          }
          <div className="flex flex-col pt-2">
            <h3 className="font-medium">Upload 360° images</h3>
            <ImageUpload projectId={projectId} />
          </div>
          <div className="flex flex-col pt-2">
            <h3 className="font-medium">Upload JSON metadata</h3>
            <MetadataUpload projectId={projectId} metadataFile={metadataFile} />
          </div>
          <hr className="mt-2" />
        </div>
        <div className=" flex justify-end gap-2 pr-2">
          <button
            className="bg-confirm text-white p-2 rounded-md"
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
}

type ModalProps = {
  onClose: (reason?: CloseReason) => void,
  children: React.ReactNode,
  className?: string,
};

const Modal = ({ onClose, children, className }: ModalProps) => {
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
      onClick={() => onClose(CloseReason.BACKGROUND)}
    >
      <div
        className={`bg-white p-6 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.getElementById("portal-root")!
  );
};

export default Modal;