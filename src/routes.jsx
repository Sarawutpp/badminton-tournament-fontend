// src/routes.jsx
// (เวอร์ชันแก้ไข: เพิ่ม RequireAdmin + Login + ป้องกัน /admin)

import { createBrowserRouter, Navigate } from "react-router-dom";

// 🧩 Layouts
import AdminLayout from "./layouts/AdminLayout";
import PublicLayout from "./layouts/PublicLayout";

// 🧠 Auth
import RequireAdmin from "./routes/RequireAdmin";
import Login from "./pages/Login.jsx";

// 🧠 Admin Pages
import PlayersPage from "./pages/admin/Players";
import TeamsPage from "./pages/admin/Teams";
import GeneratorPage from "./pages/admin/Generator";
import MatchesPage from "./pages/admin/Matches"; // หน้าเก่า (ยังเก็บไว้ ถ้าอยากใช้ต่อ)
import KnockoutPage from "./pages/admin/Knockout";
import AdminSchedulePlan from "./pages/admin/AdminSchedulePlan.jsx";
import AdminMatchScoring from "./pages/admin/AdminMatchScoring.jsx"; // หน้าใหม่
import CourtRunningPage from "./pages/admin/CourtRunning.jsx";

// 📊 Public / Shared Pages
import StandingsPage from "./pages/public/Standings.jsx";
import BracketPage from "./pages/public/Bracket";
import SchedulePage from "./pages/public/Schedule";
import PublicCourtRunning from "./pages/public/PublicCourtRunning.jsx"; // หน้า public running

const router = createBrowserRouter([
  // 🏠 Root → เปลี่ยนเส้นทางไป /admin (ซึ่งถูก protect ด้วย RequireAdmin)
  { path: "/", element: <Navigate to="/admin" replace /> },

  // 🔐 หน้า Login (ไม่ห่อ RequireAdmin)
  {
    path: "/login",
    element: <Login />,
  },

  // ⚙️ Admin Section (ห่อด้วย RequireAdmin)
  {
    path: "/admin",
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <Navigate to="standings" replace /> },
      { path: "players", element: <PlayersPage /> },
      { path: "teams", element: <TeamsPage /> },
      { path: "generator", element: <GeneratorPage /> },
      // ถ้ายังอยากเก็บหน้า AdminMatches แบบเดิม
      { path: "matches-old", element: <MatchesPage /> },
      // ใช้ AdminMatchScoring เป็น default /admin/matches
      { path: "matches", element: <AdminMatchScoring /> },
      { path: "schedule-plan", element: <AdminSchedulePlan /> },
      { path: "court-running", element: <CourtRunningPage /> },
      { path: "knockout", element: <KnockoutPage /> },
      { path: "standings", element: <StandingsPage /> },
    ],
  },

  // 🌐 Public Tournament Section (ไม่ต้อง login)
  {
    path: "/t/:slug",
    element: <PublicLayout />,
    children: [
      { index: true, element: <Navigate to="schedule" replace /> }, // ให้ตารางแข่งเป็นหน้าแรก
      { path: "schedule", element: <SchedulePage /> },
      { path: "running", element: <PublicCourtRunning /> },
      { path: "standings", element: <StandingsPage /> },
      { path: "bracket", element: <BracketPage /> },
    ],
  },

  // ❌ 404
  {
    path: "*",
    element: (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold mb-2">
          404 - ไม่พบหน้าที่ต้องการ
        </h1>
      </div>
    ),
  },
]);
//
export default router;
