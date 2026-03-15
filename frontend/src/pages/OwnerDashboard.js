import React, { useState, useEffect } from "react";
import API from "../api";
import { Link } from "react-router-dom";
import "./OwnerDashboard.css";

function OwnerDashboard() {
  const [pets, setPets] = useState([]);
  const [petData, setPetData] = useState({ name: "", age: "", breed: "", vaccination_date: "" });
  const [photoFile, setPhotoFile] = useState(null);
  const [mustResetPassword, setMustResetPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const loadPets = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("pets/my/");
      setPets(res.data);
    } catch (err) {
      setError("Unable to load pets. Please login again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    API.get("accounts/me/")
      .then((res) => {
        const required = Boolean(res.data.force_password_reset);
        setMustResetPassword(required);
        localStorage.setItem("force_password_reset", String(required));
        if (!required) {
          loadPets();
        }
      })
      .catch(() => {
        setError("Unable to load account details. Please login again.");
      });
  }, []);

  const resetTemporaryPassword = async () => {
    setError("");
    setSuccess("");
    try {
      const res = await API.post("accounts/first-login-reset/", passwordForm);
      setSuccess(res.data.message || "Password updated successfully.");
      setMustResetPassword(false);
      localStorage.setItem("force_password_reset", "false");
      setPasswordForm({ current_password: "", new_password: "" });
      loadPets();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update password.");
    }
  };

  const addPet = async () => {
    setError("");
    setSuccess("");
    if (!petData.age || Number(petData.age) <= 0) {
      setError("Age must be greater than 0.");
      return;
    }
    const formData = new FormData();
    formData.append("name", petData.name);
    formData.append("age", petData.age);
    formData.append("breed", petData.breed);
    formData.append("vaccination_date", petData.vaccination_date);
    if (photoFile) {
      formData.append("profile_photo", photoFile);
    }

    try {
      await API.post("pets/add/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("Pet added successfully.");
      setPetData({ name: "", age: "", breed: "", vaccination_date: "" });
      setPhotoFile(null);
      loadPets();
    } catch (err) {
      setError("Failed to add pet. Fill all fields correctly.");
    }
  };

  const deletePet = async (id) => {
    setError("");
    setSuccess("");
    try {
      await API.delete(`pets/delete/${id}/`);
      setSuccess("Pet deleted successfully.");
      loadPets();
    } catch (err) {
      setError("Failed to delete pet.");
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="owner-dashboard">
      <div className="container">
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-5 dashboard-header mt-4">
          <h2 className="mb-0">Owner Dashboard</h2>
          <button className="btn btn-outline-danger px-4 rounded-pill fw-bold" onClick={logout}>
            Logout
          </button>
        </div>

        {mustResetPassword ? (
          <div className="owner-panel mb-5">
            <h5>Reset Temporary Password</h5>
            <p className="text-muted mb-3">
              Your account was created by a doctor. Set a new password to continue.
            </p>
            <div className="owner-form-grid">
              <div>
                <label className="form-label">Current Temporary Password</label>
                <input
                  className="form-control owner-input"
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">New Password</label>
                <input
                  className="form-control owner-input"
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                />
              </div>
            </div>
            <button className="btn btn-primary mt-4 px-5 fw-bold rounded-pill" onClick={resetTemporaryPassword}>
              Update Password
            </button>
            {error && <div className="text-danger mt-2">{error}</div>}
            {success && <div className="text-success mt-2">{success}</div>}
          </div>
        ) : (
        <>
        {/* Add Pet Section */}
        <div className="owner-panel mb-5">
          <h5>🐾 Register a New Pet</h5>
          <div className="owner-form-grid">
            <div>
              <label className="form-label">Pet Name</label>
              <input
                className="form-control owner-input"
                placeholder="e.g. Bruno"
                value={petData.name}
                onChange={(e)=>setPetData({...petData, name:e.target.value})}
              />
            </div>
            <div>
              <label className="form-label">Age (Years)</label>
              <input
                className="form-control owner-input"
                placeholder="e.g. 2"
                type="number"
                step="0.1"
                min="0.1"
                value={petData.age}
                onChange={(e)=>setPetData({...petData, age:e.target.value})}
              />
            </div>
            <div>
              <label className="form-label">Breed</label>
              <input
                className="form-control owner-input"
                placeholder="e.g. German Shepherd"
                value={petData.breed}
                onChange={(e)=>setPetData({...petData, breed:e.target.value})}
              />
            </div>
            <div>
              <label className="form-label">Last Vaccination</label>
              <input
                className="form-control owner-input"
                type="date"
                value={petData.vaccination_date}
                onChange={(e)=>setPetData({...petData, vaccination_date:e.target.value})}
              />
            </div>
            <div className="owner-file-field">
              <label className="form-label">Pet Photo</label>
              <input
                className="form-control owner-input"
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <button className="btn btn-primary mt-4 px-5 fw-bold rounded-pill" onClick={addPet}>
            Add Pet
          </button>
          
          {error && <div className="text-danger">{error}</div>}
          {success && <div className="text-success">{success}</div>}
        </div>

        {/* Pet List Section */}
        <div className="owner-panel">
          <h5 className="mb-4">🐕 Your Furry Family</h5>
          {loading && <p className="text-center text-muted">Refreshing list...</p>}
          
          <div className="owner-pet-list">
            {!loading && pets.length === 0 && (
              <div className="text-center py-5 border rounded-4 bg-light">
                <p className="text-muted mb-0">No pets registered yet. Start by adding one above!</p>
              </div>
            )}
            
            {pets.map((pet) => (
              <div key={pet.id} className="owner-pet-item">
                <div className="owner-pet-info">
                  <div className="owner-pet-name">{pet.name}</div>
                  <div className="owner-pet-meta">
                    <span className="badge me-2">{pet.breed}</span>
                    <span className="badge">{pet.age} Years</span>
                  </div>
                </div>
                
                <div className="owner-pet-actions">
                  <Link className="btn btn-outline-primary btn-sm" to={`/pets/${pet.id}`}>
                    View Profile
                  </Link>
                  <button className="btn btn-outline-danger btn-sm" onClick={() => deletePet(pet.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}

export default OwnerDashboard;
