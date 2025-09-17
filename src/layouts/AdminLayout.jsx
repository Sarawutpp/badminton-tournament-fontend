import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="container">
      <div className="header">
        <h1 className="title">Badminton Tournament Admin</h1>
      </div>

      <div className="tabs">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) => `tab ${isActive ? "is-active" : ""}`}
        >
          Teams
        </NavLink>
        <NavLink
          to="/admin/groups"
          className={({ isActive }) => `tab ${isActive ? "is-active" : ""}`}
        >
          Groups
        </NavLink>
        <NavLink
          to="/admin/matches"
          className={({ isActive }) => `tab ${isActive ? "is-active" : ""}`}
        >
          Matches
        </NavLink>
        <NavLink
          to="/admin/knockout"
          className={({ isActive }) => `tab ${isActive ? "is-active" : ""}`}
        >
          Knockout
        </NavLink>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="card-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
