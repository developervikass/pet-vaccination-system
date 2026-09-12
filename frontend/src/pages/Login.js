import React, { useState } from "react";
import API from "../api";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login({ adminOnly = false, allowedRole = null, title = "Login" }) {
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loginMethod, setLoginMethod] = useState("password");
  const [otpSent, setOtpSent] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const navigate = useNavigate();

  const completeLogin = (res) => {
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
    localStorage.setItem("force_password_reset", String(Boolean(res.data.force_password_reset)));

    if (adminOnly && res.data.role !== "admin") {
      localStorage.clear();
      throw new Error("This login is for admin only.");
    }
    if (allowedRole && res.data.role !== allowedRole) {
      localStorage.clear();
      throw new Error(`This login is for ${allowedRole} only.`);
    }

    if (res.data.role === "owner") navigate("/owner");
    if (res.data.role === "doctor") navigate("/doctor");
    if (res.data.role === "admin") navigate("/admin");
  };

  const handleLogin = async () => {
    setError("");
    setMessage("");
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
      completeLogin(res);
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

  const requestAdminOtp = async () => {
    setError("");
    setMessage("");
    try {
      const res = await API.post("accounts/admin/email-otp/", { email: form.email });
      setOtpSent(true);
      setMessage(res.data.message);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to send an OTP.");
    }
  };

  const verifyAdminOtp = async () => {
    setError("");
    setMessage("");
    try {
      const res = await API.post("accounts/admin/email-otp/verify/", {
        email: form.email,
        otp: form.otp,
      });
      completeLogin(res);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || "Invalid or expired OTP.");
    }
  };

  const requestAdminPasswordResetOtp = async () => {
    setError("");
    setMessage("");
    try {
      const res = await API.post("accounts/admin/password-reset/email-otp/", { email: form.email });
      setResetOtpSent(true);
      setMessage(res.data.message);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to send an OTP.");
    }
  };

  const confirmAdminPasswordReset = async () => {
    setError("");
    setMessage("");
    try {
      const res = await API.post("accounts/admin/password-reset/email-otp/confirm/", {
        email: form.email,
        otp: form.otp,
        new_password: form.newPassword,
      });
      setMessage(res.data.message);
      setResetMode(false);
      setResetOtpSent(false);
      setForm({});
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || "Unable to reset password.");
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

        {adminOnly && !resetMode && (
          <div className="btn-group w-100 mb-3 admin-login-toggle" role="group" aria-label="Admin login method">
            <button
              className={`btn ${loginMethod === "password" ? "btn-primary admin-login-toggle-active" : "btn-outline-primary"}`}
              onClick={() => { setLoginMethod("password"); setOtpSent(false); setError(""); setMessage(""); }}
            >
              Password
            </button>
            <button
              className={`btn ${loginMethod === "otp" ? "btn-primary admin-login-toggle-active" : "btn-outline-primary"}`}
              onClick={() => { setLoginMethod("otp"); setOtpSent(false); setError(""); setMessage(""); }}
            >
              Email OTP
            </button>
          </div>
        )}
        
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

        {adminOnly && resetMode ? (
          <>
            <p className="text-muted small">Reset your admin password using the OTP sent to your registered email.</p>
            <div className="mb-3">
              <input
                className="form-control"
                placeholder="Registered email address"
                type="email"
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            {resetOtpSent && (
              <>
                <div className="mb-3">
                  <input className="form-control" placeholder="6-digit OTP" inputMode="numeric" maxLength="6" value={form.otp || ""} onChange={(e) => setForm({ ...form, otp: e.target.value })} />
                </div>
                <div className="mb-3">
                  <input className="form-control" placeholder="New password (minimum 8 characters)" type="password" value={form.newPassword || ""} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
                </div>
              </>
            )}
            <button className="btn btn-primary w-100" onClick={resetOtpSent ? confirmAdminPasswordReset : requestAdminPasswordResetOtp}>
              {resetOtpSent ? "Reset Password" : "Send Reset OTP"}
            </button>
            {resetOtpSent && <button className="btn btn-link w-100 mt-2" onClick={requestAdminPasswordResetOtp}>Resend OTP</button>}
            <button className="btn btn-link w-100 mt-2" onClick={() => { setResetMode(false); setResetOtpSent(false); setError(""); setMessage(""); }}>Back to sign in</button>
          </>
        ) : adminOnly && loginMethod === "otp" ? (
          <>
            <div className="mb-3">
              <input
                className="form-control"
                placeholder="Registered email address"
                type="email"
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            {otpSent && (
              <div className="mb-3">
                <input
                  className="form-control"
                  placeholder="6-digit OTP"
                  inputMode="numeric"
                  maxLength="6"
                  value={form.otp || ""}
                  onChange={(e) => setForm({ ...form, otp: e.target.value })}
                />
              </div>
            )}
            <button className="btn btn-primary w-100" onClick={otpSent ? verifyAdminOtp : requestAdminOtp}>
              {otpSent ? "Verify OTP and Sign In" : "Send OTP"}
            </button>
            {otpSent && (
              <button className="btn btn-link w-100 mt-2" onClick={requestAdminOtp}>
                Resend OTP
              </button>
            )}
          </>
        ) : (
          <>
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
            {adminOnly && (
              <button className="btn btn-link w-100 mt-2" onClick={() => { setResetMode(true); setError(""); setMessage(""); }}>
                Forgot admin password?
              </button>
            )}
          </>
        )}

        {error && <p className="text-danger mt-3 mb-0">{error}</p>}
        {message && <p className="text-success mt-3 mb-0">{message}</p>}

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
