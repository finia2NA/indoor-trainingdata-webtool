import { useCallback, useRef } from 'react';
import { Pose, PostTrainingPose, PoseType } from './useDataGeneratorUtils';
import { Vector3, Quaternion } from 'three';

type PosttrainingPosition = {
  x: number;
  y: number;
  z: number;
  name: string;
};

type WorkerPool = {
  workers: Worker[];
  activeJobs: Map<number, WorkerJob>;
  completedJobs: Map<number, any[]>;
  progressCallbacks: Map<number, (progress: number) => void>;
  errorCallbacks: Map<number, (error: string) => void>;
  jobQueue: QueuedJob[];
  totalJobs: number;
  completedJobCount: number;
  onJobComplete?: (poses: any[]) => void;
  onProgress?: (progress: number) => void;
};

type QueuedJob = {
  id: number;
  startIndex: number;
  endIndex: number;
  request: any;
  type: 'GENERATE_POSES' | 'GENERATE_POSTTRAINING_POSES';
};

type WorkerJob = {
  id: number;
  workerId: number;
  startIndex: number;
  endIndex: number;
  resolve: (poses: any[]) => void;
  reject: (error: Error) => void;
};

type GeneratePosesRequest = {
  startIndex: number;
  endIndex: number;
  polygonsEX: any[];
  totalArea: number;
  heightOffset: number;
  anglesRange: [number, number];
  anglesConcentration: number;
  fovRange: [number, number];
  fovConcentration: number;
  avoidWalls: boolean;
  pair: boolean;
  pairDistanceRange: [number, number];
  pairDistanceConcentration: number;
  pairAngleOffset: number;
  pairAngleConcentration: number;
};

type GeneratePosttrainingPosesRequest = {
  startIndex: number;
  endIndex: number;
  positions: PosttrainingPosition[];
  numPosttrainingImages: number;
  anglesRange: [number, number];
  anglesConcentration: number;
  fovRange: [number, number];
  fovConcentration: number;
  avoidWalls: boolean;
  pair: boolean;
  pairDistanceRange: [number, number];
  pairDistanceConcentration: number;
  pairAngleOffset: number;
  pairAngleConcentration: number;
};

const WORKER_COUNT = 6;

// Helper function to reconstruct Three.js objects from serialized data
function reconstructPose(serializedPose: any): Pose {
  return {
    position: new Vector3(serializedPose.position.x, serializedPose.position.y, serializedPose.position.z),
    target: new Vector3(serializedPose.target.x, serializedPose.target.y, serializedPose.target.z),
    quaternion: new Quaternion(serializedPose.quaternion._x, serializedPose.quaternion._y, serializedPose.quaternion._z, serializedPose.quaternion._w),
    fov: serializedPose.fov,
    series: serializedPose.series,
    type: serializedPose.type,
  };
}

function reconstructPostTrainingPose(serializedPose: any): PostTrainingPose {
  return {
    ...reconstructPose(serializedPose),
    imageName: serializedPose.imageName,
  };
}

