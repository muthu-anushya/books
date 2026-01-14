import { useNavigate } from "react-router-dom";

function MainPage() {
  const navigate = useNavigate();

  const showSeniorSide = () => {
    navigate("/senior_registration");
  };

  const showJuniorSide = () => {
    navigate("/junior_registration");
  };
  return (
    <>
      <div style={{ background: '#f0d4ce', minHeight: '100vh' }}>
        <div className="flex items-center justify-center p-4 bg-gradient-to-r bg-[#25154d]">
          <img
            src="/logo.jpeg" // Assuming the logo is placed in the public/images directory
            alt="BookBuddy Logo"
            className="h-16 w-16 mr-4 md:h-20 md:w-20 rounded-full"
          />
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-4xl text-white p-6 text-center">
            JACSICE BookNest
          </h1>
        </div>

        <h3 className=" text-center text-2xl md:text-3xl lg:text-4xl xl:text-3xl text-sky-950 p-6 font-bold ">
          Easily find and share books between seniors and juniors.
        </h3>
        <h1 className=" p-10 sm:p-28 lg:p-28 font-serif leading-loose md:p-20 text-center bg-pink-950 text-white text-3xl">
          Welcome to the platform where seniors can list their used books and
          juniors can find them easily. Let’s make book sharing simpler and
          reduce waste!
        </h1>
      </div>
      <div className="flex space-x-4 sm:space-x-10 md:space-x-14 lg:space-x-20 p-4 sm:p-6 md:p-8 lg:p-10 items-center justify-center">
        {/* Senior Button */}
        <button
          className="bg-blue-500 text-white py-3 px-6 sm:py-4 sm:px-8 lg:py-5 lg:px-10 font-bold text-lg sm:text-xl rounded-lg hover:bg-blue-600 focus:outline-none"
          onClick={showSeniorSide}
        >
          Senior
        </button>

        {/* Junior Button */}
        <button
          className="bg-green-500 text-white font-bold text-lg sm:text-xl py-3 px-6 sm:py-4 sm:px-8 lg:py-5 lg:px-10 rounded-lg hover:bg-green-600 focus:outline-none"
          onClick={showJuniorSide}
        >
          Junior
        </button>
      </div>
    </>
  );
}

export default MainPage;
