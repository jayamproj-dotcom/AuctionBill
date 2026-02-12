import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css"

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check credentials from localStorage or use defaults
    const storedCreds = JSON.parse(localStorage.getItem('adminCredentials')) || {
      username: 'admin',
      password: 'admin@123'
    };

    if (form.username === storedCreds.username && form.password === storedCreds.password) {
      localStorage.setItem("adminLoggedIn", "true");
      navigate("/admin");
    } else {
      alert("Invalid username or password");
    }
  };
  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Admin Login</h2>
        <p>Please sign in to continue</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              placeholder="Enter username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Login
          </button>
        </form>
        
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: '#666' }}>
            System Administrator? <a href="/saas-admin" style={{ color: '#6366f1', fontWeight: '600', textDecoration: 'none' }}>Go to SaaS Panel</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
