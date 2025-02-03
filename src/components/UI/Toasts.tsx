import { ToastContentProps } from 'react-toastify';

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