import React, { useState } from "react";
import API from "../api";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login({ adminOnly = false, allowedRole = null, title = "Login" }) {
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    try {
      const payload = { ...form };
      if (allowedRole) {
        payload.role = allowedRole;
      } else if (adminOnly) {
        delete payload.role;
      } else if (!payload.role) {
        payload.role = "owner";
      }

      const res = await API.post("accounts/login/", payload);
      const accessToken = res.data.access || res.data.token;
      const refreshToken = res.data.refresh;

      if (!accessToken) {
        throw new Error("Login succeeded but access token is missing.");
      }

      localStorage.setItem("access_token", accessToken);
      localStorage.removeItem("token");
      if (refreshToken) {
        localStorage.setItem("refresh_token", refreshToken);
      }
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("user_id", String(res.data.user_id));

      if (adminOnly && res.data.role !== "admin") {
        localStorage.clear();
        setError("This login is for admin only.");
        return;
      }
      if (allowedRole && res.data.role !== allowedRole) {
        localStorage.clear();
        setError(`This login is for ${allowedRole} only.`);
        return;
      }

      if (res.data.role === "owner") navigate("/owner");
      if (res.data.role === "doctor") navigate("/doctor");
      if (res.data.role === "admin") navigate("/admin");
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.response?.data?.message;
      if (err?.response?.status === 401) {
        setError("Invalid username or password.");
      } else if (err?.response?.status === 403 && detail) {
        setError(detail);
      } else {
        setError("Login failed. Please try again.");
      }
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="d-flex justify-content-between mb-3">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
            Back
          </button>
          <Link className="btn btn-outline-primary btn-sm" to="/">
            Home Page
          </Link>
        </div>
        <h2>{adminOnly ? "Admin Portal" : title}</h2>
        
        {!adminOnly && !allowedRole && (
          <div className="mb-3">
            <label className="small fw-bold text-muted mb-1 ms-1">Login As</label>
            <select
              className="form-control"
              value={form.role || "owner"}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="owner">Pet Owner</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>
        )}

        <div className="mb-3">
          <input 
            className="form-control"
            placeholder="Username"
            onChange={(e)=>setForm({...form, username:e.target.value})}
          />
        </div>

        <div className="mb-4">
          <input 
            className="form-control"
            placeholder="Password"
            type="password"
            onChange={(e)=>setForm({...form, password:e.target.value})}
          />
        </div>

        <button className="btn btn-primary w-100" onClick={handleLogin}>
          Sign In
        </button>

        {error && <p className="text-danger mt-3 mb-0">{error}</p>}

        {!adminOnly && !allowedRole && (
          <div className="mt-4 border-top pt-3">
            <p className="mb-1">
              New to the platform? <Link to="/register">Register here</Link>
            </p>
            <p className="mb-0">
              <Link to="/forgot-password">Forgot password?</Link>
            </p>
          </div>
      )}
      </div>
    </div>
  );
}

export default Login;
