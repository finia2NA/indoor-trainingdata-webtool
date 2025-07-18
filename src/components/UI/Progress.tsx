import { useNavigate, useParams } from 'react-router-dom';
import useEditorStore, { EditorState } from '../../hooks/state/useEditorStore';

type ProgressArrowProps = {
  text: string;
};

const ProgressArrow: React.FC<ProgressArrowProps> = ({ text }) => {
  const navigate = useNavigate();
  const id = Number(useParams<{ id: string }>().id);


  const { editorMode } = useEditorStore((state) => state as EditorState);
  const active = editorMode === text.toLowerCase();

  const handleClick = () => {
    if (id) {
      navigate(`/view/${id}/${text.toLowerCase()}`);
    }
  };

  return (
    <button
      className={
        `basis-1/3
        ${active ? 'bg-primary' : 'bg-inactive'}
        text-white
        py-2
        font-medium
    `}
      onClick={handleClick}
    >
      {text}
    </button>
  );
};

const Progress = () => {
  return (
    <div className='w-full'>
      <div className='flex flex-row'>
        <ProgressArrow text='Layout' />
        <ProgressArrow text='Map' />
        <ProgressArrow text='Generate' />
      </div>
    </div>
  );
};

export default Progress;