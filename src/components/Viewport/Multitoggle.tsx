import { IconType } from "react-icons";
import useEditorStore, { EditorState, Perspective, TransformMode } from "../../hooks/useEditorStore";
import { LuExpand, LuMousePointer2, LuMove, LuRotate3D } from "react-icons/lu";
import { TbPerspective, TbPerspectiveOff } from "react-icons/tb";
import { MdOutlineGridOn, MdOutlineGridOff, MdLabel, MdLabelOff } from "react-icons/md";


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
          className={`rounded-full p-1
          text-white outline-none
          border-transparent border-[1px]
          hover:transform hover:scale-105 hover:border-orangeweb-800
          ${item.active ? "bg-orangeweb" : "bg-dim_gray"}
          `}
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
  const { perspectiveMode, setPerspectiveMode, showLabels: showLabel, setShowLabel } = useEditorStore((state) => (state as EditorState));

  // icons
  const PerspectiveOrthographicIcon = perspectiveMode === Perspective.ORTHOGRAPHIC ? TbPerspectiveOff : TbPerspective;
  const LabelIcon = showLabel ? MdLabel : MdLabelOff;

  // onClicks
  const togglePerspectiveMode = () => {
    const newMode = perspectiveMode === Perspective.ORTHOGRAPHIC ? Perspective.PERSPECTIVE : Perspective.ORTHOGRAPHIC;
    setPerspectiveMode(newMode);
  }
  const toggleShowLabel = () => {
    const newLabel = !showLabel;
    setShowLabel(newLabel);
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
      {
      id: 'labels',
      title: 'Toggle Labels',
      icon: () => <LabelIcon />,
      active: showLabel,
      onClick: toggleShowLabel,
    }

  ];

  return (
    <Multitoggle items={items} direction="row" />
  );
}

export default Multitoggle;