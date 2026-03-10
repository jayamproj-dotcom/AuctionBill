import React, { useState } from "react";
import { User, Mail, Phone, MapPin, Save } from "lucide-react";

function Profile() {
  const [profile, setProfile] = useState({
    name: "Main Vendor",
    email: "mainVendor@example.com",
    phone: "123-456-7890",
    address: "123 Main Street",
    city: "City Name",
    state: "State Name"
  });

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Static - just show alert
    alert("Profile updated successfully!");
  };

  return (
    <div className="profile">
      <div className="content-header">
        <div className="header-top">
          <h1>Profile Management</h1>
        </div>
        <div className="breadcrumb">
          <span>Main Vendor</span>
          <span className="breadcrumb-separator">></span>
          <span>Profile</span>
        </div>
      </div>

      <div className="content-body">
        <div className="data-card">
          <div className="data-card-header">
            <div>
              <div className="data-card-title">Personal Information</div>
              <div className="data-card-subtitle">Update your profile details</div>
            </div>
            <User size={24} />
          </div>
          <div className="data-card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    <User size={16} /> Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={profile.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Mail size={16} /> Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={profile.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Phone size={16} /> Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    value={profile.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <MapPin size={16} /> Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    className="form-control"
                    value={profile.address}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    name="city"
                    className="form-control"
                    value={profile.city}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    name="state"
                    className="form-control"
                    value={profile.state}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="data-card-footer">
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
