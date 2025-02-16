import { ToastContentProps } from 'react-toastify';

export enum ProgressType {
  POSES = "poses",
  SCREENSHOT = "screenshot"
}


export const PolygonDeletionToast = ({ closeToast }: ToastContentProps) => {
  return (
    <div className='flex flex-col gap-2 align-right'>
      <p>Cannot delete a point in a triangle</p>
      <button className='bg-red-500 rounded-md' onClick={() => closeToast("delete")}>Delete Polygon</button>
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
  const msg = type === ProgressType.POSES ? "Generating poses" : "Taking screenshots";
  const progressPercent = Math.round((data as { progress: number }).progress * 100);

  return (
    <div className='flex flex-col gap-2 align-right'>
      <p>{msg}: {progressPercent}%</p>
      <button className='bg-red-500 rounded-md' onClick={() => closeToast("stop")}>Stop</button>
    </div>
  )
}