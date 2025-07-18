import { useNavigate } from 'react-router-dom';
import db from '../data/db';
import byteSize from 'byte-size';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { ProjectModal } from './Modal';
import { toast } from "react-toastify";
import { ProjectDeletionToast } from './UI/Toasts';


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

  const onDelete = async (id?: number) => {
    if (id === undefined) return;
    toast.warn(ProjectDeletionToast, {
      onClose: async (reason) => {
        if (reason === "delete") {
          await db.deleteProject(id);
        };
      },
    });
  };

  return (
    <>
      <div>
        <table className='border-2'>
          <thead>
            <tr>
              <th>Name</th>
              <th>Size</th>
              <th>360° Content</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects && projects.map((project, idx) => (
              <tr key={idx} className='border-2'>
                <td className='border-2'>{project.name}</td>
                <td className='border-2'>{byteSize(sizes![idx], { units: 'iec', precision: 1 }).toString()}</td>
                <td className='border-2'>{getImageInfo(project)}</td>
                <td onClick={() => onView(project.id)} className='border-2 cursor-pointer'>View</td>
                <td onClick={() => onEdit(project.id)} className='border-2 cursor-pointer'>Edit</td>
                <td onClick={() => onDelete(project.id)} className='border-2 cursor-pointer'>Delete</td>
              </tr>
            ))}
          </tbody>
        </table>
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
