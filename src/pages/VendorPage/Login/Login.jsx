import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setVendorAuthData } from "../../../redux/slices/vendorAuthSlice";
import { vendorLogin } from "../../../api/vendorApi";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { Eye, EyeOff, Loader,Lock,User } from "lucide-react";
import "./Login.css";


const VendorLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("vendorLoggedIn") === "true" || localStorage.getItem("vendorLoggedIn") === "true") {
      navigate("/vendor");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    setError("");
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    const { identifier, password } = credentials;

    if (!identifier || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await vendorLogin({ email: identifier, password });

      console.log("res", res);

      if (res.status && res.token) {
        dispatch(setVendorAuthData(res));
        navigate("/vendor");
      } else {
        setError(res.message || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // ... (rest of Google login logic remains same)

  const handleGoogleSuccess = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const email = decoded.email.toLowerCase();
      const name = decoded.name || "Vendor";
      const picture = decoded.picture || "";

      dispatch(setVendorAuthData({
        user: {
          email: email,
          name: name,
          profilePic: picture,
          _id: "google-auth-placeholder"
        },
        token: "google-auth-placeholder",
      }));

      const allowedEmails =
        JSON.parse(localStorage.getItem("vendor_allowed_emails")) || [];

      if (!allowedEmails.includes(email)) {
        localStorage.setItem(
          "vendor_allowed_emails",
          JSON.stringify([...allowedEmails, email])
        );
      }

      navigate("/vendor");
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
      <div className="login-top-right">

      </div>
      <div className="login-card">
        <h2>Vendor Login</h2>
        <p className="login-subtitle">
          Sign in to continue to the dashboard
        </p>

        {/* Manual Login Form */}
        <form onSubmit={handleManualLogin} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-container">
              <User size={18} className="input-icon" />
              <input
                type="text"
                name="identifier"
                value={credentials.identifier}
                onChange={handleChange}
                placeholder="Enter email address"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
               <Lock size={18} className="saas-input-icon" />
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

          <div className="login-options">
            <Link to="/forgot-password" className="forgot-pwd-link">
              Forgot Password?
            </Link>
          </div>

          {error && <div className="error-msg">{error}</div>}


          <button type="submit" className="btn btn-primary login-btn" disabled={isLoading}>
            {isLoading ? <><Loader className="saas-spinner login-spinner" size={18} /> Signing In...</> : "Login"}
          </button>
        </form>


        {/* <div className="divider">
            <span>OR</span>
        </div> */}

        {/* <div className="google-btn-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleFailure}
            theme="filled_blue"
            size="large"
            text="signin_with"
            shape="rectangular"
            width="100%"
          />
        </div> */}

        <div className="login-footer">
          <p className="signup-link-text">
            Don't have an account? <Link to="/signup" className="signup-link">Request Access</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorLogin;
