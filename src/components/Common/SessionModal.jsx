import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearSaasAuthData, setSaasSessionError } from '../../redux/slices/saasAuthSlice';
import { clearVendorAuthData, setVendorSessionError } from '../../redux/slices/vendorAuthSlice';
import './SessionModal.css';

const SessionModal = ({ type }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleLogout = async () => {
        try {
            if (type === 'saas') {
                const token = sessionStorage.getItem('admin_token');
                if (token && token !== 'null' && token !== 'undefined') {
                    // Try to notify backend if possible, but don't wait
                    fetch(`${import.meta.env.VITE_API_URL}admin/logout`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        keepalive: true
                    }).catch(() => {});
                }

                dispatch(clearSaasAuthData());
                dispatch(setSaasSessionError(false));
                navigate('/saas-admin');
            } else {
                const token = sessionStorage.getItem('vendorToken');
                if (token && token !== 'null' && token !== 'undefined') {
                    fetch(`${import.meta.env.VITE_API_URL}vendor/logout`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        keepalive: true
                    }).catch(() => {});
                }

                dispatch(clearVendorAuthData());
                dispatch(setVendorSessionError(false));
                navigate('/');
            }
        } catch (error) {
            console.error("Logout failed", error);
            // Still navigate away even if API fails
            navigate(type === 'saas' ? '/saas-admin' : '/');
        }
    };

    return (
        <div className="session-modal-overlay">
            <div className="session-modal-content">
                <div className="session-modal-header">
                    <i className="fas fa-exclamation-triangle warning-icon"></i>
                    <h2>Session Expired</h2>
                </div>
                <div className="session-modal-body">
                    <p>Your session has expired or you have been logged in from another device. For security reasons, please log in again.</p>
                </div>
                <div className="session-modal-footer">
                    <button className="login-btn" onClick={handleLogout}>Log In Again</button>
                </div>
            </div>
        </div>
    );
};

export default SessionModal;
