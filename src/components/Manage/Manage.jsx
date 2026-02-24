import { useState, useEffect } from 'react';
import './Manage.css';
import { User, Mail, Phone, MapPin, Save, Camera, Lock, Loader } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { updateVendorProfileData } from '../../redux/slices/vendorAuthSlice';
import { updateVendorProfile } from '../../api/vendorApi';
import { toast } from 'react-toastify';
import userPlaceholder from '../../assets/images/user.png';
import { resolveImageUrl } from '../../utils/imageUtils';

function Manage() {
    const dispatch = useDispatch();
    const {
        vendorUserName,
        vendorUserEmail,
        vendorUserPhoto,
        vendorUserPhone,
        vendorUserAddress,
        vendorId
    } = useSelector((state) => state.vendorAuth);

    const [profile, setProfile] = useState({
        name: vendorUserName || '',
        email: vendorUserEmail || '',
        phone: vendorUserPhone || '',
        address: vendorUserAddress || '',
        photo: vendorUserPhoto || '',
        password: ''
    });

    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [profilePicFile, setProfilePicFile] = useState(null);

    // Sync local state with redux when redux store changes
    useEffect(() => {
        setProfile(prev => ({
            ...prev,
            name: vendorUserName || '',
            email: vendorUserEmail || '',
            phone: vendorUserPhone || '',
            address: vendorUserAddress || '',
            photo: vendorUserPhoto || ''
        }));
    }, [vendorUserName, vendorUserEmail, vendorUserPhoto, vendorUserPhone, vendorUserAddress]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        if (!vendorId) {
            toast.error("Vendor ID not found. Please log in again.");
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', profile.name);
            formData.append('phone', profile.phone);
            formData.append('address', profile.address);
            
            if (profile.password) {
                formData.append('password', profile.password);
            }
            if (profilePicFile) {
                formData.append('profilePic', profilePicFile);
            }

            const res = await updateVendorProfile(vendorId, formData);

            if (res.status) {
                dispatch(updateVendorProfileData({
                    name: res.vendor?.name || profile.name,
                    photo: res.vendor?.profilePic || profile.photo,
                    phone: res.vendor?.phone || profile.phone,
                    address: res.vendor?.address || profile.address
                }));
                toast.success('Profile updated successfully!');
                setIsEditing(false);
                setProfilePicFile(null);
            } else {
                toast.error(res.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            toast.error(error.message || 'Error updating profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setProfilePicFile(null);
        // Reset to Redux state
        setProfile(prev => ({
            ...prev,
            name: vendorUserName || '',
            email: vendorUserEmail || '',
            phone: vendorUserPhone || '',
            address: vendorUserAddress || '',
            photo: vendorUserPhoto || '',
            password: ''
        }));
    };

    return (
        <div className="manage-container fade-in">
            <div className="content-header">
                <div className="header-top">
                    <h1>Your Profile</h1>
                </div>
                <div className="breadcrumb">
                    <span>Vendor</span>
                    <span className="separator">/</span>
                    <span className="current">Profile</span>
                </div>
            </div>

            <div className="content-body manage-content">
                <div className="card">
                    <div className="profile-header">
                        <div className="profile-image-container">
                            <img
                                src={resolveImageUrl(profile.photo, userPlaceholder)}
                                alt="Profile"
                                referrerPolicy="no-referrer"
                                className="profile-img"
                                onError={(e) => { e.target.src = userPlaceholder }}
                            />
                            {isEditing && (
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
                                                    toast.warning("Image size too large. Please choose an image under 500KB.");
                                                    return;
                                                }
                                                setProfilePicFile(file);
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
                            )}
                        </div>
                        <h2 className="profile-name">{profile.name || 'Vendor User'}</h2>
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

                      

                        <div className="form-actions">
                            {!isEditing ? (
                                <button className="btn btn-primary edit-btn" onClick={() => setIsEditing(true)}>
                                    <User size={18} />
                                    Edit Profile
                                </button>
                            ) : (
                                <>
                                    <button className="btn btn-outline cancel-btn" onClick={handleCancel} disabled={isLoading}>
                                        Cancel
                                    </button>
                                    <button className="btn btn-primary save-btn" onClick={handleSave} disabled={isLoading}>
                                        {isLoading ? (
                                            <><Loader size={18} className="animate-spin" /> Saving...</>
                                        ) : (
                                            <><Save size={18} /> Save Profile</>
                                        )}
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
