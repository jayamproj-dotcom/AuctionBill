import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import SessionModal from './SessionModal';
import { adminHeartbeat } from '../../api/adminApi';
import { mainVendorHeartbeat } from '../../api/mainVendorApi';
import { vendorHeartbeat } from '../../api/vendorApi';
import { setSaasSessionError } from '../../redux/slices/saasAuthSlice';
import { setVendorSessionError } from '../../redux/slices/vendorAuthSlice';

const SessionManager = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const saasSessionError = useSelector(state => state.saasAuth.sessionError);
    const vendorSessionError = useSelector(state => state.vendorAuth.sessionError);
    const saasToken = useSelector(state => state.saasAuth.adminToken);
    const vendorToken = useSelector(state => state.vendorAuth.vendorToken);
    
    const isSaaSContext = location.pathname.includes('/saas') && !location.pathname.includes('/mainvendor');
    const isMainVendorContext = location.pathname.includes('/mainvendor');
    const isVendorContext = location.pathname.includes('/vendor') && !location.pathname.includes('/mainvendor');

    const lastActivityTime = React.useRef(Date.now());
    const lastHeartbeat = React.useRef(Date.now());

    useEffect(() => {
        const INACTIVITY_LIMIT = 5 * 60 * 1000; // 1 minute
        const CHECK_INTERVAL = 2000; // Every 2 seconds
        const HEARTBEAT_INTERVAL = 30 * 1000;

        const updateActivity = () => {
            lastActivityTime.current = Date.now();
            sendHeartbeat();
        };

        const sendHeartbeat = async () => {
            const now = Date.now();
            if (now - lastHeartbeat.current < HEARTBEAT_INTERVAL) return;
            
            lastHeartbeat.current = now;
            try {
                if (isSaaSContext && saasToken) {
                    await adminHeartbeat();
                } else if (isMainVendorContext && vendorToken) {
                    await mainVendorHeartbeat();
                } else if (isVendorContext && vendorToken) {
                    await vendorHeartbeat();
                }
            } catch (error) {
                console.error("Heartbeat failed", error);
            }
        };
   
        const checkInactivity = () => {
            const now = Date.now();
            const idleTime = now - lastActivityTime.current;
            
            if (idleTime > INACTIVITY_LIMIT) {
                // Prevent multiple triggers
                if (saasSessionError || vendorSessionError) return;

                console.log("Idle for more than 1 minute. Triggering session expiry.");

                const token = saasToken || vendorToken || localStorage.getItem('admin_token') || localStorage.getItem('token');
                if (token) {
                    const endpoint = isSaaSContext ? '/admin/browser-close' : 
                                    (isMainVendorContext ? '/main-vendor/browser-close' : '/vendor/browser-close');
                    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/';
                    const fullUrl = `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${endpoint}`;
                    
                    fetch(fullUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ token }),
                        keepalive: true
                    }).catch(() => {});
                }

                if (isSaaSContext && saasToken) {
                    dispatch(setSaasSessionError(true));
                } else if ((isVendorContext || isMainVendorContext) && vendorToken) {
                    dispatch(setVendorSessionError(true));
                }
            }
        };

        const inactivityTimer = setInterval(checkInactivity, CHECK_INTERVAL);
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => document.addEventListener(event, updateActivity));

        return () => {
            clearInterval(inactivityTimer);
            events.forEach(event => document.removeEventListener(event, updateActivity));
        };
    }, [isSaaSContext, isMainVendorContext, isVendorContext, saasToken, vendorToken, saasSessionError, vendorSessionError, dispatch]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            const token = saasToken || vendorToken || localStorage.getItem('admin_token') || localStorage.getItem('token');
            if (token) {
                let endpoint = '';
                if (isSaaSContext) {
                    endpoint = '/admin/browser-close';
                } else if (isMainVendorContext) {
                    endpoint = '/main-vendor/browser-close';
                } else if (isVendorContext) {
                    endpoint = '/vendor/browser-close';
                }

                if (endpoint) {
                    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/';
                    const fullUrl = `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${endpoint}`;
                    
                    // Use fetch with keepalive: true for better reliability than sendBeacon
                    // and support for Authorization header
                    fetch(fullUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ token }), // Send in body too as fallback
                        keepalive: true
                    }).catch(err => console.error("Browser close fetch failed", err));
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isSaaSContext, isMainVendorContext, isVendorContext, saasToken, vendorToken]);

    if (saasSessionError && isSaaSContext) {
        return <SessionModal type="saas" />;
    }

    if (vendorSessionError && (isVendorContext || isMainVendorContext)) {
        return <SessionModal type="vendor" />;
    }

    return null;
};

export default SessionManager;
