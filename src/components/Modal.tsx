import { createPortal } from "react-dom";
import React, { useEffect, useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { ProjectDeletionToast } from "./UI/Toasts";
import UploadComponent from "./UploadComponent";
import db from "../data/db";
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

const placeholder = {
  name: "P1",
  files: [
    { name: "F1", size: 100 },
    { name: "Verylongprojectnamelikeyouwouldn'tbelieve", size: 200 },
  ]
}


export const ProjectModal = ({ onClose, projectId, isNew }: ProjectModalProps) => {
  const project = useLiveQuery(() => db.projects.get(projectId), []);
  const [name, setName] = useState(project?.name || "");
  const models = project?.models || [];

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
        className={`bg-white p-6 rounded-lg shadow-lg ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.getElementById("portal-root")!
  );
};

export default Modal;