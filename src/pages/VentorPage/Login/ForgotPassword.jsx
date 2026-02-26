import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { forgotPassword, resetPassword } from "../../../api/vendorApi";
import { Eye, EyeOff, Loader, ArrowLeft, Mail, ShieldCheck, Lock } from "lucide-react";
import "../../SaaSAdmin/SaaSAdmin.css";

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        otp: "",
        newPassword: "",
        confirmPassword: ""
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
        setMessage("");
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!formData.email) {
            setError("Please enter your email address");
            return;
        }

        setIsLoading(true);
        setError("");
        try {
            const res = await forgotPassword({ email: formData.email });
            if (res.status) {
                setMessage(res.message || "OTP sent to your email.");
                setStep(2);
            } else {
                setError(res.message || "Failed to send OTP.");
            }
        } catch (err) {
            setError(err.message || "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        const { email, otp, newPassword, confirmPassword } = formData;

        if (!otp || !newPassword || !confirmPassword) {
            setError("Please fill in all fields");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);
        setError("");
        try {
            const res = await resetPassword({ email, otp, newPassword });
            if (res.status) {
                setMessage("Password reset successfully! Redirecting to login...");
                setTimeout(() => {
                    navigate("/");
                }, 3000);
            } else {
                setError(res.message || "Failed to reset password.");
            }
        } catch (err) {
            setError(err.message || "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="saas-login-container">
            <div className="saas-login-card fade-in">
                <Link to="/" className="saas-link" style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px' }}>
                    <ArrowLeft size={16} /> Back to Login
                </Link>

                <div className="saas-login-header">
                    <h2 style={{ color: '#333', fontSize: '24px', fontWeight: 'bold' }}>Forgot Password</h2>
                    <p className="saas-subtitle">
                        {step === 1
                            ? "Enter your email to receive a password reset OTP"
                            : "Enter the OTP sent to your email and set a new password"}
                    </p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleSendOTP} className="saas-login-form">
                        <div className="saas-form-group">
                            <label className="saas-label">Email Address</label>
                            <div className="saas-input-container">
                                <Mail size={18} className="saas-input-icon" />
                                <input
                                    type="email"
                                    name="email"
                                    className="saas-input saas-input-with-icon"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>

                        {error && <div className="error-msg" style={{ color: '#e74c3c', marginBottom: '15px' }}>{error}</div>}
                        {message && <div className="success-msg" style={{ color: '#27ae60', marginBottom: '15px' }}>{message}</div>}

                        <button type="submit" className="saas-btn btn-primary saas-login-btn" disabled={isLoading}>
                            {isLoading ? <><Loader className="saas-spinner" size={18} /> Sending...</> : "Send OTP"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="saas-login-form">
                        <div className="saas-form-group">
                            <label className="saas-label">OTP</label>
                            <div className="saas-input-container">
                                <ShieldCheck size={18} className="saas-input-icon" />
                                <input
                                    type="text"
                                    name="otp"
                                    className="saas-input saas-input-with-icon"
                                    value={formData.otp}
                                    onChange={handleChange}
                                    placeholder="6-digit OTP"
                                    maxLength="6"
                                    required
                                />
                            </div>
                        </div>

                        <div className="saas-form-group">
                            <label className="saas-label">New Password</label>
                            <div className="saas-input-container">
                                <Lock size={18} className="saas-input-icon" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="newPassword"
                                    className="saas-input saas-input-with-icon"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    placeholder="New password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="saas-password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="saas-form-group">
                            <label className="saas-label">Confirm Password</label>
                            <div className="saas-input-container">
                                <Lock size={18} className="saas-input-icon" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    className="saas-input saas-input-with-icon"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm new password"
                                    required
                                />
                            </div>
                        </div>

                        {error && <div className="error-msg" style={{ color: '#e74c3c', marginBottom: '15px' }}>{error}</div>}
                        {message && <div className="success-msg" style={{ color: '#27ae60', marginBottom: '15px' }}>{message}</div>}

                        <button type="submit" className="saas-btn btn-primary saas-login-btn" disabled={isLoading}>
                            {isLoading ? <><Loader className="saas-spinner" size={18} /> Resetting...</> : "Reset Password"}
                        </button>

                        <button type="button" className="saas-btn btn-secondary" onClick={() => setStep(1)} style={{ width: '100%', marginTop: '10px', background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}>
                            Resend OTP
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
