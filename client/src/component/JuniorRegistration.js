import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";

const JuniorRegistration = () => {
  const [name, setName] = useState("");
  const [mailId, setMailId] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [contact, setcontact] = useState("");
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("");

  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_BASE_URL}/juniordetails`,
        {
          name,
          mailId,
          collegeId,
          contact,
        }
      );

      setMessage(response.data.message);
      setMessageColor("green"); // Success message in green
      setName("");
      setMailId("");
      setCollegeId("");
      setcontact(" ");

      // Uncomment to navigate after submission
      setTimeout(() => {
        navigate("/juniorLogin");
      }, 1000);
    } catch (error) {
      setMessage(
        "Error: " +
          (error.response ? error.response.data.message : error.message)
      );
      setMessageColor("red"); // Error message in red
    }
  };

  return (
    <>
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
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f0d4ce' }}>
        <div className="w-full max-w-md bg-white shadow-md rounded px-8 py-8">
          <h2 className="text-2xl font-bold text-center mb-6">
            Junior Registration
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="name"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="mailId"
              >
                Mail Id
              </label>
              <input
                type="text"
                id="mailId"
                value={mailId}
                onChange={(e) => setMailId(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="collegeId"
              >
                College ID No/Company name(if alumni)
              </label>
              <input
                type="text"
                id="collegeId"
                value={collegeId}
                onChange={(e) => setCollegeId(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="mb-6">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="contact"
              >
                Contact
              </label>
              <input
                type="text"
                id="contact"
                value={contact}
                onChange={(e) => setcontact(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-violet-600 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 w-full"
              >
                Register
              </button>
            </div>

            {message && (
              <h1 style={{ color: messageColor }} className="mt-4 text-center">
                {message}
              </h1>
            )}

            <h1 className=" mt-3 flex items-center justify-center">
              Already have an account?
              <button
                className="bg-violet-600  hover:bg-blue-600 text-white font-bold py-0 px-1 rounded"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/juniorLogin");
                }}
              >
                login
              </button>{" "}
              to continue
            </h1>
          </form>
        </div>
      </div>
    </>
  );
};

export default JuniorRegistration;
