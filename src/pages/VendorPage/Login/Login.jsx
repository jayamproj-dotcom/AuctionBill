import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setVendorAuthData } from "../../../redux/slices/vendorAuthSlice";
import { mainVendorLogin } from "../../../api/mainVendorApi";
import { vendorLogin } from "../../../api/vendorApi";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { Eye, EyeOff, Loader, Lock, Mail, User, Building2 } from "lucide-react";
import "./Login.css";

const VendorLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loginType, setLoginType] = useState("main"); // 'main' or 'branch'
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState({
    identifier: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (
      sessionStorage.getItem("vendorLoggedIn") === "true" ||
      localStorage.getItem("vendorLoggedIn") === "true"
    ) {
      navigate("/mainvendor");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    setError("");
  };

  const handleTypeChange = (type) => {
    setLoginType(type);
    setError("");
    setCredentials({ identifier: "", password: "" });
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
      let res;
      if (loginType === "main") {
        res = await mainVendorLogin({ email: identifier, password });
      } else {
        // For branch, password field actually contains Branch ID
        res = await vendorLogin({ email: identifier, branchId: password });
      }

      console.log("res", res);

      if (res.status && res.token) {
        dispatch(setVendorAuthData(res));
        if (loginType === "main") {
          navigate("/mainvendor");
        } else {
          navigate("/vendor/dashboard"); // Assuming vendor dashboard path
        }
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
      const name = decoded.name || "Main Vendor";
      const picture = decoded.picture || "";

      dispatch(
        setVendorAuthData({
          user: {
            email: email,
            name: name,
            profilePic: picture,
            _id: "google-auth-placeholder",
          },
          token: "google-auth-placeholder",
        }),
      );

      const allowedEmails =
        JSON.parse(localStorage.getItem("vendor_allowed_emails")) || [];

      if (!allowedEmails.includes(email)) {
        localStorage.setItem(
          "vendor_allowed_emails",
          JSON.stringify([...allowedEmails, email]),
        );
      }

      navigate("/mainvendor");
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
      <div className="login-top-right"></div>
      <div className="login-card">
        <h2>{loginType === "main" ? "Main Vendor Login" : "Branch Login"}</h2>
        <p className="login-subtitle">
          {loginType === "main"
            ? "Sign in to manage your branches and auctions"
            : "Sign in to access your branch dashboard"}
        </p>

        {/* Login Type Toggle */}
        <div className="login-type-toggle">
          <button
            className={`type-btn ${loginType === "main" ? "active" : ""}`}
            onClick={() => handleTypeChange("main")}
          >
            <User size={16} />
            Main Vendor
          </button>
          <button
            className={`type-btn ${loginType === "branch" ? "active" : ""}`}
            onClick={() => handleTypeChange("branch")}
          >
            <Building2 size={16} />
            Branch
          </button>
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleManualLogin} className="login-form">
          <div className="form-group">
            <label>
              {loginType === "main" ? "Email Address" : "Branch Email"}
            </label>
            <div className="input-container">
              <Mail size={18} className="input-icon" />
              <input
                type="text"
                name="identifier"
                value={credentials.identifier}
                onChange={handleChange}
                placeholder={
                  loginType === "main"
                    ? "Enter email address"
                    : "Enter branch email"
                }
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>{loginType === "main" ? "Password" : "Branch ID"}</label>
            <div className="password-input-wrapper">
              <Lock size={18} className="saas-input-icon" />
              <input
                type={
                  loginType === "main" && !showPassword ? "password" : "text"
                }
                name="password"
                value={credentials.password}
                onChange={handleChange}
                placeholder={
                  loginType === "main" ? "Enter password" : "Enter branch ID"
                }
                required
              />
              {loginType === "main" && (
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              )}
            </div>
          </div>

          <div className="login-options">
            {loginType === "main" && (
              <Link to="/forgot-password" className="forgot-pwd-link">
                Forgot Password?
              </Link>
            )}
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader className="saas-spinner login-spinner" size={18} />{" "}
                Signing In...
              </>
            ) : (
              "Login"
            )}
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
            Don't have an account?{" "}
            <Link to="/signup" className="signup-link">
              Request Main Vendor Access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorLogin;
