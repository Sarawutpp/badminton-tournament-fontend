import React from "react";
import { NavLink, Outlet, useParams, Link } from "react-router-dom";

export default function PublicLayout() {
  const { slug } = useParams();
  return (
    <div className="container">
      <div className="header">
        <h1 className="title">Tournament • {slug}</h1>
        <Link to="/admin" className="badge" title="Admin">
          Admin
        </Link>
      </div>

      <div className="tabs">
        <NavLink
          to=""
          end
          className={({ isActive }) => `tab ${isActive ? "is-active" : ""}`}
        >
          Standings
        </NavLink>
        <NavLink
          to="bracket"
          className={({ isActive }) => `tab ${isActive ? "is-active" : ""}`}
        >
          Bracket
        </NavLink>
        <NavLink
          to="schedule"
          className={({ isActive }) => `tab ${isActive ? "is-active" : ""}`}
        >
          Schedule
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
