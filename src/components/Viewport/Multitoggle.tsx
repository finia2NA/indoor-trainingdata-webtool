import { IconType } from "react-icons";
import { GiMeshBall, GiMeshNetwork } from "react-icons/gi";
import { LuExpand, LuMousePointer2, LuMove, LuRotate3D } from "react-icons/lu";
import { MdLabel, MdLabelOff, MdOutlineAddLocationAlt, MdOutlineGridOff, MdOutlineGridOn, MdOutlinePolyline } from "react-icons/md";
import { PiTargetBold } from "react-icons/pi";
import { TbView360, TbView360Off } from "react-icons/tb";
import { TbPerspective, TbPerspectiveOff } from "react-icons/tb";
import { toast, Zoom } from "react-toastify";
import useEditorStore, { EditorMode, EditorState, Perspective, PolygonToolMode, TransformMode } from "../../hooks/state/useEditorStore";
import { CiGlobe } from "react-icons/ci";
import { BiExpand, BiCollapse } from "react-icons/bi";
import { CgArrowLongUpC } from "react-icons/cg";

const StrikeThrough = ({ children }: { children: React.ReactNode }) => (
  <>
    {children}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-4 h-0.5 bg-white transform rotate-45" />
    </div>
  </>
);

interface Item {
  id: string;
  title?: string;
  icon: IconType;
  active: boolean;
  onClick: () => void;
  endsSection?: boolean;
}

interface Group {
  title: string;
  items: Item[];
}

type ToggleHelperProps = {
  item: Item | Group;
  verbose?: boolean;
  direction?: 'row' | 'column';
};

const ToggleHelper = ({ item, verbose, direction }: ToggleHelperProps) => {
  if ('items' in item) {
    // This is a Group
    return (
      <>
        <div className={`
          flex flex-col gap-2
          ${direction === 'row' ? 'w-full' : ''}
        `}>
          <div className="text-xs text-white font-medium uppercase tracking-wide">
            {item.title}
          </div>
          <div className={`
            flex ${verbose ? 'flex-col' : (direction === 'row' ? 'flex-row flex-wrap' : 'flex-col')} gap-2
          `}>
            {item.items.map((groupItem, index) => (
              <ToggleHelper
                key={'id' in groupItem ? groupItem.id : `nested-group-${index}`}
                item={groupItem}
                verbose={verbose}
                direction={direction}
              />
            ))}
          </div>
        </div>
        <hr className="border-gray-600 w-full" />
      </>
    );
  } else {
    // This is an Item
    if (verbose) {
      return (
        <div className="flex items-center gap-3 w-full">
          <button
            className={`rounded-full p-1 flex-shrink-0 relative
            text-white outline-none
            border-transparent border-[1px]
            hover:transform hover:scale-105 hover:border-primary-800
            ${item.active ? "bg-primary" : "bg-inactive"}
            `}
            onClick={item.onClick}
            title={item.title}
          >
            <item.icon className="text-white" />
          </button>
          <span className="text-[0.7rem] text-secondary font-medium break-all">
            {item.title}
          </span>
        </div>
      );
    } else {
      return (
        <button
          className={`rounded-full p-1 relative
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
      );
    }
  }
}

type MultitoggleProps = {
  items: (Item | Group)[];
  direction?: 'row' | 'column';
  expanded?: boolean;
  verbose?: boolean;
};


const Multitoggle = ({ items, direction, verbose, expanded }: MultitoggleProps) => {


  let myItems = items;
  if (!expanded) {
    // remove the grouping
    myItems = items.flatMap(item => 'items' in item ? item.items : item);
  }

  return (
    <div className={`
    bg-bg bg-opacity-60
    px-2 py-3 gap-2
    flex flex-${direction === 'row' ? 'row' : 'col'}
    pointer-events-auto
    flex-wrap`}>
      {myItems.map((item, index) => (
        <ToggleHelper
          key={'id' in item ? item.id : `group-${index}`}
          item={item}
          verbose={verbose}
          direction={direction}
        />
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
  const { editorMode, perspectiveMode, setPerspectiveMode, wireframeMode, setWireframeMode, showLabels: showLabel, setShowLabel, showGrid, setShowGrid, showTriangulation, setShowTriangulation, showImages, setShowImages, showPoses, setShowPoses, showNormals, setShowNormals, controlsExpanded, setControlsExpanded } = useEditorStore();

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

  const toggleShowNormals = () => {
    setShowNormals(!showNormals);
  }



  // icon
  const GridIcon = showGrid ? MdOutlineGridOn : MdOutlineGridOff;
  // onClick
  const toggleGrid = () => setShowGrid(!showGrid);

  const items: (Item | Group)[] = [
    {
      title: 'Display',
      items: [
        {
          id: 'perspectiveOrthographic',
          title: 'Switch Persp. Mode',
          icon: () => <PerspectiveOrthographicIcon />,
          active: perspectiveMode === Perspective.PERSPECTIVE,
          onClick: togglePerspectiveMode,
        },
        {
          id: 'wireframe',
          title: wireframeMode ? 'Show Shaded Mesh' : "Show Wireframe",
          icon: () => wireframeMode ? <CiGlobe /> : <GiMeshBall />,
          active: false,
          onClick: () => setWireframeMode(!wireframeMode),
        },
      ]
    },
    {
      title: 'Helpers',
      items: [
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
          id: 'normals',
          title: 'Toggle Normals',
          icon: () => showNormals ? <StrikeThrough><CgArrowLongUpC className="transform rotate-45" /></StrikeThrough> : <CgArrowLongUpC className="transform rotate-45" />,
          active: showNormals,
          onClick: toggleShowNormals,
        },
      ]
    },
    {
      title: 'Markers',
      items: [
        {
          id: 'images',
          title: 'Toggle Images',
          icon: () => <ImagesIcon />,
          active: showImages,
          onClick: toggleShowImages,
        },
      ]
    },
    {
      id: 'expand',
      title: controlsExpanded ? 'Collapse Controls' : 'Expand Controls',
      icon: () => controlsExpanded ? <BiCollapse /> : <BiExpand />,
      active: controlsExpanded,
      onClick: () => { setControlsExpanded(!controlsExpanded); }
    }
  ];

  if (editorMode !== EditorMode.LAYOUT) {
    // Find the Helpers group and add triangulation to it
    const helpersGroup = items.find(item => 'items' in item && item.title === 'Helpers') as Group;
    if (helpersGroup) {
      helpersGroup.items.push(
        {
          id: 'triangulation',
          title: 'Toggle Triangulation',
          icon: () => <GiMeshNetwork />,
          active: showTriangulation,
          onClick: toggleShowTriangulation,
        }
      );
    }
  }

  if (editorMode === EditorMode.GENERATE || editorMode === EditorMode.DEBUG) {
    // Find the Markers group and add poses to it
    const markersGroup = items.find(item => 'items' in item && item.title === 'Markers') as Group;
    if (markersGroup) {
      markersGroup.items.push(
        {
          id: 'poses',
          title: 'Toggle Poses',
          icon: () => <PiTargetBold />,
          active: showPoses,
          onClick: toggleShowPoses,
        }
      );
    }
  }

  return (
    <Multitoggle items={items} direction="row" expanded={controlsExpanded} verbose={controlsExpanded} />
  );
}

export default Multitoggle;