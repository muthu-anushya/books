import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // if (username === "JACSICE" && password === "JACSICE") {
      alert("Login successful");
      setTimeout(() => {
        navigate("/mainpage");
      }, 1000);
    // } else {
    //   alert("Wrong username and password");
    // }
    // setUsername("");
    // setPassword("");
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
                htmlFor="username"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="mb-6">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="password"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 w-full"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
