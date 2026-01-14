import React, { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const GoogleSignIn = ({ userType }) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSuccess = async (tokenResponse) => {
    setLoading(true);
    setError("");

    try {
      // Get user info from Google
      const userInfoResponse = await axios.get(
        `https://www.googleapis.com/oauth2/v3/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        }
      );

      const { email, name, picture, sub } = userInfoResponse.data;

      // Send to backend for authentication/registration
      const endpoint =
        userType === "senior"
          ? "http://localhost:8000/google-auth-senior"
          : "http://localhost:8000/google-auth-junior";

      console.log("Sending to backend:", { email, name, picture, googleId: sub });

      const response = await axios.post(
        endpoint,
        {
          email,
          name,
          picture,
          googleId: sub,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const { token, user, isNewUser } = response.data;

      // Save token and user details to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userType", userType);

      // Navigate based on user type
      if (userType === "senior") {
        navigate("/listavailablebooks");
      } else {
        navigate("/bookavailable");
      }
    } catch (err) {
      console.error("Google Sign-In Error:", err);
      
      // More detailed error messages
      if (err.response) {
        // Server responded with error
        setError(
          err.response.data?.message ||
          `Server error: ${err.response.status} - ${err.response.statusText}`
        );
      } else if (err.request) {
        // Request was made but no response received
        setError(
          "Cannot connect to server. Please check if the backend server is running."
        );
      } else {
        // Something else happened
        setError(
          err.message || "Failed to sign in. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const login = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: (error) => {
      console.error("Google Login Error:", error);
      setError(
        error.error === "popup_closed_by_user"
          ? "Sign-in was cancelled. Please try again."
          : `Google sign-in failed: ${error.error || "Unknown error"}. Please try again.`
      );
      setLoading(false);
    },
  });

  return (
    <div className="space-y-4">
      <button
        onClick={() => {
          setLoading(true);
          login();
        }}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f8f8 50%, #ffffff 100%)',
          border: '3px solid #cc9b89',
          color: '#8b5a3c'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #f2bfac 0%, #ffe4d6 50%, #f2bfac 100%)';
          e.currentTarget.style.borderColor = '#d4a896';
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(204, 155, 137, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8f8f8 50%, #ffffff 100%)';
          e.currentTarget.style.borderColor = '#cc9b89';
          e.currentTarget.style.boxShadow = '';
        }}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-gray-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="font-semibold">Signing in...</span>
          </>
        ) : (
          <>
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-lg font-semibold">Sign in with Google</span>
          </>
        )}
      </button>

      {error && (
        <div className="px-4 py-3 rounded-xl text-sm font-semibold shadow-lg" style={{ 
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          border: '3px solid #ef4444',
          color: '#991b1b'
        }}>
          {error}
        </div>
      )}

      <p className="text-sm text-center mt-4 font-medium" style={{ color: '#8b5a3c' }}>
        By signing in, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
};

export default GoogleSignIn;
