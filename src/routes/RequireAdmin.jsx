// src/routes/RequireAdmin.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-600">กำลังตรวจสอบสิทธิ์...</p>
      </div>
    );
  }

  if (!user) {
    // ยังไม่ login → ส่งไปหน้า /login แล้วจำ path เดิมไว้
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white border rounded-xl shadow p-6 text-center">
          <h1 className="text-lg font-semibold mb-2">
            ไม่มีสิทธิ์เข้าหน้านี้
          </h1>
          <p className="text-sm text-slate-600">
            จำเป็นต้องเป็นผู้ดูแลระบบ (admin) จึงจะเข้าหน้านี้ได้
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default RequireAdmin;
