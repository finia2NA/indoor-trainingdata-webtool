import { createPortal } from "react-dom";
import React, { useEffect, useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { ProjectDeletionToast } from "./UI/Toasts";
import { useDropzone } from 'react-dropzone';
import db, { Image360, MetadataFile, Model3D } from "../data/db";
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

type UnifiedUploadProps = {
  projectId: number;
};

const UnifiedUpload: React.FC<UnifiedUploadProps> = ({ projectId }) => {
  const onDrop = async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      if (file.type.startsWith('image/')) {
        const image360 = new Image360(file);
        await db.addImageToProject(projectId, image360);
        console.log(`Image ${image360.name} added to the database`);
      } else if (file.name.endsWith('.json')) {
        const metadata = new MetadataFile(file);
        await db.setMetadataFile(projectId, metadata);
        console.log(`Metadata ${metadata.name} added to the database`);
      } else {
        const model3D = new Model3D(file);
        await db.addModelToProject(projectId, model3D);
        console.log(`Model ${model3D.name} added to the database`);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${isDragActive
        ? 'border-primary bg-primary-50 text-primary-700'
        : 'border-gray-300 bg-gray-50 hover:border-primary hover:bg-primary-50 text-gray-600'
        }`}
    >
      <input {...getInputProps()} />
      <div className="space-y-2">
        <p className="text-lg font-medium">
          {isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to select'}
        </p>
        <p className="text-sm text-gray-500">
          Supports 3D models, 360° images, and JSON metadata
        </p>
      </div>
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

  return (
    <Modal
      className="
      w-full sm:min-w-[32rem] sm:w-auto
      "
      onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl font-medium text-bg border-b-2 border-transparent">
                {isNew ? "Creating" : "Editing"}
              </span>
              <input
                type="text"
                className="text-3xl font-semibold text-bg bg-transparent border-0 border-b-2 border-solid border-bg focus:outline-none focus:border-bg-700 min-w-0"
                placeholder="Project Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                size={Math.max(name.length, 12)}
              />
            </div>
            <div className="text-sm text-gray-500">ID: {projectId}</div>
          </div>
          <button
            className="bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 transition-colors duration-200"
            title="Delete project"
            onClick={onDelete}
          >
            <FiTrash2 size={18} />
          </button>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Project Files</h2>
          <UnifiedUpload projectId={projectId} />
        </div>
        <div className="mb-6">
          <div className="mb-4">
            <h3 className="font-medium text-bg mb-2">3D Objects</h3>
            {models.length > 0 ? (
              <div>
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
            ) : (
              <p className="text-inactive text-sm">No 3D models uploaded yet</p>
            )}
          </div>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-bg">360° Images</h3>
              {images360.length > 0 && (
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-600 transition-colors duration-200"
                  onClick={async () => {
                    try {
                      await db.deleteAllImagesFromProject(projectId);
                    } catch (error) {
                      console.error('Failed to delete all images:', error);
                    }
                  }}
                >
                  Delete All
                </button>
              )}
            </div>
            <div className="mb-3">
              <h4 className="text-sm font-medium text-secondary-bg mb-2">Image Files</h4>
              {images360.length > 0 ? (
                <div className="max-h-96 overflow-y-auto border-2 border-dashed border-bg bg-slate-300 rounded-lg p-4">
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
              ) : (
                <p className="text-inactive text-sm">No 360° images uploaded yet</p>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium text-secondary-bg mb-2">Metadata</h4>
              {metadataFile ? (
                <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-200 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-800">{metadataFile.name}</div>
                    <div className="text-sm text-gray-600">{byteSize(metadataFile.size, { units: 'iec', precision: 1 }).toString()}</div>
                  </div>
                  <button
                    onClick={async () => await db.setMetadataFile(projectId, undefined)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ) : (
                <p className="text-inactive text-sm">No metadata uploaded yet</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            className="bg-secondary text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-secondary-bg-600 transition-colors duration-200"
            onClick={() => onClose(CloseReason.CANCEL)}
          >
            Cancel
          </button>
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