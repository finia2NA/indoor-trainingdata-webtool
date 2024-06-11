import ModelOverview from "../components/ModelOverview";
import UploadComponent from "../components/UploadComponent";


const StartPage = () => {
  return (
    <>
      <span className='font-bold text-2xl'>Hello World</span>
      <UploadComponent />
      <ModelOverview />
    </>
  );
}

export default StartPage;