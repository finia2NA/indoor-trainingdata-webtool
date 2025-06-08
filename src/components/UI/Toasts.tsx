import { ToastContentProps } from 'react-toastify';

export enum ProgressType {
  POSES = "poses",
  POSTTRAINING = "posttraining",
  SCREENSHOT = "screenshot",
  POSTTRAININGSCREENSHOT = "posttrainingscreenshot",
}

export const ProjectDeletionToast = ({ closeToast }: ToastContentProps) => {
  return (
    <div className='flex flex-col gap-2 align-right'>
      <p>Are you sure you want to delete this project?</p>
      <button className='bg-red-500 rounded-md' onClick={() => closeToast("delete")}>Delete Project</button>
      <button className='bg-confirm rounded-md' onClick={() => closeToast("cancel")}>Cancel</button>
    </div>
  )
}


export const PolygonDeletionToast = ({ closeToast }: ToastContentProps) => {
  return (
    <div className='flex flex-col gap-2 align-right'>
      <p>Cannot delete a point in a triangle</p>
      <button className='bg-danger rounded-md' onClick={() => closeToast("delete")}>Delete Polygon</button>
    </div>
  )
}

export const ResetConfirmationToast = ({ closeToast }: ToastContentProps) => {
  return (
    <div className='flex flex-col gap-2 align-right'>
      <p>Are you sure you want to reset the generation settings?</p>
      <button className='bg-red-500 rounded-md' onClick={() => closeToast("reset")}>Reset</button>
    </div>
  )
}

export const ProgressToast = ({ closeToast, data }: ToastContentProps) => {
  const type = (data as { type: ProgressType }).type;

  let msg = "Processing";
  switch (type) {
    case ProgressType.POSES:
      msg = "Generating mesh poses";
      break;
    case ProgressType.POSTTRAINING:
      msg = "Generating posttraining poses";
      break;
    case ProgressType.SCREENSHOT:
      msg = "Taking screenshots";
      break;
    case ProgressType.POSTTRAININGSCREENSHOT:
      msg = "Taking posttraining screenshots";
      break;
    default:
      throw new Error(`Unknown progress type: ${type}`);
  }

  const progressPercent = Math.round((data as { progress: number }).progress * 100);

  return (
    <div className='flex flex-col gap-2 align-right'>
      <p>{msg}: {progressPercent}%</p>
      <button className='bg-red-500 rounded-md' onClick={() => closeToast("stop")}>Stop</button>
    </div>
  )
}