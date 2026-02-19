import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Eye, EyeOff } from "lucide-react";
import './SaaSAdmin.css';

const SaaSLogin = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
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
        const ADMIN_USER = "admin";
        const DEFAULT_ADMIN_PASS = "admin@123";
        const SUBADMIN_USER = "subadmin";
        const DEFAULT_SUBADMIN_PASS = "subadmin@123";

        const storedAdminPass = localStorage.getItem('saas_admin_password') || DEFAULT_ADMIN_PASS;
        const storedSubadminPass = localStorage.getItem('saas_subadmin_password') || DEFAULT_SUBADMIN_PASS;

        if (!credentials.username.trim()) {
            newErrors.username = "Username is required";
        } else if (credentials.username.trim() !== ADMIN_USER && credentials.username.trim() !== SUBADMIN_USER) {
            newErrors.username = "Invalid username";
        }

        if (!credentials.password) {
            newErrors.password = "Password is required";
        } else {
             if (credentials.username.trim() === ADMIN_USER && credentials.password.trim() !== storedAdminPass) {
                 newErrors.password = "Invalid password";
             } else if (credentials.username.trim() === SUBADMIN_USER && credentials.password.trim() !== storedSubadminPass) {
                 newErrors.password = "Invalid password";
             }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = (e) => {
        e.preventDefault();

        if (validate()) {
            const role = credentials.username.trim() === 'subadmin' ? 'subadmin' : 'admin';
            localStorage.setItem('saas_admin_token', 'true');
            localStorage.setItem('saas_role', role);
            navigate('/saas/dashboard');
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
                            />
                            <button
                                type="button"
                                className="saas-password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex="-1"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.password && <span className="error-msg">{errors.password}</span>}
                    </div>

                    <button type="submit" className="saas-btn btn-primary saas-login-btn">
                        Login to Dashboard
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
