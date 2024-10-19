import { IconType } from "react-icons";
import useEditorStore, { EditorState, Perspective, TransformMode } from "../../hooks/useEditorState";
import { LuExpand, LuMousePointer2, LuMove, LuRotate3D } from "react-icons/lu";
import { TbPerspective, TbPerspectiveOff } from "react-icons/tb";
import { MdOutlineGridOn, MdOutlineGridOff } from "react-icons/md";




interface Item {
  id: string;
  title?: string;
  icon: IconType;
  active: boolean;
  onClick: () => void;
  endsSection?: boolean;
}

interface MultitoggleProps {
  items: Item[];
  direction?: 'row' | 'column';
}

const Multitoggle = ({ items, direction }: MultitoggleProps) => {

  return (
    <div className={`
    bg-oxford_blue bg-opacity-60
    px-2 py-3 gap-2
    flex flex-${direction === 'row' ? 'row' : 'col'}
    pointer-events-auto`}>
      {items.map((item) => (
        <button
          className={`rounded-full p-1 focus:outline-none
            ${item.active ? "bg-orangeweb" : "bg-dim_gray"}  text-white outline-none`
          }
          onClick={item.onClick}
          key={item.id}
          title={item.title}
        >
          <item.icon className="text-white" />
        </button>
      ))
      }
    </div >
  )
}

export const TransformToggles = () => {
  const { transformMode, setTransformMode } = useEditorStore((state) => state as EditorState);

  const items: Item[] = [
    {
      id: 'none',
      title: 'Select',
      icon: () => <LuMousePointer2 />,
      active: transformMode === TransformMode.NONE,
      onClick: () => setTransformMode(TransformMode.NONE),
    },
    {
      id: 'translate',
      title: 'Move',
      icon: () => <LuMove />,
      active: transformMode === TransformMode.TRANSLATE,
      onClick: () => setTransformMode(TransformMode.TRANSLATE),
    },
    {
      id: 'rotate',
      title: 'Rotate',
      icon: () => <LuRotate3D />,
      active: transformMode === TransformMode.ROTATE,
      onClick: () => setTransformMode(TransformMode.ROTATE),
    },
    {
      id: 'scale',
      title: 'Scale',
      icon: () => <LuExpand />,
      active: transformMode === TransformMode.SCALE,
      onClick: () => setTransformMode(TransformMode.SCALE),
    },
  ];

  return (
    <Multitoggle items={items} direction="column" />
  );
}

export const ViewmodeToggles = () => {
  // Perspective stuff
  // state
  const { perspectiveMode, setPerspectiveMode } = useEditorStore((state) => (state as EditorState));
  // icon
  const PerspectiveOrthographicIcon = perspectiveMode === Perspective.ORTHOGRAPHIC ? TbPerspectiveOff : TbPerspective;
  // onClick
  const togglePerspectiveMode = () => {
    const newMode = perspectiveMode === Perspective.ORTHOGRAPHIC ? Perspective.PERSPECTIVE : Perspective.ORTHOGRAPHIC;
    setPerspectiveMode(newMode);
  }

  // Grid stuff
  // state
  const { showGrid, setShowGrid } = useEditorStore((state) => (state as EditorState));
  // icon
  const GridIcon = showGrid ? MdOutlineGridOn : MdOutlineGridOff;
  // onClick
  const toggleGrid = () => setShowGrid(!showGrid);

  const items: Item[] = [
    {
      id: 'perspectiveOrthographic',
      title: 'Switch Perspective/Orthographic Camera',
      icon: () => <PerspectiveOrthographicIcon />,
      active: perspectiveMode === Perspective.PERSPECTIVE,
      onClick: togglePerspectiveMode,
      endsSection: true,
    },
    {
      id: 'grid',
      title: 'Toggle Grid',
      icon: () => <GridIcon />,
      active: showGrid,
      onClick: toggleGrid,
    },

  ];

  return (
    <Multitoggle items={items} direction="row" />
  );
}

export default Multitoggle;