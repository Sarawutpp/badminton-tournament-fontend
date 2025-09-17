import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout.jsx';
import PublicLayout from './layouts/PublicLayout.jsx';
import TeamsPage from './pages/admin/Teams.jsx';
import GroupsPage from './pages/admin/Groups.jsx';
import MatchesPage from './pages/admin/Matches.jsx';
import KnockoutPage from './pages/admin/Knockout.jsx';
import StandingsPage from './pages/public/Standings.jsx';
import BracketPage from './pages/public/Bracket.jsx';
import SchedulePage from './pages/public/Schedule.jsx';


const router = createBrowserRouter([
{ path: '/', element: <Navigate to="/admin" replace /> },
{
path: '/admin',
element: <AdminLayout />,
children: [
{ index: true, element: <Navigate to="teams" replace /> },
{ path: 'teams', element: <TeamsPage /> },
{ path: 'groups', element: <GroupsPage /> },
{ path: 'matches', element: <MatchesPage /> },
{ path: 'knockout', element: <KnockoutPage /> },
],
},
{
path: '/t/:slug',
element: <PublicLayout />,
children: [
{ index: true, element: <Navigate to="standings" replace /> },
{ path: 'standings', element: <StandingsPage /> },
{ path: 'bracket', element: <BracketPage /> },
{ path: 'schedule', element: <SchedulePage /> },
],
},
]);


export default router;