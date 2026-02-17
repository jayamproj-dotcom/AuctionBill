import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    if (localStorage.getItem("adminLoggedIn") === "true") {
      navigate("/admin");
    }
  }, [navigate]);

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
      <div className="login-card">
        <h2>Admin Login</h2>
        <p className="login-subtitle">
          Sign in to continue to the dashboard
        </p>

        <div className="google-btn-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleFailure}
            theme="filled_blue"
            size="large"
            text="signin_with"
            shape="rectangular"
          />
        </div>

        {error && <div className="error-msg">{error}</div>}

        <div className="login-footer">
          <p>
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
