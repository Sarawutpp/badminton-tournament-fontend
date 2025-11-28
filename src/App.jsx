// src/App.jsx
import React from "react";
import { RouterProvider } from "react-router-dom";
import router from "./routes.jsx";

// 👇 import AuthProvider
import { AuthProvider } from "./contexts/AuthContext";

export default function App() {
  return (
    // 👇 ห่อ RouterProvider ด้วย AuthProvider
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}//