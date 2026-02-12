import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Eye, EyeOff } from "lucide-react";
import "./Login.css"

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    const storedCreds = JSON.parse(localStorage.getItem('adminCredentials')) || {
      username: 'admin',
      password: 'admin@123'
    };

    if (!form.username.trim()) {
      newErrors.username = "Username is required";
    } else if (form.username !== storedCreds.username) {
      newErrors.username = "Invalid username";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password !== storedCreds.password) {
      newErrors.password = "Invalid password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validate()) {
      localStorage.setItem("adminLoggedIn", "true");
      navigate("/admin");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Admin Login</h2>
        <p>Please sign in to continue</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>Username</label>
            <div className="input-container">
              <User size={18} className="input-icon" />
              <input
                type="text"
                name="username"
                placeholder="Enter username"
                value={form.username}
                onChange={handleChange}
                className={errors.username ? "input-error" : ""}
              />
            </div>
            {errors.username && <span className="error-msg">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-container">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
                className={errors.password ? "input-error" : ""}
                style={{ paddingLeft: '12px', paddingRight: '40px' }} // Override specific padding for password
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="error-msg">{errors.password}</span>}
          </div>

          <button type="submit" className="btn btn-primary">
            Login
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: '#666' }}>
            System Administrator? <Link to="/saas-admin" style={{ color: '#6366f1', fontWeight: '600', textDecoration: 'none' }}>Go to SaaS Panel</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
