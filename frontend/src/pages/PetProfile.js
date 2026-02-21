import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../api";
import "./PetProfile.css";

function normalizeDateTimeForApi(value) {
  if (!value) return "";
  return `${value}T09:00:00`;
}

function PetProfile() {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [newSummary, setNewSummary] = useState({ summary: "", next_vaccination_at: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const role = localStorage.getItem("role");
  const todayDate = new Date().toISOString().split("T")[0];

  const loadPet = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get(`pets/detail/${id}/`);
      setPet(res.data);
    } catch (err) {
      setError("Unable to load pet profile.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPet();
  }, [loadPet]);

  const handleAddSummary = async () => {
    setError("");
    setSuccess("");
    const trimmedSummary = newSummary.summary.trim();
    if (!trimmedSummary) {
      setError("Doctor summary is required.");
      return;
    }
    if (!newSummary.next_vaccination_at) {
      setError("Vaccination Date is required.");
      return;
    }

    const formattedVaccinationAt = normalizeDateTimeForApi(newSummary.next_vaccination_at);
    try {
      await API.post("pets/summary/", {
        pet: Number(id),
        summary: trimmedSummary,
        next_vaccination_at: formattedVaccinationAt,
      });
      setSuccess("Summary and next vaccination date added.");
      setNewSummary({ summary: "", next_vaccination_at: "" });
      loadPet();
    } catch (err) {
      const nextDateError = err?.response?.data?.next_vaccination_at?.[0];
      const summaryError = err?.response?.data?.summary?.[0];
      setError(nextDateError || summaryError || "Failed to add summary.");
    }
  };

  const backPath = role === "doctor" ? "/doctor" : role === "admin" ? "/admin" : "/owner";

  return (
    <div className="pet-profile-wrap">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-800 mb-0">Pet Profile</h2>
          <Link className="btn btn-outline-secondary rounded-pill px-4" to={backPath}>
            &larr; Back
          </Link>
        </div>

        {loading && <div className="text-center py-5"><p className="text-muted">Loading your pet's records...</p></div>}
        {error && <div className="alert alert-danger rounded-4">{error}</div>}
        {success && <div className="alert alert-success rounded-4">{success}</div>}

        {!loading && pet && (
          <>
            {/* Main Info Card */}
            <div className="pet-main-card">
              <div className="row g-4 align-items-center">
                <div className="col-md-4 col-lg-3">
                  <div className="pet-image-container">
                    {pet.profile_photo_url ? (
                      <img src={pet.profile_photo_url} alt={pet.name} />
                    ) : (
                      <div className="h-100 d-flex align-items-center justify-content-center bg-light text-muted">
                        No Photo
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-8 col-lg-9 pet-info-header">
                  <h4>{pet.name}</h4>
                  <div className="pet-detail-grid">
                    <div className="detail-pill">
                      <span className="detail-label">Breed</span>
                      <span className="detail-value">{pet.breed}</span>
                    </div>
                    <div className="detail-pill">
                      <span className="detail-label">Age</span>
                      <span className="detail-value">{pet.age} Years</span>
                    </div>
                    <div className="detail-pill">
                      <span className="detail-label">Last Vaccination</span>
                      <span className="detail-value">{pet.vaccination_date}</span>
                    </div>
                    <div className="detail-pill">
                      <span className="detail-label">Owner</span>
                      <span className="detail-value">{pet.owner_username || pet.owner}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summaries List */}
            <div className="pet-summary-card">
              <h5 className="mb-4">📋 Medical History & Doctor Summaries</h5>
              {pet.summaries && pet.summaries.length > 0 ? (
                <div className="list-group list-group-flush">
                  {pet.summaries.map((item) => (
                    <div key={item.id} className="pet-summary-item border shadow-sm">
                      <div className="d-flex justify-content-between">
                        <span className="fw-bold text-primary">Dr. {item.doctor_username || item.doctor}</span>
                        <small className="text-muted">
                          {new Date(item.created_at).toLocaleDateString()}
                        </small>
                      </div>
                      <div className="mt-2 text-dark">{item.summary}</div>
                      {item.next_vaccination_at && (
                        <div className="next-vac-badge">
                          🗓️ Next Vaccination: {new Date(item.next_vaccination_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-muted border rounded-4 bg-light">No medical summaries recorded yet.</p>
              )}
            </div>

            {/* Doctor Form Section */}
            {role === "doctor" && (
              <div className="pet-add-summary-card">
                <h5 className="mb-4 text-success">✍️ Add New Medical Summary</h5>
                <div className="mb-3">
                  <label className="form-label">Diagnosis & Suggestions</label>
                  <textarea
                    className="form-control"
                    placeholder="Provide details about the check-up, diet, or behavior suggestions..."
                    rows={4}
                    value={newSummary.summary}
                    onChange={(e) => {
                      setError("");
                      setSuccess("");
                      setNewSummary({ ...newSummary, summary: e.target.value });
                    }}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label">Set Next Vaccination Date</label>
                  <input
                    className="form-control"
                    type="date"
                    min={todayDate}
                    value={newSummary.next_vaccination_at}
                    onChange={(e) => {
                      setError("");
                      setSuccess("");
                      setNewSummary({ ...newSummary, next_vaccination_at: e.target.value });
                    }}
                  />
                </div>
                <button className="btn btn-success px-5 rounded-pill shadow-sm" onClick={handleAddSummary}>
                  Submit Record
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PetProfile;
