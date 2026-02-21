import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [role, setRole] = useState("owner");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const sendOtp = async () => {
    setError("");
    setMessage("");
    try {
      const res = await API.post("accounts/forgot-password/", { email, role });
      setMessage(res.data.message);
      setStep(2);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send OTP.");
    }
  };

  const resetPassword = async () => {
    setError("");
    setMessage("");
    try {
      const res = await API.post("accounts/reset-password/", {
        email,
        role,
        otp,
        new_password: newPassword,
      });
      setMessage(res.data.message);
      setStep(3);
    } catch (err) {
      setError(err?.response?.data?.message || "Password reset failed.");
    }
  };

  return (
    <div className="forgot-shell">
      <div className="forgot-card">
        <div className="d-flex justify-content-between mb-3">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
            Back
          </button>
          <Link className="btn btn-outline-primary btn-sm" to="/">
            Home Page
          </Link>
        </div>
        <h2>Reset Password</h2>
        <p className="text-muted">Enter your registered email to receive a secure OTP code.</p>

        <div className="form-group">
          <label className="small fw-bold text-muted ms-1 mb-1 d-block">Account Type</label>
          <select
            className="form-control"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={step >= 2}
          >
            <option value="owner">Pet Owner</option>
            <option value="doctor">Doctor</option>
          </select>

          <input
            className="form-control"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={step >= 2}
          />
        </div>

        {step >= 2 && (
          <div className="otp-fields border-top pt-3 mt-2">
            <input
              className="form-control"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <input
              className="form-control"
              placeholder="Enter New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
        )}

        {step === 1 && (
          <button className="btn btn-primary w-100 mt-2" onClick={sendOtp}>
            Send Reset Code
          </button>
        )}
        {step === 2 && (
          <button className="btn btn-success w-100 mt-2" onClick={resetPassword}>
            Verify & Update Password
          </button>
        )}

        {message && <p className="text-success mt-3 mb-0">{message}</p>}
        {error && <p className="text-danger mt-3 mb-0">{error}</p>}

        <p className="back-link">
          Remembered your password? <Link to={role === "doctor" ? "/doctor-login" : "/owner-login"}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
