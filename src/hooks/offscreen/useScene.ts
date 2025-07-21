import { useCallback, useEffect } from 'react';
import { Project } from "../../data/db";
import { sceneCache, SceneData } from './sceneCache';
import useMultiTransformationStore from '../state/useMultiTransformationStore';
import useMultiGenerationStore from '../state/useMultiGenerationStore';

type GetOrCreateSceneProps = {
  width: number;
  height: number;
  doubleSided?: boolean;
  use360Shading?: boolean;
}

const useScene = (project?: Project) => {
  // Get the data we need
  const projectId = project?.id ?? null;

  // Functions from other hooks
  const { getTransformation, getVisibility } = useMultiTransformationStore();
  const { getUse360Shading } = useMultiGenerationStore();

  const use360Shading = projectId ? getUse360Shading(projectId) : false;

  console.log('useScene hook initialized with projectId:', projectId, 'and use360Shading:', use360Shading);

  // Clear cache when project changes or when transformation/visibility functions change
  useEffect(() => {
    if (projectId) {
      sceneCache.invalidateProject(projectId);
    }
    console.log('Scene Cache invalidated for project:', projectId);
  }, [projectId, use360Shading, getTransformation, getVisibility]);

  // Get or create scene - now just forwards everything to the cache
  const getOrCreateScene = useCallback(async (props: GetOrCreateSceneProps): Promise<SceneData> => {
    if (!project) {
      throw new Error('Project is required');
    }

    // Forward all hook data and props to the cache
    return sceneCache.getOrCreateScene(
      project,
      getVisibility,
      getTransformation,
      props.width,
      props.height,
      props.doubleSided ?? false,
      props.use360Shading ?? use360Shading,
    );
  }, [project, getVisibility, getTransformation, use360Shading]);

  return { getOrCreateScene }
}

export default useScene;