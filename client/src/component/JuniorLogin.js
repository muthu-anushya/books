import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config/api";

const JuniorLogin = () => {
  const [mailId, setMailId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mailId) {
      setError("Email is required");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/juniorlogin`,
        {
          mailId,
        }
      );
      console.log("Sending mailId:", mailId); // Log mailId to ensure it's correct
      const { token, user } = response.data;
      console.log("User Logged In:", user);

      // Save token and user details to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setMessage(response.data.message);
      setError("");
      setMailId("");

      setTimeout(() => {
        navigate("/bookavailable");
      }, 1000);
    } catch (err) {
      // setError(err.response?.data?.message || "something went wrong");
      setError(err.response?.data?.message || "Mail not registered");
      setMessage("");
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0d4ce' }}>
        <div className="w-full max-w-md bg-white shadow-md rounded-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
          <form onSubmit={handleSubmit}>
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

            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-violet-600 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 w-full"
              >
                Login
              </button>
            </div>
            {error && <p style={{ color: "red" }}>{error}</p>}
            {message && <p style={{ color: "green" }}>{message}</p>}
            <h1 className=" mt-3 flex items-center justify-center">
              New user?
              <button
                className="bg-violet-600  hover:bg-blue-600 text-white font-bold py-0 px-1 rounded"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/junior_registration");
                }}
              >
                Register
              </button>{" "}
              to continue
            </h1>
          </form>
        </div>
      </div>
    </>
  );
};

export default JuniorLogin;
