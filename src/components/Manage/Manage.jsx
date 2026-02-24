import { useState, useEffect } from 'react';
import './Manage.css';
import { User, Mail, Phone, MapPin, Save, Camera, Lock, Loader, X, Eye, EyeOff } from 'lucide-react';
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

    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showForgetPassword, setShowForgetPassword] = useState(false);
    const [cpForm, setCpForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [fpForm, setFpForm] = useState({ email: '', otp: '', newPassword: '', confirmPassword: '' });
    const [fpStep, setFpStep] = useState(1);

    const [showCPCurrent, setShowCPCurrent] = useState(false);
    const [showCPNew, setShowCPNew] = useState(false);
    const [showCPConfirm, setShowCPConfirm] = useState(false);
    const [showFPNew, setShowFPNew] = useState(false);
    const [showFPConfirm, setShowFPConfirm] = useState(false);

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

    const handleChangePasswordSubmit = (e) => {
        e.preventDefault();
        if (!cpForm.currentPassword) {
            toast.error("Please enter current password", { position: "top-right", autoClose: 3000 });
            return;
        }
        if (cpForm.newPassword !== cpForm.confirmPassword) {
            toast.error("Passwords do not match", { position: "top-right", autoClose: 3000 });
            return;
        }
        if (!cpForm.newPassword) {
            toast.error("Password cannot be empty", { position: "top-right", autoClose: 3000 });
            return;
        }
        toast.success("Password changed successfully! (Static)", { position: "top-right", autoClose: 3000 });
        setShowChangePassword(false);
        setCpForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    };

    const handleSendOTP = () => {
        if (!fpForm.email) {
            toast.error("Please enter email first", { position: "top-right", autoClose: 3000 });
            return;
        }
        toast.success("OTP sent securely to your email! (Static)", { position: "top-right", autoClose: 3000 });
        setFpStep(2);
    };

    const handleForgetPasswordSubmit = (e) => {
        e.preventDefault();
        if (fpStep === 1) {
            handleSendOTP();
            return;
        }
        if (fpStep === 2) {
            if (!fpForm.otp) {
                toast.error("Please enter OTP", { position: "top-right", autoClose: 3000 });
                return;
            }
            toast.success("OTP Verified Successfully! (Static)", { position: "top-right", autoClose: 3000 });
            setFpStep(3);
            return;
        }
        if (fpStep === 3) {
            if (!fpForm.newPassword || fpForm.newPassword !== fpForm.confirmPassword) {
                toast.error("Passwords do not match or are empty", { position: "top-right", autoClose: 3000 });
                return;
            }
            toast.success("Password reset successfully! (Static)", { position: "top-right", autoClose: 3000 });
            setShowForgetPassword(false);
            setFpForm({ email: '', otp: '', newPassword: '', confirmPassword: '' });
            setFpStep(1);
        }
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

                        <div className="password-links">
                            <span className="password-link" onClick={() => setShowChangePassword(true)}>
                                Change Password
                            </span>
                            <span className="password-link" onClick={() => {
                                setShowForgetPassword(true);
                                setFpStep(1);
                                setFpForm({ email: profile.email || '', otp: '', newPassword: '', confirmPassword: '' });
                            }}>
                                Forget Password
                            </span>
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

            {/* Change Password Modal */}
            {showChangePassword && (
                <div className="modal-overlay">
                    <div className="modal-content relative">
                        <button className="modal-close" onClick={() => setShowChangePassword(false)}>
                            <X size={24} />
                        </button>
                        <h2 className="modal-title">Change Password</h2>
                        <form onSubmit={handleChangePasswordSubmit}>
                            <div className="form-group manage-form-group">
                                <label className="manage-label">Current Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showCPCurrent ? "text" : "password"}
                                        className="saas-input manage-input manage-input-enabled px-3"
                                        style={{ paddingLeft: '15px', paddingRight: '40px' }}
                                        placeholder="Enter current password"
                                        value={cpForm.currentPassword}
                                        onChange={(e) => setCpForm({...cpForm, currentPassword: e.target.value})}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCPCurrent(!showCPCurrent)}
                                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0 }}
                                    >
                                        {showCPCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group manage-form-group">
                                <label className="manage-label">New Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showCPNew ? "text" : "password"}
                                        className="saas-input manage-input manage-input-enabled px-3"
                                        style={{ paddingLeft: '15px', paddingRight: '40px' }}
                                        placeholder="Enter new password"
                                        value={cpForm.newPassword}
                                        onChange={(e) => setCpForm({...cpForm, newPassword: e.target.value})}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCPNew(!showCPNew)}
                                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0 }}
                                    >
                                        {showCPNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group manage-form-group">
                                <label className="manage-label">Confirm Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showCPConfirm ? "text" : "password"}
                                        className="saas-input manage-input manage-input-enabled px-3"
                                        style={{ paddingLeft: '15px', paddingRight: '40px' }}
                                        placeholder="Confirm new password"
                                        value={cpForm.confirmPassword}
                                        onChange={(e) => setCpForm({...cpForm, confirmPassword: e.target.value})}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCPConfirm(!showCPConfirm)}
                                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0 }}
                                    >
                                        {showCPConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary w-full mt-4" style={{ width: '100%', padding: '10px' }}>
                                Change Password
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Forget Password Modal */}
            {showForgetPassword && (
                <div className="modal-overlay">
                    <div className="modal-content relative">
                        <button className="modal-close" onClick={() => setShowForgetPassword(false)}>
                            <X size={24} />
                        </button>
                        <h2 className="modal-title">Forget Password</h2>
                        <form onSubmit={handleForgetPasswordSubmit}>
                            <div className="form-group manage-form-group">
                                <label className="manage-label">Email</label>
                                <div className={fpStep === 1 ? "otp-wrapper" : ""}>
                                    <input
                                        type="email"
                                        className="saas-input manage-input manage-input-enabled px-3 otp-input"
                                        style={{ paddingLeft: '15px' }}
                                        placeholder="Enter your email"
                                        value={fpForm.email}
                                        onChange={(e) => setFpForm({...fpForm, email: e.target.value})}
                                        disabled={fpStep !== 1}
                                    />
                                    {fpStep === 1 && (
                                        <button type="button" className="send-otp-btn" onClick={handleSendOTP}>
                                            Send OTP
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {(fpStep === 2 || fpStep === 3) && (
                                <div className="form-group manage-form-group">
                                    <label className="manage-label">Enter OTP</label>
                                    <input
                                        type="text"
                                        className="saas-input manage-input manage-input-enabled px-3"
                                        style={{ paddingLeft: '15px' }}
                                        placeholder="Enter OTP received on email"
                                        value={fpForm.otp}
                                        onChange={(e) => setFpForm({...fpForm, otp: e.target.value})}
                                        disabled={fpStep === 3}
                                    />
                                </div>
                            )}

                            {fpStep === 2 && (
                                <button type="submit" className="btn btn-primary w-full mt-4" style={{ width: '100%', padding: '10px' }}>
                                    Verify OTP
                                </button>
                            )}

                            {fpStep === 3 && (
                                <>
                                    <div className="form-group manage-form-group">
                                        <label className="manage-label">New Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showFPNew ? "text" : "password"}
                                                className="saas-input manage-input manage-input-enabled px-3"
                                                style={{ paddingLeft: '15px', paddingRight: '40px' }}
                                                placeholder="Enter new password"
                                                value={fpForm.newPassword}
                                                onChange={(e) => setFpForm({...fpForm, newPassword: e.target.value})}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowFPNew(!showFPNew)}
                                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0 }}
                                            >
                                                {showFPNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="form-group manage-form-group">
                                        <label className="manage-label">Confirm Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showFPConfirm ? "text" : "password"}
                                                className="saas-input manage-input manage-input-enabled px-3"
                                                style={{ paddingLeft: '15px', paddingRight: '40px' }}
                                                placeholder="Confirm new password"
                                                value={fpForm.confirmPassword}
                                                onChange={(e) => setFpForm({...fpForm, confirmPassword: e.target.value})}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowFPConfirm(!showFPConfirm)}
                                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0 }}
                                            >
                                                {showFPConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary w-full mt-4" style={{ width: '100%', padding: '10px' }}>
                                        Reset Password
                                    </button>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Manage;
