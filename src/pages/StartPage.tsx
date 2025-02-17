import ModelOverview from "../components/ModelOverview";
import { ProjectModal } from "../components/Modal";
import { useState } from "react";
import db, { Project } from "../data/db";

const StartPage = () => {
  const [newProjectId, setNewProjectId] = useState<number | null>(null);

  const onNewProject = async () => {
    const newProject = new Project("New Project");
    await db.addProject(newProject);
    setNewProjectId(newProject.id!);
  }

  return (
    <>
      <div className="m-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl">Your projects</h1>
          <ModelOverview />
        </div>
        <div>
          <button
            className="bg-confirm p-2 rounded-md text-white"
            onClick={onNewProject}
          >Add new Project</button>
        </div>
      </div>

      {newProjectId && (
        <ProjectModal
          isNew={true}
          onClose={() => {
            setNewProjectId(null);
          }}
          projectId={newProjectId}
        />
      )}
    </>
  );
}

export default StartPage;