// src/routes.jsx
// (เวอร์ชันแก้ไข: เพิ่ม PublicCourtRunning)

import { createBrowserRouter, Navigate } from "react-router-dom";

// 🧩 Layouts
import AdminLayout from "./layouts/AdminLayout";
import PublicLayout from "./layouts/PublicLayout";

// 🧠 Admin Pages
import PlayersPage from "./pages/admin/Players";
import TeamsPage from "./pages/admin/Teams";
import GeneratorPage from "./pages/admin/Generator";
import MatchesPage from "./pages/admin/Matches"; // หน้าเก่า (ยังเก็บไว้)
import KnockoutPage from "./pages/admin/Knockout";
import AdminSchedulePlan from "./pages/admin/AdminSchedulePlan.jsx";
import AdminMatchScoring from "./pages/admin/AdminMatchScoring.jsx"; // หน้าใหม่
import CourtRunningPage from "./pages/admin/CourtRunning.jsx";

// 📊 Public / Shared Pages
import StandingsPage from "./pages/public/Standings.jsx";
import BracketPage from "./pages/public/Bracket";
import SchedulePage from "./pages/public/Schedule";
import PublicCourtRunning from "./pages/public/PublicCourtRunning.jsx"; // <-- 1. Import หน้าใหม่

const router = createBrowserRouter([
  // 🏠 Root
  { path: "/", element: <Navigate to="/admin" replace /> },

  // ⚙️ Admin Section
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="standings" replace /> },
      { path: "players", element: <PlayersPage /> },
      { path: "teams", element: <TeamsPage /> },
      { path: "generator", element: <GeneratorPage /> },
      { path: "matches", element: <AdminMatchScoring /> }, 
      { path: "schedule-plan", element: <AdminSchedulePlan /> },
      { path: "court-running", element: <CourtRunningPage /> },
      { path: "knockout", element: <KnockoutPage /> },
      { path: "standings", element: <StandingsPage /> },
    ],
  },

  // 🌐 Public Tournament Section
  {
    path: "/t/:slug",
    element: <PublicLayout />,
    children: [
      { index: true, element: <Navigate to="schedule" replace /> }, // <-- ให้ตารางแข่งเป็นหน้าแรก
      { path: "schedule", element: <SchedulePage /> },
      { path: "running", element: <PublicCourtRunning /> }, // <-- 2. เพิ่ม Path "running"
      { path: "standings", element: <StandingsPage /> },
      { path: "bracket", element: <BracketPage /> },
    ],
  },
]);

export default router;