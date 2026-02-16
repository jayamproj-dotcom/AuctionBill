import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (localStorage.getItem("adminLoggedIn") === "true") {
      navigate("/admin");
    }
  }, [navigate]);
  const [error, setError] = useState('');

  const handleGoogleSuccess = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const email = decoded.email.toLowerCase();
      const name = decoded.name || 'Admin';
      const picture = decoded.picture || '';

      // Allow ANY user to login (No restrictions)
      localStorage.setItem("adminLoggedIn", "true");
      localStorage.setItem("adminUserEmail", email);
      localStorage.setItem("adminUserName", name);
      localStorage.setItem("adminUserPhoto", picture);
      
      // Optionally, we can still track used emails if needed, but no blocking condition.
      const allowedEmails = JSON.parse(localStorage.getItem('admin_allowed_emails')) || [];
      if (!allowedEmails.includes(email)) {
          localStorage.setItem('admin_allowed_emails', JSON.stringify([...allowedEmails, email]));
      }

      navigate("/admin");
    } catch (err) {
      console.error(err);
      setError("Failed to process login token.");
    }
  };

  const handleGoogleFailure = () => {
    setError("Google Login Failed. Please try again.");
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2>Admin Login</h2>
        <p style={{ marginBottom: '2rem' }}>Sign in to continue to the dashboard</p>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleFailure}
            theme="filled_blue"
            size="large"
            text="signin_with"
            shape="rectangular"
          />
        </div>

        {error && (
            <div className="error-msg" style={{ 
                margin: '0 auto 1.5rem auto', 
                maxWidth: '300px', 
                padding: '10px', 
                backgroundColor: '#fee2e2', 
                color: '#ef4444', 
                borderRadius: '6px',
                fontSize: '0.9rem'
            }}>
                {error}
            </div>
        )}

        <div style={{ marginTop: 'auto', borderTop: '1px solid #f3f4f6', paddingTop: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            System Administrator? <Link to="/saas-admin" style={{ color: '#4f46e5', fontWeight: '600', textDecoration: 'none' }}>Go to SaaS Panel</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
