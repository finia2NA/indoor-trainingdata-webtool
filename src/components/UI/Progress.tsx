import useEditorStore, { EditorMode, EditorState } from '../../hooks/useEditorStore';

interface ProgressArrowProps {
  text: string;
}

const ProgressArrow: React.FC<ProgressArrowProps> = ({ text }) => {

  const { editorMode, setEditorMode } = useEditorStore((state) => state as EditorState);

  const active = editorMode === text.toLowerCase();

  return (
    <button
      className={
        `basis-1/3
        ${active ? 'bg-orangeweb' : 'bg-dim_gray'}
        text-white
        py-2
        font-medium
    `}
    onClick={() => setEditorMode(text.toLowerCase() as EditorMode)}
    >
      {text}
    </button>
  )
}

const Progress = () => {

  return (
    <div className='w-full'>
      <div className='flex flex-row'>
        <ProgressArrow text='Layout' />
        <ProgressArrow text='Map' />
        <ProgressArrow text='Generate' />
      </div>
    </div>
  )
}

export default Progress;