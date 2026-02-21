import React, { useEffect, useState } from "react";
import API from "../api";
import { Link } from "react-router-dom";
import "./DoctorDashboard.css";

function DoctorDashboard() {
  const [pets, setPets] = useState([]);
  const [phoneSearch, setPhoneSearch] = useState("");
  const userId = localStorage.getItem("user_id");
  const [doctorStatus, setDoctorStatus] = useState("");
  const [doctorProfile, setDoctorProfile] = useState({ username: "", bio: "", profile_photo_url: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const statusLabel = doctorStatus
    ? `${doctorStatus.charAt(0).toUpperCase()}${doctorStatus.slice(1)}`
    : "Loading...";
    
  const statusBadgeClass =
    doctorStatus === "approved"
      ? "badge-approved"
      : doctorStatus === "pending"
        ? "badge-pending"
        : "badge-rejected";

  const loadPets = async (phone = "") => {
    setLoading(true);
    setError("");
    try {
      const endpoint = phone ? `pets/all/?phone=${encodeURIComponent(phone)}` : "pets/all/";
      const res = await API.get(endpoint);
      setPets(res.data);
    } catch (err) {
      setError("Unable to load pets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      API.get("accounts/me/")
        .then((res) => {
          const status = res.data.doctor_status || "pending";
          setDoctorStatus(status);
          setDoctorProfile({
            username: res.data.username || "",
            bio: res.data.bio || "",
            profile_photo_url: res.data.profile_photo_url || "",
          });
          if (status === "approved") {
            loadPets();
          } else {
            setPets([]);
          }
        })
        .catch(() => {
          setError("Unable to load doctor status.");
        });
    }
  }, [userId]);

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="dashboard-wrap">
      <div className="container">
        {/* Top Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-800 text-dark mb-0">Doctor Dashboard</h2>
          <button className="btn btn-outline-danger rounded-pill px-4 fw-bold" onClick={logout}>
            Logout
          </button>
        </div>

        {/* Doctor Identity Card */}
        <div className="doctor-main-card mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-4">
            <div className="d-flex align-items-center gap-3">
              <img
                src={doctorProfile.profile_photo_url || "https://via.placeholder.com/80?text=Dr"}
                alt={doctorProfile.username || "Doctor"}
                className="doctor-profile-avatar"
              />
              <div className="doctor-info-section">
                <h5>Dr. {doctorProfile.username || "Doctor"}</h5>
                {doctorProfile.bio && <p className="mb-2 text-muted small">{doctorProfile.bio}</p>}
                <div className="d-flex align-items-center gap-2">
                  <span className="status-label-text">Status:</span>
                  <span className={`badge ${statusBadgeClass} px-3 py-2 rounded-pill`}>{statusLabel}</span>
                </div>
              </div>
            </div>
            
            <div className="text-md-end">
              <p className="text-muted small mb-0 max-width-300">
                Only approved doctors can access medical records and submit summaries.
              </p>
            </div>
          </div>
        </div>

        {/* Search & Table Section */}
        <div className="table-card">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <h5 className="fw-bold mb-0">Pet Registry</h5>
            
            <div className="d-flex gap-2">
              <input
                className="form-control form-control-sm"
                placeholder="Owner phone..."
                style={{width: '200px'}}
                value={phoneSearch}
                disabled={doctorStatus !== "approved"}
                onChange={(e) => setPhoneSearch(e.target.value)}
              />
              <button className="btn btn-primary btn-sm" disabled={doctorStatus !== "approved"} onClick={() => loadPets(phoneSearch)}>
                Search
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={doctorStatus !== "approved"}
                onClick={() => {
                  setPhoneSearch("");
                  loadPets("");
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {doctorStatus !== "approved" ? (
            <div className="text-center py-5 bg-light rounded-4">
              <p className="text-warning fw-bold mb-1">Account Pending Approval</p>
              <p className="text-muted small mb-0">Please wait for the administrator to verify your credentials.</p>
            </div>
          ) : (
            <>
              {error && <div className="alert alert-danger rounded-3">{error}</div>}
              {loading ? (
                <div className="text-center py-4"><p className="text-muted">Loading pets...</p></div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Pet Name</th>
                        <th>Breed</th>
                        <th>Age</th>
                        <th>Owner</th>
                        <th>Phone</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pets.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-muted">No pets found matching your criteria.</td>
                        </tr>
                      ) : (
                        pets.map((pet) => (
                          <tr key={pet.id}>
                            <td className="fw-bold">{pet.name}</td>
                            <td><span className="badge bg-light text-dark">{pet.breed}</span></td>
                            <td>{pet.age} Years</td>
                            <td>{pet.owner_username || pet.owner}</td>
                            <td>{pet.owner_phone || "-"}</td>
                            <td>
                              <Link className="btn btn-outline-primary btn-sm px-3 rounded-pill" to={`/pets/${pet.id}`}>
                                View Details
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorDashboard;