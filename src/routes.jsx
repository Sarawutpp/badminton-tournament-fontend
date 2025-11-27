// src/routes.jsx
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
import MatchesPage from "./pages/admin/Matches"; // หน้าเก่า
import AdminSchedulePlan from "./pages/admin/AdminSchedulePlan.jsx";
import AdminMatchScoring from "./pages/admin/AdminMatchScoring.jsx";
import CourtRunningPage from "./pages/admin/CourtRunning.jsx";
import AdminStandingsPage from "./pages/admin/Groups.jsx";

// 🏆 Knockout Admin Pages
import KnockoutScoringAdminPage from "./pages/admin/KnockoutScoringAdminPage.jsx";
import KnockoutBracketAdminPage from "./pages/admin/KnockoutBracketAdminPage.jsx";

// 📊 Public / Shared Pages
import StandingsPage from "./pages/public/Standings.jsx";
import SchedulePage from "./pages/public/Schedule";
import PublicCourtRunning from "./pages/public/PublicCourtRunning.jsx";

// ✅ เปลี่ยนมา import หน้าใหม่แทน Bracket เดิม
import PublicKnockoutBracket from "./pages/public/PublicKnockoutBracket.jsx";

const router = createBrowserRouter([
  // 🏠 Root -> จะพาไป /public ก่อน
  { path: "/", element: <Navigate to="/public" replace /> },

  // 🔐 หน้า Login
  {
    path: "/login",
    element: <Login />,
  },

  // ⚙️ Admin Section => /admin/...
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

      // legacy matches page
      { path: "matches-old", element: <MatchesPage /> },

      // หน้า scoring แบบใหม่
      { path: "matches", element: <AdminMatchScoring /> },

      { path: "schedule-plan", element: <AdminSchedulePlan /> },
      { path: "court-running", element: <CourtRunningPage /> },
      { path: "standings", element: <AdminStandingsPage /> },

      // 🏆 Knockout Admin
      {
        path: "knockout/scoring",
        element: <KnockoutScoringAdminPage />,
      },
      {
        path: "knockout/bracket",
        element: <KnockoutBracketAdminPage />,
      },
      {
        path: "knockout",
        element: <Navigate to="knockout/bracket" replace />,
      },
    ],
  },

  // 🌐 Public Tournament Section => /public/...
  {
    path: "/public",
    element: <PublicLayout />,
    children: [
      // ให้ Court Running เป็นหน้าแรกเวลาเข้า /public
      { index: true, element: <Navigate to="running" replace /> },
      { path: "running", element: <PublicCourtRunning /> },
      { path: "schedule", element: <SchedulePage /> },
      { path: "standings", element: <StandingsPage /> },
      
      // ✅ ใช้ Component ใหม่ที่แสดงข้อมูลจริง
      { path: "bracket", element: <PublicKnockoutBracket /> },
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

export default router;