const useWorkerManager = () => {
  const workerPoolRef = useRef<WorkerPool | null>(null);
  const jobIdCounter = useRef(0);

  // Function to assign next job to a worker
  const assignNextJobToWorker = useCallback((workerId: number) => {
    const pool = workerPoolRef.current;
    if (!pool || pool.jobQueue.length === 0) return;
    
    const nextJob = pool.jobQueue.shift()!;
    const job: WorkerJob = {
      id: nextJob.id,
      workerId,
      startIndex: nextJob.startIndex,
      endIndex: nextJob.endIndex,
      resolve: () => {}, // Not used in queue system
      reject: () => {},  // Not used in queue system
    };
    
    pool.activeJobs.set(nextJob.id, job);
    
    // Send job to worker
    const workerRequest = {
      ...nextJob.request,
      startIndex: nextJob.startIndex,
      endIndex: nextJob.endIndex,
    };
    
    pool.workers[workerId].postMessage({
      type: nextJob.type,
      data: workerRequest,
    });
  }, []);

  const initializeWorkerPool = useCallback(() => {
    if (workerPoolRef.current) {
      // Clean up existing workers
      workerPoolRef.current.workers.forEach(worker => worker.terminate());
    }

    const workers: Worker[] = [];
    const activeJobs = new Map<number, WorkerJob>();
    const completedJobs = new Map<number, any[]>();
    const progressCallbacks = new Map<number, (progress: number) => void>();
    const errorCallbacks = new Map<number, (error: string) => void>();
    const jobQueue: QueuedJob[] = [];
    let totalJobs = 0;
    let completedJobCount = 0;

    // Create workers
    for (let i = 0; i < WORKER_COUNT; i++) {
      const worker = new Worker(
        new URL('../../workers/poseGeneratorWorker.ts', import.meta.url),
        { type: 'module', name: `worker-${i}` } /* @vite-ignore */
      );

      worker.onmessage = (event) => {
        const { type, data } = event.data;
        const pool = workerPoolRef.current!;
        
        switch (type) {
          case 'POSES_COMPLETE': {
            const { poses } = data;
            const jobId = [...activeJobs.values()].find(job => job.workerId === i)?.id;
            
            if (jobId !== undefined) {
              const job = activeJobs.get(jobId);
              if (job) {
                // Reconstruct Three.js objects from serialized data
                const reconstructedPoses = poses.map((pose: any) => 
                  pose.imageName ? reconstructPostTrainingPose(pose) : reconstructPose(pose)
                );
                
                // Update completed job count and call callbacks
                pool.completedJobCount++;
                pool.onJobComplete?.(reconstructedPoses);
                
                const progress = pool.completedJobCount / pool.totalJobs;
                pool.onProgress?.(progress);
                
                activeJobs.delete(jobId);
                
                // Assign next job to this worker if available
                assignNextJobToWorker(i);
              }
            }
            break;
          }
          
          case 'PROGRESS_UPDATE': {
            const { progress, workerId } = data;
            const jobId = [...activeJobs.values()].find(job => job.workerId === i)?.id;
            
            if (jobId !== undefined) {
              const callback = progressCallbacks.get(jobId);
              callback?.(progress);
            }
            break;
          }
          
          case 'ERROR': {
            const { error, workerId } = data;
            const jobId = [...activeJobs.values()].find(job => job.workerId === i)?.id;
            
            if (jobId !== undefined) {
              const job = activeJobs.get(jobId);
              const errorCallback = errorCallbacks.get(jobId);
              
              if (job) {
                job.reject(new Error(error));
                activeJobs.delete(jobId);
                progressCallbacks.delete(jobId);
                errorCallbacks.delete(jobId);
              }
              
              errorCallback?.(error);
            }
            break;
          }
        }
      };

      worker.onerror = (error) => {
        console.error(`Worker ${i} error:`, error);
        // Find and reject any active jobs for this worker
        const jobId = [...activeJobs.values()].find(job => job.workerId === i)?.id;
        if (jobId !== undefined) {
          const job = activeJobs.get(jobId);
          if (job) {
            job.reject(new Error(`Worker ${i} error: ${error.message}`));
            activeJobs.delete(jobId);
            progressCallbacks.delete(jobId);
            errorCallbacks.delete(jobId);
          }
        }
      };

      workers.push(worker);
    }


    workerPoolRef.current = {
      workers,
      activeJobs,
      completedJobs,
      progressCallbacks,
      errorCallbacks,
      jobQueue,
      totalJobs,
      completedJobCount,
    };
  }, [assignNextJobToWorker]);

  const generatePosesParallel = useCallback(async (
    totalPoses: number,
    request: Omit<GeneratePosesRequest, 'startIndex' | 'endIndex'>,
    onProgress?: (progress: number) => void,
    onJobComplete?: (poses: Pose[]) => void,
    onError?: (error: string) => void
  ): Promise<Pose[]> => {
    if (!workerPoolRef.current) {
      initializeWorkerPool();
    }

    const pool = workerPoolRef.current!;
    
    // Constants for job chunking
    const POSES_PER_JOB = 100;
    const numJobs = Math.ceil(totalPoses / POSES_PER_JOB);
    
    // Reset pool state
    pool.jobQueue = [];
    pool.totalJobs = numJobs;
    pool.completedJobCount = 0;
    pool.onJobComplete = onJobComplete;
    pool.onProgress = onProgress;
    
    // Create small jobs and add to queue
    for (let i = 0; i < numJobs; i++) {
      const startIndex = i * POSES_PER_JOB;
      const endIndex = Math.min(startIndex + POSES_PER_JOB, totalPoses);
      
      const job: QueuedJob = {
        id: jobIdCounter.current++,
        startIndex,
        endIndex,
        request,
        type: 'GENERATE_POSES',
      };
      
      pool.jobQueue.push(job);
    }

    // Start initial jobs (one per worker)
    for (let i = 0; i < Math.min(WORKER_COUNT, pool.jobQueue.length); i++) {
      assignNextJobToWorker(i);
    }

    // Return a promise that resolves when all jobs are complete
    return new Promise<Pose[]>((resolve, reject) => {
      const allPoses: Pose[] = [];
      
      const originalOnJobComplete = pool.onJobComplete;
      pool.onJobComplete = (poses: Pose[]) => {
        allPoses.push(...poses);
        originalOnJobComplete?.(poses);
        
        // Check if all jobs are complete
        if (pool.completedJobCount >= pool.totalJobs) {
          // Sort poses by series number and type
          allPoses.sort((a, b) => {
            if (a.series !== b.series) {
              return a.series - b.series;
            }
            return a.type === PoseType.SINGLE ? -1 : 1;
          });
          resolve(allPoses);
        }
      };
      
      // Set up error handling
      pool.errorCallbacks.clear();
      pool.errorCallbacks.set(0, (error: string) => {
        onError?.(error);
        reject(new Error(error));
      });
    });
  }, [initializeWorkerPool, assignNextJobToWorker]);

  const generatePosttrainingPosesParallel = useCallback(async (
    positions: PosttrainingPosition[],
    request: Omit<GeneratePosttrainingPosesRequest, 'startIndex' | 'endIndex' | 'positions'>,
    onProgress?: (progress: number) => void,
    onJobComplete?: (poses: PostTrainingPose[]) => void,
    onError?: (error: string) => void
  ): Promise<PostTrainingPose[]> => {
    if (!workerPoolRef.current) {
      initializeWorkerPool();
    }

    const pool = workerPoolRef.current!;
    const chunkSize = Math.ceil(positions.length / WORKER_COUNT);
    const jobPromises: Promise<PostTrainingPose[]>[] = [];

    // Track overall progress
    const progressTracker = new Map<number, number>();
    const updateOverallProgress = () => {
      const totalProgress = Array.from(progressTracker.values()).reduce((sum, p) => sum + p, 0);
      const overallProgress = totalProgress / WORKER_COUNT;
      onProgress?.(overallProgress);
    };

    // Create jobs for each worker
    for (let i = 0; i < WORKER_COUNT; i++) {
      const startIndex = i * chunkSize;
      const endIndex = Math.min(startIndex + chunkSize, positions.length);
      
      if (startIndex >= positions.length) break;

      const jobId = jobIdCounter.current++;
      
      const jobPromise = new Promise<PostTrainingPose[]>((resolve, reject) => {
        const job: WorkerJob = {
          id: jobId,
          workerId: i,
          startIndex,
          endIndex,
          resolve,
          reject,
        };

        pool.activeJobs.set(jobId, job);
        
        // Set up progress tracking for this job
        progressTracker.set(jobId, 0);
        pool.progressCallbacks.set(jobId, (progress: number) => {
          progressTracker.set(jobId, progress);
          updateOverallProgress();
        });

        pool.errorCallbacks.set(jobId, onError || (() => {}));

        // Send the job to the worker
        const workerRequest: GeneratePosttrainingPosesRequest = {
          ...request,
          startIndex,
          endIndex,
          positions,
        };

        pool.workers[i].postMessage({
          type: 'GENERATE_POSTTRAINING_POSES',
          data: workerRequest,
        });
      });

      jobPromises.push(jobPromise);
    }

    // Wait for all jobs to complete
    const results = await Promise.all(jobPromises);
    
    // Combine results and sort by series number
    const allPoses: PostTrainingPose[] = [];
    results.forEach(poses => allPoses.push(...poses));
    allPoses.sort((a, b) => {
      if (a.series !== b.series) {
        return a.series - b.series;
      }
      // If same series, single poses come before pair poses
      return a.type === PoseType.SINGLE ? -1 : 1;
    });

    return allPoses;
  }, [initializeWorkerPool]);

  const terminateWorkers = useCallback(() => {
    if (workerPoolRef.current) {
      workerPoolRef.current.workers.forEach(worker => worker.terminate());
      workerPoolRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    terminateWorkers();
  }, [terminateWorkers]);

  return {
    generatePosesParallel,
    generatePosttrainingPosesParallel,
    terminateWorkers,
    cleanup,
    initializeWorkerPool,
  };
};

export default useWorkerManager;