import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
// import './Signup.css';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        address: ''
    });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const validate = () => {
        if (!formData.username || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword || !formData.address) {
            return "All fields are required";
        }

        // Basic Email validation
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            return "Invalid email address";
        }

        // Basic Phone validation (10 digits)
        if (!/^\d{10}$/.test(formData.phone)) {
            return "Phone number must be 10 digits";
        }

        if (formData.password !== formData.confirmPassword) {
            return "Passwords do not match";
        }

        return null;
    };

    const handleSignup = (e) => {
        e.preventDefault();

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        const existingUsers = JSON.parse(localStorage.getItem('vendor_users')) || [];

        // Check for duplicate email
        if (existingUsers.some(u => u.email.toLowerCase() === formData.email.toLowerCase())) {
            setError("Email already registered");
            return;
        }

        // Check for duplicate phone
        if (existingUsers.some(u => u.phone === formData.phone)) {
            setError("Phone number already registered");
            return;
        }

        // Check for duplicate username
        if (existingUsers.some(u => u.username.toLowerCase() === formData.username.toLowerCase())) {
            setError("Username already taken");
            return;
        }

        const newUser = {
            id: Date.now(),
            username: formData.username,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            address: formData.address
        };

        const updatedUsers = [...existingUsers, newUser];
        localStorage.setItem('vendor_users', JSON.stringify(updatedUsers));

        // Auto Login after successful signup
        localStorage.setItem("vendorLoggedIn", "true");
        localStorage.setItem("vendorUserEmail", newUser.email);
        localStorage.setItem("vendorUserName", newUser.username);
        localStorage.setItem("vendorUserPhoto", "");

        alert("Account created successfully! Logging you in...");
        navigate('/vendor');
    };

    return (
        <div className="signup-page">
            <div className="signup-card">
                <h2>Create Account</h2>
                <p className="signup-subtitle">Join us to manage your auctions</p>

                <form onSubmit={handleSignup} className="signup-form">
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Choose a username"
                        />
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="form-group">
                        <label>Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="10-digit mobile number"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create a password"
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

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm your password"
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Address</label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Your full address"
                            rows="3"
                        ></textarea>
                    </div>

                    {error && <div className="error-msg">{error}</div>}

                    <button type="submit" className="btn btn-primary signup-btn">Sign Up</button>

                    <div className="signup-footer">
                        <p>Already have an account? <Link to="/" className="link">Login here</Link></p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;
