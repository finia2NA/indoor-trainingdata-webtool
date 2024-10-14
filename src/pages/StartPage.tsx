import ModelOverview from "../components/ModelOverview";
import UploadComponent from "../components/UploadComponent";


const StartPage = () => {
  return (
    <div className="m-4 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl">Your projects</h1>
        <ModelOverview />
      </div>
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-4xl">Upload</h1>
          <span className="">Upload a .gltf file to create a new Project</span>
        </div>
        <UploadComponent />
      </div>
    </div>
  );
}

export default StartPage;