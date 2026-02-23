import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Eye, EyeOff } from "lucide-react";
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { useDispatch } from 'react-redux';
import { adminLogin } from '../../api/adminApi';
import { setSaasAuthData } from '../../redux/slices/saasAuthSlice';
import './SaaSAdmin.css';

const SaaSLogin = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials({ ...credentials, [name]: value });

        // Clear error as user types
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!credentials.username.trim()) {
            newErrors.username = "Username is required";
        }

        if (!credentials.password) {
            newErrors.password = "Password is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (validate()) {
            setLoading(true);
            try {

                const response = await adminLogin({
                    username: credentials.username.trim(),
                    password: credentials.password
                });


                if (response.status) {
                    toast.success(response.message || "Login successful");
                    
                    const authData = {
                        adminToken: response.token,
                        isAdmin: true,
                        adminData: response.data,
                    };

                    sessionStorage.setItem('admin_token', response.token);
                    sessionStorage.setItem('is_admin', 'true');
                    sessionStorage.setItem('admin_data', JSON.stringify(response.data));

                    if (response.data && response.data.username) {
                        sessionStorage.setItem('saas_admin_name', response.data.username);
                        authData.saasAdminName = response.data.username;
                    }

                    try {
                        const decoded = jwtDecode(response.token);
                        const role = response.data?.role || decoded.role || 'admin';
                        sessionStorage.setItem('saas_role', role);
                        authData.saasRole = role;
                    } catch (decodeError) {
                        console.error("Token decoding failed", decodeError);
                        const role = response.data?.role || 'admin';
                        sessionStorage.setItem('saas_role', role);
                        authData.saasRole = role;
                    }

                    if (response.data && response.data.permissions) {
                        sessionStorage.setItem('saas_permissions', JSON.stringify(response.data.permissions));
                        authData.saasPermissions = response.data.permissions;
                    }

                    // Remove existing local storage variables to avoid conflict
                    localStorage.removeItem('admin_token');
                    localStorage.removeItem('is_admin');
                    localStorage.removeItem('admin_data');
                    localStorage.removeItem('saas_admin_name');
                    localStorage.removeItem('saas_admin_photo');
                    localStorage.removeItem('saas_role');
                    localStorage.removeItem('saas_permissions');

                    dispatch(setSaasAuthData(authData));


                    navigate('/saas/dashboard');
                } else {
                    toast.error(response.message || "Login failed");
                }
            } catch (error) {
                toast.error(error.message || "Invalid credentials or server error");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="saas-login-container">
            <div className="saas-login-card fade-in">
                <div className="saas-login-header">
                    <p className="saas-subtitle">Super Admin Access</p>
                </div>

                <form onSubmit={handleLogin} className="saas-login-form" noValidate>
                    <div className="saas-form-group">
                        <label className="saas-label">Username</label>
                        <div className="saas-input-container">
                            <User size={18} className="saas-input-icon" />
                            <input
                                type="text"
                                name="username"
                                className={`saas-input saas-input-with-icon ${errors.username ? 'input-error' : ''}`}
                                value={credentials.username}
                                onChange={handleChange}
                                placeholder="Enter admin username"
                                disabled={loading}
                            />
                        </div>
                        {errors.username && <span className="error-msg">{errors.username}</span>}
                    </div>

                    <div className="saas-form-group">
                        <label className="saas-label">Password</label>
                        <div className="saas-input-container">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                className={`saas-input saas-input-with-toggle ${errors.password ? 'input-error' : ''}`}
                                value={credentials.password}
                                onChange={handleChange}
                                placeholder="Enter admin password"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="saas-password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex="-1"
                                disabled={loading}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.password && <span className="error-msg">{errors.password}</span>}
                    </div>

                    <button type="submit" className="saas-btn btn-primary saas-login-btn" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login to Dashboard'}
                    </button>

                    <div className="saas-login-footer">
                        <a href="/auctionbilling/" className="saas-link">Back to Main App</a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SaaSLogin;
