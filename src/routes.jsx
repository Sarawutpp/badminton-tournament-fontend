import { createBrowserRouter, Navigate } from "react-router-dom";

// 🧩 Layouts
import AdminLayout from "./layouts/AdminLayout";
import PublicLayout from "./layouts/PublicLayout";

// 🧠 Auth & Guards
import RequireAdmin from "./routes/RequireAdmin";
import RequireTournament from "./routes/RequireTournament"; // ✅ Import Guard ตัวใหม่
import Login from "./pages/Login.jsx";

// 📄 Pages
import TournamentSelectionPage from "./pages/TournamentSelectionPage"; // ✅ Import หน้าเลือกงาน
import PlayersPage from "./pages/admin/Players";
import TeamsPage from "./pages/admin/Teams";
import GeneratorPage from "./pages/admin/Generator";
import MatchesPage from "./pages/admin/Matches";
import AdminSchedulePlan from "./pages/admin/AdminSchedulePlan.jsx";
import AdminMatchScoring from "./pages/admin/AdminMatchScoring.jsx";
import CourtRunningPage from "./pages/admin/CourtRunning.jsx";
import AdminStandingsPage from "./pages/admin/Groups.jsx";
import ManualMatchPage from "./pages/admin/ManualMatch.jsx";

import KnockoutScoringAdminPage from "./pages/admin/KnockoutScoringAdminPage.jsx";
import KnockoutBracketAdminPage from "./pages/admin/KnockoutBracketAdminPage.jsx";
import ShuttlecockManagementPage from "./pages/admin/ShuttlecockManagement.jsx"; // [NEW] Import
import PrintBatchPage from "./pages/admin/PrintBatchPage";

import StandingsPage from "./pages/public/Standings.jsx";
import SchedulePage from "./pages/public/Schedule";
import PublicCourtRunning from "./pages/public/PublicCourtRunning.jsx";
import PublicKnockoutBracket from "./pages/public/PublicKnockoutBracket.jsx";
import HallOfFame from "./pages/public/HallOfFame.jsx"; // ✅ [NEW] Import Hall of Fame
import RulesPage from "./pages/public/RulesPage.jsx"; // ✅ [NEW] Import Rules

const router = createBrowserRouter([
  // ✅ 1. เพิ่ม Route สำหรับหน้าเลือกงาน (เข้าได้ทุกคน)
  {
    path: "/select",
    element: <TournamentSelectionPage />,
  },

  // 🔐 หน้า Login (เข้าได้ทุกคน)
  {
    path: "/login",
    element: <Login />,
  },

  // 🏠 Root Redirect
  { path: "/", element: <Navigate to="/public" replace /> },

  // ====================================================
  // 🛡️ โซนที่ต้องเลือก Tournament ก่อน (ครอบด้วย RequireTournament)
  // ====================================================
  {
    element: <RequireTournament />, // ✅ ครอบทั้งหมดนี้
    children: [
      // ⚙️ Admin Section
      {
        path: "/admin",
        element: (
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        ),
        children: [
          { index: true, element: <Navigate to="standings" replace /> },
          { path: "print-batch", element: <PrintBatchPage /> },
          { path: "players", element: <PlayersPage /> },
          { path: "teams", element: <TeamsPage /> },
          { path: "generator", element: <GeneratorPage /> },
          { path: "matches-old", element: <MatchesPage /> },
          { path: "matches", element: <AdminMatchScoring /> },
          { path: "schedule-plan", element: <AdminSchedulePlan /> },
          { path: "manual-match", element: <ManualMatchPage /> },
          { path: "court-running", element: <CourtRunningPage /> },
          { path: "standings", element: <AdminStandingsPage /> },
          { path: "knockout/scoring", element: <KnockoutScoringAdminPage /> },
          { path: "knockout/bracket", element: <KnockoutBracketAdminPage /> },
          {
            path: "knockout",
            element: <Navigate to="knockout/bracket" replace />,
          },
          { path: "shuttlecocks", element: <ShuttlecockManagementPage /> },
        ],
      },

      // 🌐 Public Section
      {
        path: "/public",
        element: <PublicLayout />,
        children: [
          { index: true, element: <Navigate to="running" replace /> },
          { path: "running", element: <PublicCourtRunning /> },
          { path: "schedule", element: <SchedulePage /> },
          { path: "standings", element: <StandingsPage /> },
          { path: "bracket", element: <PublicKnockoutBracket /> },
          { path: "rules", element: <RulesPage /> }, // ✅ [NEW] Route กติกา
          { path: "hall-of-fame", element: <HallOfFame /> }, // ✅ [NEW] Route ทำเนียบแชมป์
        ],
      },
    ],
  },
  // ====================================================

  // ❌ 404
  {
    path: "*",
    element: (
      <div className="p-6 text-center">
        <h1>404 - Not Found</h1>
      </div>
    ),
  },
]);

export default router;
