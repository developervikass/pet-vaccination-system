import React, { useEffect, useState } from "react";
import API from "../api";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [pets, setPets] = useState([]);
  const [reminderLogs, setReminderLogs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [adminForm, setAdminForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [adminCreateMessage, setAdminCreateMessage] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, petsRes, reminderLogsRes] = await Promise.all([
        API.get("accounts/all/"),
        API.get("pets/all/"),
        API.get("pets/reminder-logs/"),
      ]);
      setUsers(usersRes.data);
      setPets(petsRes.data);
      setReminderLogs(reminderLogsRes.data);
    } catch (err) {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("user_id")) {
      loadDashboard();
    }
  }, []);

  const deleteUser = async (id) => {
    setError("");
    setMessage("");
    try {
      await API.delete(`accounts/delete/${id}/`);
      setMessage("User deleted successfully.");
      loadDashboard();
    } catch (err) {
      setError("Failed to delete user.");
    }
  };

  const setDoctorVerification = async (id, approved) => {
    setError("");
    setMessage("");
    try {
      await API.patch(`accounts/doctors/${id}/verify/`, { approved });
      setMessage(approved ? "Doctor approved and verified." : "Doctor marked pending.");
      loadDashboard();
    } catch (err) {
      setError("Failed to update doctor verification.");
    }
  };

  const toggleUserActive = async (id, isActive, isDoctor = false) => {
    setError("");
    setMessage("");
    try {
      await API.patch(`accounts/users/${id}/active/`, { is_active: !isActive });
      if (isDoctor) {
        setMessage(!isActive ? "Doctor moved to pending." : "Doctor discarded.");
      } else {
        setMessage(!isActive ? "User activated." : "User deactivated.");
      }
      loadDashboard();
    } catch (err) {
      setError("Failed to update user status.");
    }
  };

  const createAdmin = async () => {
    setError("");
    setAdminCreateMessage("");
    try {
      await API.post("accounts/admins/create/", adminForm);
      setAdminCreateMessage("Admin account created.");
      setAdminForm({ username: "", email: "", phone: "", password: "" });
      loadDashboard();
    } catch (err) {
      const data = err?.response?.data || {};
      const firstFieldError =
        data.username?.[0] || data.email?.[0] || data.phone?.[0] || data.password?.[0];
      setError(firstFieldError || data.message || "Failed to create admin account.");
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="container mt-4 dashboard-wrap">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Admin Dashboard</h2>
        <button className="btn btn-outline-secondary" onClick={logout}>Logout</button>
      </div>
      {error && <p className="text-danger">{error}</p>}
      {message && <p className="text-success">{message}</p>}
      {loading && <p>Loading dashboard...</p>}

      <div className="card p-3 mb-4">
        <h5 className="mb-3">Create Admin</h5>
        <div className="row g-2">
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Username"
              value={adminForm.username}
              onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
            />
          </div>
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Email"
              value={adminForm.email}
              onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <input
              className="form-control"
              placeholder="Phone"
              value={adminForm.phone}
              onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <input
              className="form-control"
              placeholder="Password"
              type="password"
              value={adminForm.password}
              onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
            />
          </div>
          <div className="col-md-2 d-grid">
            <button className="btn btn-primary" onClick={createAdmin}>
              Create Admin
            </button>
          </div>
        </div>
        {adminCreateMessage && <p className="text-success mb-0 mt-2">{adminCreateMessage}</p>}
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Doctor Verify</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user=>(
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                {user.role === "doctor"
                  ? `${user.doctor_status.charAt(0).toUpperCase()}${user.doctor_status.slice(1)}`
                  : user.is_active
                    ? "Active"
                    : "Inactive"}
              </td>
              <td>
                {user.role === "doctor" ? (
                  user.doctor_approved && user.doctor_verified ? "Verified" : "Pending"
                ) : (
                  "-"
                )}
              </td>
              <td className="d-flex gap-2">
                {user.role === "doctor" && (
                  user.doctor_approved && user.doctor_verified ? (
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => setDoctorVerification(user.id, false)}
                    >
                      Mark Pending
                    </button>
                  ) : (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => setDoctorVerification(user.id, true)}
                    >
                      Approve + Verify
                    </button>
                  )
                )}
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() =>
                    toggleUserActive(
                      user.id,
                      user.role === "doctor" ? user.doctor_status === "discarded" : user.is_active,
                      user.role === "doctor"
                    )
                  }
                >
                  {user.role === "doctor"
                    ? user.doctor_status === "discarded"
                      ? "Activate"
                      : "Discard"
                    : user.is_active
                      ? "Deactivate"
                      : "Activate"}
                </button>
                <button className="btn btn-danger btn-sm"
                  onClick={()=>deleteUser(user.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4 className="mt-4">All Pets</h4>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Name</th>
            <th>Breed</th>
            <th>Age</th>
            <th>Owner ID</th>
          </tr>
        </thead>
        <tbody>
          {pets.map((pet) => (
            <tr key={pet.id}>
              <td>{pet.name}</td>
              <td>{pet.breed}</td>
              <td>{pet.age}</td>
              <td>{pet.owner}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4 className="mt-4">Reminder Logs</h4>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Pet</th>
            <th>Owner Email</th>
            <th>Doctor</th>
            <th>Next Vaccination</th>
            <th>Reminder Sent</th>
            <th>Sent At</th>
          </tr>
        </thead>
        <tbody>
          {reminderLogs.length === 0 && (
            <tr>
              <td colSpan={6}>No reminder logs found yet.</td>
            </tr>
          )}
          {reminderLogs.map((log) => (
            <tr key={log.id}>
              <td>{log.pet_name}</td>
              <td>{log.owner_email || "-"}</td>
              <td>{log.doctor_username}</td>
              <td>{log.next_vaccination_at ? new Date(log.next_vaccination_at).toLocaleString() : "-"}</td>
              <td>{log.reminder_sent ? "Yes" : "No"}</td>
              <td>{log.reminder_sent_at ? new Date(log.reminder_sent_at).toLocaleString() : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;
