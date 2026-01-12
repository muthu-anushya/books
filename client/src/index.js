import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";
import App from "./App";

// Google OAuth Client ID
// Get this from: https://console.cloud.google.com/apis/credentials
// Create a .env file in the client directory with: REACT_APP_GOOGLE_CLIENT_ID=your_client_id
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID") {
  console.warn(
    "⚠️ Google OAuth Client ID not configured. Please set REACT_APP_GOOGLE_CLIENT_ID in your .env file"
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    {GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID" ? (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    ) : (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#ef4444', marginBottom: '20px' }}>
          ⚠️ Configuration Required
        </h1>
        <p style={{ color: '#666', maxWidth: '600px' }}>
          Please configure your Google OAuth Client ID. Create a <code>.env</code> file in the client directory 
          with <code>REACT_APP_GOOGLE_CLIENT_ID=your_client_id</code>
        </p>
        <p style={{ color: '#666', marginTop: '10px', fontSize: '14px' }}>
          See README.md for detailed setup instructions.
        </p>
      </div>
    )}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
