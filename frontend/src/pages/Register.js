import React, { useState } from "react";
import API from "../api";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

function Register({ presetRole = null, title = "Create Account" }) {
  const [form, setForm] = useState({ role: presetRole || "" });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    setError("");
    try {
      const payload = new FormData();
      payload.append("username", form.username || "");
      payload.append("email", form.email || "");
      payload.append("phone", form.phone || "");
      payload.append("password", form.password || "");
      payload.append("role", presetRole || form.role || "");
      if ((presetRole || form.role) === "doctor") {
        payload.append("bio", form.bio || "");
        if (profilePhoto) {
          payload.append("profile_photo", profilePhoto);
        }
      }

      await API.post("accounts/register/", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if ((presetRole || form.role) === "doctor") {
        alert("Doctor registered successfully. Please wait for admin approval and verification before login.");
      } else {
        alert("Registered Successfully. Please login.");
      }
      navigate((presetRole || form.role) === "doctor" ? "/doctor-login" : "/owner-login");
    } catch (err) {
      setError(err?.response?.data?.role?.[0] || "Registration failed. Check all fields and try again.");
    }
  };

  return (
    <div className="register-shell">
      <div className="register-card">
        <div className="d-flex justify-content-between mb-3">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
            Back
          </button>
          <Link className="btn btn-outline-primary btn-sm" to="/">
            Home Page
          </Link>
        </div>
        <h2>{title}</h2>

        <div className="form-group">
          <input className="form-control"
            placeholder="Username"
            onChange={(e)=>setForm({...form, username:e.target.value})}/>
          
          <input className="form-control"
            placeholder="Email Address"
            type="email"
            onChange={(e)=>setForm({...form, email:e.target.value})}/>
          
          <input className="form-control"
            placeholder="Phone Number"
            onChange={(e)=>setForm({...form, phone:e.target.value})}/>
          
          <input className="form-control"
            placeholder="Password"
            type="password"
            onChange={(e)=>setForm({...form, password:e.target.value})}/>
          
          {!presetRole && (
            <select className="form-control"
              value={form.role || ""}
              onChange={(e)=>setForm({...form, role:e.target.value})}>
              <option value="">Select Your Role</option>
              <option value="owner">Pet Owner</option>
              <option value="doctor">Veterinary Doctor</option>
            </select>
          )}
        </div>

        {(presetRole || form.role) === "doctor" && (
          <div className="doctor-extra-fields border-top pt-3 mt-2">
            <p className="small text-start fw-bold mb-2">Doctor Profile Information</p>
            <textarea
              className="form-control"
              placeholder="Tell us about your experience (Bio)"
              rows={3}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
            <label className="small ms-1 text-muted">Upload Professional Photo</label>
            <input
              className="form-control mt-1"
              type="file"
              accept="image/*"
              onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
            />
          </div>
        )}

        <button className="btn btn-success w-100 mt-2" onClick={handleRegister}>
          Complete Registration
        </button>

        {error && <p className="text-danger mt-3">{error}</p>}
        
        <div className="mt-4 border-top pt-3">
          <p>
            Already have an account?{" "}
            <Link to={(presetRole || form.role) === "doctor" ? "/doctor-login" : "/owner-login"}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
