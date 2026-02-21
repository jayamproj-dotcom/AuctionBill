import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Eye, EyeOff } from "lucide-react";
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { adminLogin } from '../../api/adminApi';
import './SaaSAdmin.css';

const SaaSLogin = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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

                console.log(response);


                if (response.status) {
                    toast.success(response.message || "Login successful");
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('saas_admin_token', 'true');

                    try {
                        const decoded = jwtDecode(response.token);
                        localStorage.setItem('saas_role', decoded.role || 'admin');
                    } catch (decodeError) {
                        console.error("Token decoding failed", decodeError);
                        localStorage.setItem('saas_role', 'admin');
                    }

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
