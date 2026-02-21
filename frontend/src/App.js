import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthHome from "./pages/AuthHome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import OwnerDashboard from "./pages/OwnerDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PetProfile from "./pages/PetProfile";

function getDefaultDashboard(role) {
  if (role === "owner") return "/owner";
  if (role === "doctor") return "/doctor";
  if (role === "admin") return "/admin";
  return "/login";
}

function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("role");

  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getDefaultDashboard(role)} replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("role");

  if (token && role) {
    return <Navigate to={getDefaultDashboard(role)} replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <PublicOnlyRoute>
              <AuthHome />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/owner-login"
          element={
            <PublicOnlyRoute>
              <Login allowedRole="owner" title="Owner Login" />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/doctor-login"
          element={
            <PublicOnlyRoute>
              <Login allowedRole="doctor" title="Doctor Login" />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/admin-login"
          element={
            <PublicOnlyRoute>
              <Login adminOnly />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/owner-register"
          element={
            <PublicOnlyRoute>
              <Register presetRole="owner" title="Owner Registration" />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/doctor-register"
          element={
            <PublicOnlyRoute>
              <Register presetRole="doctor" title="Doctor Registration" />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPassword />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/owner"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pets/:id"
          element={
            <ProtectedRoute allowedRoles={["owner", "doctor", "admin"]}>
              <PetProfile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
