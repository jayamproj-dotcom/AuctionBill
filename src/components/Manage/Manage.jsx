import { useState, useEffect } from 'react';
import './Manage.css';
import { User, Mail, Phone, MapPin, Save, Camera, Lock } from 'lucide-react';

function Manage() {
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        photo: ''
    });

    const [isEditing, setIsEditing] = useState(false);
    
    // Load data on mount
    useEffect(() => {
        const name = localStorage.getItem('adminUserName') || '';
        const email = localStorage.getItem('adminUserEmail') || '';
        const photo = localStorage.getItem('adminUserPhoto') || '';
        const phone = localStorage.getItem('adminUserPhone') || '';
        const address = localStorage.getItem('adminUserAddress') || '';

        setProfile({ name, email, photo, phone, address });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = () => {
        localStorage.setItem('adminUserName', profile.name);
        localStorage.setItem('adminUserPhoto', profile.photo);
        localStorage.setItem('adminUserPhone', profile.phone);
        localStorage.setItem('adminUserAddress', profile.address);
        
        alert('Profile updated! Page will reload to update header.');
        window.location.reload(); 
    };

    return (
        <div className="manage-container fade-in">
            <div className="content-header">
                <div className="header-top">
                    <h1>Your Profile</h1>
                </div>
                <div className="breadcrumb">
                    <span>Admin</span>
                    <span className="separator">/</span>
                    <span className="current">Profile</span>
                </div>
            </div>

            <div className="content-body manage-content">
                <div className="card">
                    <div className="profile-header">
                        <div className="profile-image-container">
                            <img 
                                src={profile.photo || "https://via.placeholder.com/150"} 
                                alt="Profile" 
                                referrerPolicy="no-referrer"
                                className="profile-img"
                                onError={(e) => {e.target.src = "https://via.placeholder.com/150"}}
                            />
                            <label htmlFor="photo-upload" className="profile-upload-label">
                                <Camera size={18} />
                                <input 
                                    id="photo-upload" 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            if (file.size > 500000) { // Limit to 500KB
                                                alert("Image size too large. Please choose an image under 500KB.");
                                                return;
                                            }
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setProfile(prev => ({ ...prev, photo: reader.result }));
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    className="profile-upload-input" 
                                />
                            </label>
                        </div>
                        <h2 className="profile-name">{profile.name || 'Admin User'}</h2>
                        <p className="profile-email">{profile.email}</p>
                    </div>

                    <div className="profile-form">
                        <div className="form-group manage-form-group">
                            <label className="manage-label">Full Name</label>
                            <div className="input-icon-wrapper">
                                <User size={18} className="input-icon" />
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={profile.name} 
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`saas-input manage-input ${!isEditing ? 'manage-input-disabled' : 'manage-input-enabled'}`}
                                    placeholder="Enter your name"
                                />
                            </div>
                        </div>

                        <div className="form-group manage-form-group">
                            <label className="manage-label">Email Address</label>
                            <div className="input-icon-wrapper">
                                <Mail size={18} className="input-icon" />
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={profile.email} 
                                    disabled
                                    className="saas-input manage-input manage-input-disabled"
                                />
                                <span className="google-managed-badge">Managed by Google</span>
                            </div>
                        </div>

                        <div className="form-group manage-form-group">
                            <label className="manage-label">Phone Number</label>
                            <div className="input-icon-wrapper">
                                <Phone size={18} className="input-icon" />
                                <input 
                                    type="tel" 
                                    name="phone" 
                                    value={profile.phone} 
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`saas-input manage-input ${!isEditing ? 'manage-input-disabled' : 'manage-input-enabled'}`}
                                    placeholder="Enter phone number"
                                />
                            </div>
                        </div>

                        <div className="form-group manage-form-group">
                            <label className="manage-label">Address</label>
                            <div className="input-icon-wrapper">
                                <MapPin size={18} className="input-icon-map" />
                                <textarea 
                                    name="address" 
                                    value={profile.address} 
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`saas-input manage-textarea ${!isEditing ? 'manage-input-disabled' : 'manage-input-enabled'}`}
                                    placeholder="Enter your address"
                                />
                            </div>
                        </div>

                        {/* Password Management Section - Only show when editing? Or always show but disabled? Let's hide it when not editing to keep profile clean */}
                        {isEditing && (
                        <div className="security-section">
                            <h3 className="security-title">Security Settings</h3>
                            <div className="form-group">
                                <label className="manage-label">Set Login Password</label>
                                <div className="input-icon-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input 
                                        type="password" 
                                        name="password" 
                                        value={profile.password || ''} 
                                        onChange={handleChange}
                                        className="saas-input manage-input"
                                        placeholder="Set a password for email login"
                                    />
                                </div>
                                <p className="password-hint">
                                    (Leave blank to keep current password)
                                </p>
                            </div>
                        </div>
                        )}

                        <div className="form-actions">
                            {!isEditing ? (
                                <button className="btn btn-primary edit-btn" onClick={() => setIsEditing(true)}>
                                    <User size={18} />
                                    Edit Profile
                                </button>
                            ) : (
                                <>
                                    <button className="btn btn-outline cancel-btn" onClick={() => {setIsEditing(false); window.location.reload();}}>
                                        Cancel
                                    </button>
                                    <button className="btn btn-primary save-btn" onClick={handleSave}>
                                        <Save size={18} />
                                        Save Profile
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Manage;
