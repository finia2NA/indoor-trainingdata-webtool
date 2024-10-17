import { IconType } from "react-icons";
import useEditorStore, { EditorState, TransformMode } from "../../hooks/useEditorState";
import { LuExpand, LuMousePointer2, LuMove, LuRotate3D } from "react-icons/lu";


interface Item {
  id: string;
  icon: IconType;
  active: boolean;
  onClick: () => void;
}

interface MultitoggleProps {
  items: Item[];
  direction?: 'row' | 'column';
}

const Multitoggle = ({ items, direction }: MultitoggleProps) => {

  return (
    <div className={`
    bg-oxford_blue bg-opacity-80
    m-1 px-2 py-3 gap-2
    flex flex-${direction === 'row' ? 'row' : 'col'}
    pointer-events-auto`}>
      {items.map((item) => (
        <button
          className={`rounded-full p-1 focus:outline-none
            ${item.active ? "bg-orangeweb" : "bg-dim_gray"}  text-white outline-none`
          }
          onClick={item.onClick}
          key={item.id}
        >
          <item.icon className="text-white" />
        </button>
      ))
      }
    </div >
  )
}

export const TransformToggles = () => {
  const transformMode = useEditorStore((state) => (state as EditorState).transformMode);
  const setTransformMode = useEditorStore((state) => (state as EditorState).setTransformMode);

  console.log('transformMode', transformMode);


  const items: Item[] = [
    {
      id: 'none',
      icon: () => <LuMousePointer2 />,
      active: transformMode === TransformMode.NONE,
      onClick: () => setTransformMode(TransformMode.NONE),
    },
    {
      id: 'translate',
      icon: () => <LuMove />,
      active: transformMode === TransformMode.TRANSLATE,
      onClick: () => setTransformMode(TransformMode.TRANSLATE),
    },
    {
      id: 'rotate',
      icon: () => <LuRotate3D />,
      active: transformMode === TransformMode.ROTATE,
      onClick: () => setTransformMode(TransformMode.ROTATE),
    },
    {
      id: 'scale',
      icon: () => <LuExpand />,
      active: transformMode === TransformMode.SCALE,
      onClick: () => setTransformMode(TransformMode.SCALE),
    },
  ];

  return (
    <Multitoggle items={items} direction="column" />
  );
}

export default Multitoggle;