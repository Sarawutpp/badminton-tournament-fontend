// src/App.jsx
import React from "react";
import { RouterProvider } from "react-router-dom";
import router from "./routes.jsx";
import { AuthProvider } from "./contexts/AuthContext";
import { TournamentProvider, useTournament } from "./contexts/TournamentContext";

// Component ย่อยเพื่อเช็ค Loading (เผื่อดึงข้อมูลจาก localStorage)
function AppContent() {
  const { loading } = useTournament();

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading App...</div>;
  }

  // ✅ ไม่ต้องเช็ค !selectedTournament ตรงนี้แล้ว ให้ Router จัดการ
  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <AuthProvider>
      <TournamentProvider>
         <AppContent />
      </TournamentProvider>
    </AuthProvider>
  );
}