import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SaaSAdmin.css';

const SaaSLogin = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        setError('');
    };

    const handleLogin = (e) => {
        e.preventDefault();
        
        // Hardcoded credentials for SaaS Admin
        const ADMIN_USER = "admin";
        const ADMIN_PASS = "admin@123";

        if (credentials.username === ADMIN_USER && credentials.password === ADMIN_PASS) {
            localStorage.setItem('saas_admin_token', 'true');
            navigate('/saas/dashboard');
        } else {
            setError('Invalid username or password');
        }
    };

    return (
        <div className="saas-login-container">
            <div className="saas-login-card fade-in">
                <div className="saas-login-header">
                  
                    <p className="saas-subtitle">Super Admin Access</p>
                </div>

                <form onSubmit={handleLogin} className="saas-login-form">
                    <div className="saas-form-group">
                        <label className="saas-label">Username</label>
                        <input
                            type="text"
                            name="username"
                            className="saas-input"
                            value={credentials.username}
                            onChange={handleChange}
                            placeholder="Enter admin username"
                            required
                        />
                    </div>

                    <div className="saas-form-group">
                        <label className="saas-label">Password</label>
                        <input
                            type="password"
                            name="password"
                            className="saas-input"
                            value={credentials.password}
                            onChange={handleChange}
                            placeholder="Enter admin password"
                            required
                        />
                    </div>

                    {error && <div className="saas-error-message">{error}</div>}

                    <button type="submit" className="saas-btn btn-primary saas-login-btn">
                        Login to Dashboard
                    </button>
                    
                    <div className="saas-login-footer">
                        <a href="/" className="saas-link">Back to Main App</a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SaaSLogin;
