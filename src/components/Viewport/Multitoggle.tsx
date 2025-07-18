import { IconType } from "react-icons";
import { GiMeshNetwork } from "react-icons/gi";
import { LuExpand, LuMousePointer2, LuMove, LuRotate3D } from "react-icons/lu";
import { MdLabel, MdLabelOff, MdOutlineAddLocationAlt, MdOutlineGridOff, MdOutlineGridOn, MdOutlinePolyline } from "react-icons/md";
import { PiTargetBold } from "react-icons/pi";
import { TbView360, TbView360Off } from "react-icons/tb";
import { TbPerspective, TbPerspectiveOff } from "react-icons/tb";
import { toast, Zoom } from "react-toastify";
import useEditorStore, { EditorMode, EditorState, Perspective, PolygonToolMode, TransformMode } from "../../hooks/useEditorStore";






type Item = {
  id: string;
  title?: string;
  icon: IconType;
  active: boolean;
  onClick: () => void;
  endsSection?: boolean;
};

type MultitoggleProps = {
  items: Item[];
  direction?: 'row' | 'column';
};

const Multitoggle = ({ items, direction }: MultitoggleProps) => {
  return (
    <div className={`
    bg-bg bg-opacity-60
    px-2 py-3 gap-2
    flex flex-${direction === 'row' ? 'row' : 'col'}
    pointer-events-auto
    ${direction === 'row' ? "w-28" : ""}
    flex-wrap`}>
      {items.map((item) => (
        <button
          className={`rounded-full p-1
          text-white outline-none
          border-transparent border-[1px]
          hover:transform hover:scale-105 hover:border-primary-800
          ${item.active ? "bg-primary" : "bg-inactive"}
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

export const PolygonCreatorToggles = () => {
  const { polygonToolMode, setPolygonToolMode } = useEditorStore((state) => state as EditorState);

  const items: Item[] = [
    {
      id: 'none',
      title: 'None',
      icon: () => <LuMousePointer2 />,
      active: polygonToolMode === PolygonToolMode.NONE,
      onClick: () => setPolygonToolMode(PolygonToolMode.NONE),
    },
    {
      id: 'create',
      title: 'Create',
      icon: () => <MdOutlineAddLocationAlt />,
      active: polygonToolMode === PolygonToolMode.CREATE,
      onClick: () => setPolygonToolMode(PolygonToolMode.CREATE),
    },
    {
      id: 'edit',
      title: 'Edit',
      icon: () => <LuMove />,
      active: polygonToolMode === PolygonToolMode.EDIT,
      onClick: () => setPolygonToolMode(PolygonToolMode.EDIT),
    },
    {
      id: 'splice',
      title: 'Splice',
      icon: () => <MdOutlinePolyline />,
      active: polygonToolMode === PolygonToolMode.SPLICE,
      onClick: () => setPolygonToolMode(PolygonToolMode.SPLICE),
    },
  ];

  return (
    <Multitoggle items={items} direction="column" />
  );
}

export const ViewmodeToggles = () => {
  // Perspective stuff
  // state
  const { editorMode, perspectiveMode, setPerspectiveMode, showLabels: showLabel, setShowLabel, showGrid, setShowGrid, showTriangulation, setShowTriangulation, showImages, setShowImages, showPoses, setShowPoses } = useEditorStore();

  // icons
  const PerspectiveOrthographicIcon = perspectiveMode === Perspective.ORTHOGRAPHIC ? TbPerspectiveOff : TbPerspective;
  const LabelIcon = showLabel ? MdLabel : MdLabelOff
  const ImagesIcon = showImages ? TbView360 : TbView360Off;

  // onClicks
  const togglePerspectiveMode = () => {
    const newMode = perspectiveMode === Perspective.ORTHOGRAPHIC ? Perspective.PERSPECTIVE : Perspective.ORTHOGRAPHIC;
    setPerspectiveMode(newMode);
  }
  const toggleShowLabel = () => {
    const newLabel = !showLabel;
    setShowLabel(newLabel);
  }

  const toggleShowTriangulation = () => {
    const newTriangulation = !showTriangulation;
    setShowTriangulation(newTriangulation);
  }

  const toggleShowImages = () => {
    const newShowImages = !showImages;
    setShowImages(newShowImages);
  }

  const toggleShowPoses = () => {
    const newShowPoses = !showPoses;
    if (newShowPoses) {
      toast("Showing poses. If there are many of them, this may impact performance.",
        {
          type: 'info',
          transition: Zoom,
          autoClose: 2000,
          hideProgressBar: false
        });
    }
    setShowPoses(newShowPoses);
  }



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
    },
    {
      id: 'images',
      title: 'Toggle Images',
      icon: () => <ImagesIcon />,
      active: showImages,
      onClick: toggleShowImages,
    }
  ];

  if (editorMode !== EditorMode.LAYOUT) {
    items.push(
      {
        id: 'triangulation',
        title: 'Toggle Triangulation',
        icon: () => <GiMeshNetwork />,
        active: showTriangulation,
        onClick: toggleShowTriangulation,
      }
    )
  }

  if (editorMode === EditorMode.GENERATE) {
    items.push(
      {
        id: 'poses',
        title: 'Toggle Poses',
        icon: () => <PiTargetBold />,
        active: showPoses,
        onClick: toggleShowPoses,
      }
    )
  }

  return (
    <Multitoggle items={items} direction="row" />
  );
}

export default Multitoggle;