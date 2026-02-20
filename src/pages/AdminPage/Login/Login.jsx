import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { Eye, EyeOff } from "lucide-react";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("adminLoggedIn") === "true") {
      navigate("ventor");
    }
  }, [navigate]);

  const handleChange = (e) => {
      setCredentials({ ...credentials, [e.target.name]: e.target.value });
      setError("");
  };

  const handleManualLogin = (e) => {
      e.preventDefault();
      const { identifier, password } = credentials;

      if (!identifier || !password) {
          setError("Please enter both username/phone and password");
          return;
      }

      const users = JSON.parse(localStorage.getItem('admin_users')) || [];
      const user = users.find(u => 
          (u.username === identifier || u.phone === identifier || u.email === identifier.toLowerCase()) && 
          u.password === password
      );

      if (user) {
          localStorage.setItem("adminLoggedIn", "true");
          localStorage.setItem("adminUserEmail", user.email);
          localStorage.setItem("adminUserName", user.username);
          localStorage.setItem("adminUserPhoto", ""); // No photo for manual login
          navigate("/ventor");
      } else {
          setError("Invalid credentials. Please check your username/phone and password.");
      }
  };

  // ... (rest of Google login logic remains same)

  const handleGoogleSuccess = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const email = decoded.email.toLowerCase();
      const name = decoded.name || "Admin";
      const picture = decoded.picture || "";

      localStorage.setItem("adminLoggedIn", "true");
      localStorage.setItem("adminUserEmail", email);
      localStorage.setItem("adminUserName", name);
      localStorage.setItem("adminUserPhoto", picture);

      const allowedEmails =
        JSON.parse(localStorage.getItem("admin_allowed_emails")) || [];

      if (!allowedEmails.includes(email)) {
        localStorage.setItem(
          "admin_allowed_emails",
          JSON.stringify([...allowedEmails, email])
        );
      }

      navigate("/ventor");
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
      <div className="login-card">
        <h2>Admin Login</h2>
        <p className="login-subtitle">
          Sign in to continue to the dashboard
        </p>

        {/* Manual Login Form */}
        <form onSubmit={handleManualLogin} className="login-form">
            <div className="form-group">
                <label>Username or Phone</label>
                <input 
                    type="text" 
                    name="identifier" 
                    value={credentials.identifier} 
                    onChange={handleChange} 
                    placeholder="Enter username or mobile number"
                />
            </div>
            
            <div className="form-group">
                <label>Password</label>
                <div className="password-input-wrapper">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        name="password" 
                        value={credentials.password} 
                        onChange={handleChange} 
                        placeholder="Enter password"
                    />
                    <button 
                        type="button" 
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>

            {error && <div className="error-msg">{error}</div>}

            <button type="submit" className="btn btn-primary login-btn">Login</button>
        </form>


        <div className="divider">
            <span>OR</span>
        </div>

        <div className="google-btn-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleFailure}
            theme="filled_blue"
            size="large"
            text="signin_with"
            shape="rectangular"
            width="100%"
          />
        </div>

        <div className="login-footer">
            <p className="signup-link-text">
                Don't have an account? <Link to="/signup" className="link">Sign Up</Link>
            </p>
            <p className="saas-link-wrapper">
                System Administrator?{" "}
                <Link to="/saas-admin" className="saas-link">
                Go to SaaS Panel
                </Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
