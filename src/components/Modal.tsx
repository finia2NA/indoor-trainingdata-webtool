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
  const sizeInMb = byteSize(size, { units: 'iec', precision: 1 }).toString()
  return (
    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-center mb-2">
      <div className="flex-1 mr-4">
        <div className="font-medium text-gray-800 truncate">{name}</div>
        <div className="text-sm text-gray-600">{sizeInMb}</div>
      </div>
      <button 
        onClick={onDelete}
        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200"
      >
        <FiTrash2 size={16} />
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
      <label className="cursor-pointer bg-bg text-white p-3 rounded-lg text-center hover:bg-bg-700 transition-colors duration-200 font-medium">
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
        <div className="bg-green-50 p-3 rounded-lg border border-green-200 flex justify-between items-center">
          <div>
            <div className="font-medium text-gray-800">{metadataFile.name}</div>
            <div className="text-sm text-gray-600">{byteSize(metadataFile.size, { units: 'iec', precision: 1 }).toString()}</div>
          </div>
          <button 
            onClick={handleMetadataDelete}
            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      ) : (
        <label className="cursor-pointer bg-secondary text-white p-3 rounded-lg text-center hover:bg-secondary-600 transition-colors duration-200 font-medium">
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold text-bg">{h1}</h1>
          <button
            className="bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 transition-colors duration-200"
            title="Delete project"
            onClick={onDelete}
          >
            <FiTrash2 size={18} />
          </button>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Project Details</h2>
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">Project Name</label>
            <input
              id="name"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bg focus:border-transparent"
              placeholder="Enter project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Project Files</h2>
          {models.length > 0 && (
            <div className="mb-4">
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
          )}
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Upload a new model</h3>
            <UploadComponent projectId={projectId} />
          </div>
        </div>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">360° Images</h2>
            {images360.length > 0 && (
              <button
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors duration-200"
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
          {images360.length > 0 && (
            <div className="mb-4">
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
          )}
          <div className="mb-4">
            <h3 className="font-medium text-gray-700 mb-2">Upload 360° images</h3>
            <ImageUpload projectId={projectId} />
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Upload JSON metadata</h3>
            <MetadataUpload projectId={projectId} metadataFile={metadataFile} />
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            className="bg-confirm text-white px-6 py-3 rounded-lg font-medium hover:bg-confirm-600 transition-colors duration-200"
            onClick={onConfirm}
          >
            Save Changes
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
        className={`bg-white p-8 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.getElementById("portal-root")!
  );
};

export default Modal;