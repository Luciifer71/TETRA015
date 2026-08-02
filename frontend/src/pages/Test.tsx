import React from "react";

export const Test: React.FC = () => {
  return (
    <div style={{ padding: "50px", fontSize: "20px", backgroundColor: "#f0f0f0" }}>
      <h1>✅ Frontend is working!</h1>
      <p>If you see this, the frontend app is rendering correctly.</p>
      <p>Backend API is at: http://localhost:8001</p>
      <p>Frontend dev server is at: http://localhost:5173</p>
    </div>
  );
};
