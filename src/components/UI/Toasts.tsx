import { ToastContentProps } from 'react-toastify';

const PolygonDeletionToast = ({ closeToast }: ToastContentProps) => {
  return (
    <div className='flex flex-col gap-2 align-right'>
      <p>Cannot delete a point in a triangle</p>
      <button className='bg-red-500 rounded-md' onClick={() => closeToast("delete")}>Delete Polygon</button>
    </div>
  )
}

export default PolygonDeletionToast;