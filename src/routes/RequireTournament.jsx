// src/routes/RequireTournament.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useTournament } from "../contexts/TournamentContext";

export default function RequireTournament() {
  const { selectedTournament, loading } = useTournament();

  if (loading) return <div>Loading...</div>;

  // ถ้ายังไม่มีงานที่เลือก -> ดีดไปหน้า /select
  if (!selectedTournament) {
    return <Navigate to="/select" replace />;
  }

  // ถ้ามีแล้ว -> ให้ผ่านไปแสดงผล child routes ได้
  return <Outlet />;
}