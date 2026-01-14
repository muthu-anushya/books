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
      <div className="min-h-screen" style={{ background: '#f0d4ce' }}>
        {/* Header */}
        <div className="flex items-center justify-center p-3 sm:p-4 shadow-sm border-b" style={{ background: '#f0d4ce', borderColor: '#c9a8a8' }}>
          <img
            src="/muthura-logo.png"
            alt="MUTHURA.IN Logo"
            className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 mr-2 sm:mr-4 rounded-full shadow-md"
          />
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl p-3 sm:p-6 text-center font-bold tracking-tight" style={{ color: '#3d2f2f', fontFamily: 'serif' }}>
              BookNest
            </h1>
        </div>

        {!userType ? (
          // Main Dashboard View
          <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
            {/* Welcome Section */}
            <div className="text-center mb-8 sm:mb-12 mt-4 sm:mt-8 relative">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 sm:w-64 h-48 sm:h-64 opacity-5" style={{ 
                background: 'radial-gradient(circle, #8b5a3c, transparent)',
                borderRadius: '50%'
              }}></div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 relative z-10 px-2" style={{ 
                color: '#8b5a3c',
                fontFamily: 'serif',
                textShadow: '0 2px 4px rgba(139, 90, 60, 0.1)'
              }}>
                Welcome to BookNest
              </h2>
              <div className="h-1 w-16 sm:w-20 mx-auto mb-3 sm:mb-4 rounded-full" style={{ background: 'linear-gradient(90deg, #c9a8a8, #8b5a3c)' }}></div>
              <p className="text-lg sm:text-xl md:text-2xl mb-2 sm:mb-3 font-semibold px-2" style={{ color: '#5a4a4a', fontFamily: 'sans-serif' }}>
                Connect students across all colleges
              </p>
              <p className="text-base sm:text-lg md:text-xl font-medium px-2" style={{ color: '#8b5a3c' }}>
                Share and discover books easily
              </p>
            </div>

            {/* Description Card */}
            <div className="max-w-4xl mx-auto mb-8 sm:mb-12 px-2">
              <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12 overflow-hidden relative group" style={{ 
                background: 'linear-gradient(135deg, #fef9f6 0%, #faf5f0 100%)',
                border: '2px solid #e8e0d8',
                boxShadow: '0 8px 24px rgba(139, 90, 60, 0.08), 0 2px 8px rgba(139, 90, 60, 0.04)'
              }}>
                {/* Decorative corner elements */}
                <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 opacity-5" style={{ 
                  background: 'radial-gradient(circle, #8b5a3c, transparent)',
                  transform: 'translate(30%, -30%)'
                }}></div>
                <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 opacity-5" style={{ 
                  background: 'radial-gradient(circle, #c9a8a8, transparent)',
                  transform: 'translate(-30%, 30%)'
                }}></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-center mb-3 sm:mb-4">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#8b5a3c' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-center" style={{ color: '#3d2f2f', fontFamily: 'serif' }}>
                      Easily find and share books between seniors and juniors
                    </h3>
                  </div>
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed font-medium mb-4 sm:mb-6 text-center px-2" style={{ color: '#5a4a4a', fontFamily: 'sans-serif' }}>
                    Welcome to the platform where seniors can list their used books and
                    juniors can find them easily. Let's make book sharing simpler and
                    reduce waste across all colleges!
                  </p>
                  
                  {/* Feature highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#8b5a3c' }}>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs sm:text-sm font-semibold" style={{ color: '#5a4a4a' }}>Easy Listing</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#8b5a3c' }}>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs sm:text-sm font-semibold" style={{ color: '#5a4a4a' }}>Quick Search</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#8b5a3c' }}>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs sm:text-sm font-semibold" style={{ color: '#5a4a4a' }}>Secure Platform</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Type Selection */}
            <div className="max-w-4xl mx-auto px-2">
              <div className="mb-6 sm:mb-8 text-center">
                <h3 className="text-xl sm:text-2xl md:text-3xl mb-2 font-bold" style={{ color: '#3d2f2f', fontFamily: 'serif' }}>
                  Choose Your Role
                </h3>
                <div className="h-1 w-12 sm:w-16 mx-auto rounded-full" style={{ background: 'linear-gradient(90deg, #c9a8a8, #8b5a3c)' }}></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                {/* Senior Button */}
                <div className="transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
                  <button
                    onClick={handleSeniorClick}
                    className="w-full font-bold py-6 sm:py-8 px-4 sm:px-6 rounded-xl sm:rounded-2xl focus:outline-none transition-all duration-300 relative overflow-hidden group"
                    style={{ 
                      background: 'linear-gradient(135deg, #c9a8a8 0%, #b89595 100%)',
                      color: '#fff',
                      border: '2px solid #a88585',
                      boxShadow: '0 4px 16px rgba(201, 168, 168, 0.3), 0 2px 8px rgba(201, 168, 168, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #d4a5a5 0%, #c9a8a8 100%)';
                      e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(201, 168, 168, 0.4), 0 4px 12px rgba(201, 168, 168, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #c9a8a8 0%, #b89595 100%)';
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(201, 168, 168, 0.3), 0 2px 8px rgba(201, 168, 168, 0.2)';
                    }}
                    onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 4px rgba(201, 168, 168, 0.5), 0 8px 24px rgba(201, 168, 168, 0.4)'}
                    onBlur={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(201, 168, 168, 0.3), 0 2px 8px rgba(201, 168, 168, 0.2)'}
                  >
                    <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 70%)' }}></div>
                    <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity" style={{ background: 'linear-gradient(135deg, transparent, rgba(255,255,255,0.1))' }}></div>
                      <div className="flex flex-col items-center relative z-10">
                        <div className="mb-3 sm:mb-4 p-2 sm:p-3 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
                          <svg
                            className="w-10 h-10 sm:w-12 sm:h-12"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                        </div>
                        <span className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2 font-bold">Senior</span>
                        <span className="text-base sm:text-lg font-medium opacity-95">
                          List your books for sale
                        </span>
                      </div>
                  </button>
                </div>

                {/* Junior Button */}
                <div className="transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
                  <button
                    onClick={handleJuniorClick}
                    className="w-full font-bold py-6 sm:py-8 px-4 sm:px-6 rounded-xl sm:rounded-2xl focus:outline-none transition-all duration-300 relative overflow-hidden group"
                    style={{ 
                      background: 'linear-gradient(135deg, #c9a8a8 0%, #b89595 100%)',
                      color: '#fff',
                      border: '2px solid #a88585',
                      boxShadow: '0 4px 16px rgba(201, 168, 168, 0.3), 0 2px 8px rgba(201, 168, 168, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #d4a5a5 0%, #c9a8a8 100%)';
                      e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(201, 168, 168, 0.4), 0 4px 12px rgba(201, 168, 168, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #c9a8a8 0%, #b89595 100%)';
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(201, 168, 168, 0.3), 0 2px 8px rgba(201, 168, 168, 0.2)';
                    }}
                    onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 4px rgba(201, 168, 168, 0.5), 0 8px 24px rgba(201, 168, 168, 0.4)'}
                    onBlur={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(201, 168, 168, 0.3), 0 2px 8px rgba(201, 168, 168, 0.2)'}
                  >
                    <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.4), transparent 70%)' }}></div>
                    <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity" style={{ background: 'linear-gradient(135deg, transparent, rgba(255,255,255,0.1))' }}></div>
                      <div className="flex flex-col items-center relative z-10">
                        <div className="mb-3 sm:mb-4 p-2 sm:p-3 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
                          <svg
                            className="w-10 h-10 sm:w-12 sm:h-12"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <span className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2 font-bold">Junior</span>
                        <span className="text-base sm:text-lg font-medium opacity-95">
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
                className="mb-6 transition-all duration-300 flex items-center font-semibold px-4 py-3 rounded-xl hover:shadow-md"
                style={{ 
                  color: '#c9a8a8',
                  background: 'rgba(201, 168, 168, 0.05)',
                  border: '1px solid rgba(201, 168, 168, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#d4a5a5';
                  e.currentTarget.style.backgroundColor = 'rgba(201, 168, 168, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(201, 168, 168, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#c9a8a8';
                  e.currentTarget.style.backgroundColor = 'rgba(201, 168, 168, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(201, 168, 168, 0.2)';
                }}
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

              <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border overflow-hidden relative" style={{ 
                background: 'linear-gradient(135deg, #fef9f6 0%, #faf5f0 100%)',
                borderColor: '#e8e0d8',
                borderWidth: '2px',
                boxShadow: '0 8px 24px rgba(139, 90, 60, 0.08), 0 2px 8px rgba(139, 90, 60, 0.04)'
              }}>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 opacity-5" style={{ 
                  background: 'radial-gradient(circle, #8b5a3c, transparent)',
                  transform: 'translate(30%, -30%)'
                }}></div>
                
                <div className="relative z-10">
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full mb-3 sm:mb-4" style={{ background: 'rgba(201, 168, 168, 0.15)' }}>
                      <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#8b5a3c' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#3d2f2f', fontFamily: 'serif' }}>
                      {userType === "senior" ? "Senior" : "Junior"} Sign In
                    </h2>
                    <div className="h-1 w-10 sm:w-12 mx-auto rounded-full mb-3 sm:mb-4" style={{ background: 'linear-gradient(90deg, #c9a8a8, #8b5a3c)' }}></div>
                    <p className="text-sm sm:text-base font-semibold" style={{ color: '#5a4a4a', fontFamily: 'sans-serif' }}>
                      Sign in with your Google account to continue
                    </p>
                  </div>
                  <GoogleSignIn userType={userType} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 py-8 text-center" style={{ color: '#5a4a4a' }}>
          <p className="text-sm md:text-base font-semibold" style={{ fontFamily: 'sans-serif' }}>
            © 2024 BookNest - Connecting students across all colleges
          </p>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
