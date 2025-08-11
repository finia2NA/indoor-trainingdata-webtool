import { useNavigate } from 'react-router-dom';
import db from '../data/db';
import byteSize from 'byte-size';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { ProjectModal } from './Modal';
import { toast } from "react-toastify";
import { ProjectDeletionToast } from './UI/Toasts';
import { FiEdit3 } from 'react-icons/fi';


const ProjectOverview = () => {
  const projects = useLiveQuery(() => db.projects.toArray(), []);
  const navigate = useNavigate();
  const [editingProject, setEditingProject] = useState<number | null>(null);

  const sizes = projects?.map(project => {
    const modelSize = project.models.reduce((acc, model) => acc + model.size, 0);
    const imageSize = project.images360?.reduce((acc, image) => acc + image.size, 0) || 0;
    const metadataSize = project.metadataFile?.size || 0;
    return modelSize + imageSize + metadataSize;
  });

  const getImageInfo = (project: any) => {
    const imageCount = project.images360?.length || 0;
    const hasMetadata = !!project.metadataFile;
    if (imageCount === 0 && !hasMetadata) return "No 360° content";
    if (imageCount > 0 && hasMetadata) return `${imageCount} images + metadata`;
    if (imageCount > 0) return `${imageCount} images (no metadata)`;
    return "Metadata only";
  };

  const onView = (id?: number) => {
    if (id === undefined) return;
    navigate(`/view/${id}`);
  };

  const onEdit = (id?: number) => {
    if (id === undefined) return;
    setEditingProject(id);
  };

  return (
    <>
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {projects && projects.map((project, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 relative max-w-sm">
              <button
                onClick={() => onEdit(project.id)}
                className="absolute top-4 right-4 p-2 text-white bg-bg hover:bg-bg-700 rounded transition-colors duration-200"
              >
                <FiEdit3 size={16} />
              </button>
              <div className="p-6">
                <div className="mb-4">
                  <h3
                    onClick={() => onView(project.id)}
                    className="text-xl font-semibold text-bg mb-2 cursor-pointer hover:text-bg-700 transition-colors duration-200 pr-12"
                  >
                    {project.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <span className="font-medium mr-2">Size:</span>
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {byteSize(sizes![idx], { units: 'iec', precision: 1 }).toString()}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">Content:</span>
                    <span className="text-xs">{getImageInfo(project)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {(!projects || projects.length === 0) && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">No projects found</div>
            <div className="text-gray-400 text-sm">Create your first project to get started</div>
          </div>
        )}
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

export default ProjectOverview;
