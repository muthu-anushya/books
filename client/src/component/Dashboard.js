import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleSignIn from "./GoogleSignIn";

function Dashboard() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState(null); // 'senior' or 'junior'

  const handleSeniorClick = () => {
    setUserType("senior");
  };

  const handleJuniorClick = () => {
    setUserType("junior");
  };

  const handleBack = () => {
    setUserType(null);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* Header */}
        <div className="flex items-center justify-center p-4 bg-gradient-to-r from-[#25154d] to-[#3a1f7a] shadow-lg">
          <img
            src="/logo.jpeg"
            alt="BookNest Logo"
            className="h-16 w-16 mr-4 md:h-20 md:w-20 rounded-full shadow-md"
          />
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-4xl text-white p-6 text-center font-bold">
            BookNest - Universal Platform
          </h1>
        </div>

        {!userType ? (
          // Main Dashboard View
          <div className="container mx-auto px-4 py-12">
            {/* Welcome Section */}
            <div className="text-center mb-12 mt-8">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                Welcome to BookNest
              </h2>
              <p className="text-xl md:text-2xl text-blue-200 mb-2">
                Connect students across all colleges
              </p>
              <p className="text-lg md:text-xl text-blue-100">
                Share and discover books easily
              </p>
            </div>

            {/* Description Card */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 md:p-12 border border-white/20">
                <h3 className="text-2xl md:text-3xl lg:text-4xl text-center text-white font-bold mb-6">
                  Easily find and share books between seniors and juniors
                </h3>
                <p className="text-lg md:text-xl text-blue-100 text-center leading-relaxed">
                  Welcome to the platform where seniors can list their used books and
                  juniors can find them easily. Let's make book sharing simpler and
                  reduce waste across all colleges!
                </p>
              </div>
            </div>

            {/* User Type Selection */}
            <div className="max-w-4xl mx-auto">
              <h3 className="text-2xl md:text-3xl text-white text-center mb-8 font-semibold">
                Choose Your Role
              </h3>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Senior Button */}
                <div className="transform transition-all duration-300 hover:scale-105">
                  <button
                    onClick={handleSeniorClick}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-8 px-6 rounded-2xl shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300"
                  >
                    <div className="flex flex-col items-center">
                      <svg
                        className="w-16 h-16 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                      <span className="text-3xl md:text-4xl mb-2">Senior</span>
                      <span className="text-lg opacity-90">
                        List your books for sale
                      </span>
                    </div>
                  </button>
                </div>

                {/* Junior Button */}
                <div className="transform transition-all duration-300 hover:scale-105">
                  <button
                    onClick={handleJuniorClick}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-8 px-6 rounded-2xl shadow-2xl focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-300"
                  >
                    <div className="flex flex-col items-center">
                      <svg
                        className="w-16 h-16 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="text-3xl md:text-4xl mb-2">Junior</span>
                      <span className="text-lg opacity-90">
                        Find and buy books
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Google Sign-In View
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-md mx-auto">
              <button
                onClick={handleBack}
                className="mb-6 text-white hover:text-blue-200 transition-colors flex items-center"
              >
                <svg
                  className="w-6 h-6 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Dashboard
              </button>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
                <h2 className="text-3xl font-bold text-white text-center mb-4">
                  {userType === "senior" ? "Senior" : "Junior"} Sign In
                </h2>
                <p className="text-blue-200 text-center mb-8">
                  Sign in with your Google account to continue
                </p>
                <GoogleSignIn userType={userType} />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 py-8 text-center text-blue-200">
          <p className="text-sm md:text-base">
            © 2024 BookNest - Connecting students across all colleges
          </p>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
