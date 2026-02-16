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

            <div className="content-body" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="card">
                    <div className="profile-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '2rem' }}>
                        <div className="profile-image-container" style={{ position: 'relative', marginBottom: '1rem' }}>
                            <img 
                                src={profile.photo || "https://via.placeholder.com/150"} 
                                alt="Profile" 
                                referrerPolicy="no-referrer"
                                style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #f3f4f6' }}
                                onError={(e) => {e.target.src = "https://via.placeholder.com/150"}}
                            />
                            <label htmlFor="photo-upload" style={{ 
                                position: 'absolute', 
                                bottom: '5px', 
                                right: '5px', 
                                backgroundColor: '#4f46e5', 
                                color: 'white', 
                                padding: '8px', 
                                borderRadius: '50%', 
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
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
                                    style={{ display: 'none' }} 
                                />
                            </label>
                        </div>
                        <h2 style={{ margin: 0 }}>{profile.name || 'Admin User'}</h2>
                        <p style={{ color: '#6b7280', margin: '5px 0 0 0' }}>{profile.email}</p>
                    </div>

                    <div className="profile-form">
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={profile.name} 
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="saas-input"
                                    style={{ width: '100%', paddingLeft: '40px', backgroundColor: !isEditing ? '#f9fafb' : 'white', cursor: !isEditing ? 'default' : 'text' }}
                                    placeholder="Enter your name"
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={profile.email} 
                                    disabled
                                    className="saas-input"
                                    style={{ width: '100%', paddingLeft: '40px', backgroundColor: '#f9fafb', cursor: 'not-allowed', color: '#6b7280' }}
                                />
                                <span style={{position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', fontSize:'10px', color:'#9ca3af', background:'#f3f4f6', padding:'2px 6px', borderRadius:'4px'}}>Managed by Google</span>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>Phone Number</label>
                            <div style={{ position: 'relative' }}>
                                <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                <input 
                                    type="tel" 
                                    name="phone" 
                                    value={profile.phone} 
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="saas-input"
                                    style={{ width: '100%', paddingLeft: '40px', backgroundColor: !isEditing ? '#f9fafb' : 'white', cursor: !isEditing ? 'default' : 'text' }}
                                    placeholder="Enter phone number"
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>Address</label>
                            <div style={{ position: 'relative' }}>
                                <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '15px', color: '#9ca3af' }} />
                                <textarea 
                                    name="address" 
                                    value={profile.address} 
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="saas-input"
                                    style={{ width: '100%', paddingLeft: '40px', minHeight: '100px', paddingTop: '12px', backgroundColor: !isEditing ? '#f9fafb' : 'white', cursor: !isEditing ? 'default' : 'text' }}
                                    placeholder="Enter your address"
                                />
                            </div>
                        </div>

                        {/* Password Management Section - Only show when editing? Or always show but disabled? Let's hide it when not editing to keep profile clean */}
                        {isEditing && (
                        <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>Security Settings</h3>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>Set Login Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                    <input 
                                        type="password" 
                                        name="password" 
                                        value={profile.password || ''} 
                                        onChange={handleChange}
                                        className="saas-input"
                                        style={{ width: '100%', paddingLeft: '40px' }}
                                        placeholder="Set a password for email login"
                                    />
                                </div>
                                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' }}>
                                    (Leave blank to keep current password)
                                </p>
                            </div>
                        </div>
                        )}

                        <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            {!isEditing ? (
                                <button className="btn btn-primary" onClick={() => setIsEditing(true)} style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <User size={18} />
                                    Edit Profile
                                </button>
                            ) : (
                                <>
                                    <button className="btn btn-outline" onClick={() => {setIsEditing(false); window.location.reload();}} style={{ padding: '10px 24px' }}>
                                        Cancel
                                    </button>
                                    <button className="btn btn-primary" onClick={handleSave} style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
