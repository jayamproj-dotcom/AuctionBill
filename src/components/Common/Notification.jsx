import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getVendorProfile } from '../../api/vendorApi';
import './Notification.css';
import { Bell } from 'lucide-react';

const Notification = ({ expiryDate: propsExpiryDate }) => {
    const { vendorId } = useSelector((state) => state.vendorAuth);
    const [fetchedExpiryDate, setFetchedExpiryDate] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    useEffect(() => {
        const fetchExpiryDate = async () => {
            if (vendorId) {
                try {
                    const data = await getVendorProfile(vendorId);
                    if (data && data.vendor && data.vendor.planEndDate) {
                        setFetchedExpiryDate(data.vendor.planEndDate);
                    }
                } catch (error) {
                    console.error("Failed to fetch vendor profile:", error);
                }
            }
        };
        fetchExpiryDate();
    }, [vendorId]);

    useEffect(() => {
        const activeExpiryDate = fetchedExpiryDate || propsExpiryDate;
        if (!activeExpiryDate) return;

        const checkExpiry = () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const expiry = new Date(activeExpiryDate);
            expiry.setHours(0, 0, 0, 0);
            
            const diffTime = expiry.getTime() - today.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            console.log("activeExpiryDate:", activeExpiryDate, "diffDays:", diffDays);

            let notification = null;

            if (diffDays <= 0) {
                notification = {
                    id: 'expired',
                    type: 'danger',
                    icon: '🚫',
                    title: 'Subscription Expired',
                    message: 'Your subscription has ended. Please renew immediately to continue using the services.',
                    time: 'Just now',
                    link: '/vendor/subscription'
                };
            } else if (diffDays <= 7 && diffDays > 0) {
                notification = {
                    id: 'warning',
                    type: diffDays <= 3 ? 'danger' : 'warning',
                    icon: '⚠️',
                    title: `Subscription Ends in ${diffDays} Day${diffDays > 1 ? 's' : ''}`,
                    message: `Your active plan will expire in ${diffDays} day${diffDays > 1 ? 's' : ''}. Please renew to avoid account suspension.`,
                    time: 'Just now',
                    link: '/vendor/subscription' // fixed spelling from ventor to vendor
                };
            }

            if (notification) {
                setNotifications([notification]);
                setUnreadCount(1);
            } else {
                setNotifications([]);
                setUnreadCount(0);
            }
        };

        checkExpiry();
    }, [fetchedExpiryDate, propsExpiryDate]);

    // Handle outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setUnreadCount(0); // Mark as read when opening
        }
    };

    const handleNotificationClick = (link) => {
        if (link) {
            navigate(link);
            setIsOpen(false);
        }
    };

    return (
        <div className="notification-icon-container" ref={dropdownRef}>
            <div className="icon-btn" onClick={handleToggle} style={{ position: 'relative' }}>
                <Bell />
                {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
            </div>

            {isOpen && (
                <div className="notification-panel">
                    <div className="notification-header">
                        <span>Notifications</span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', cursor: 'pointer' }} onClick={() => setNotifications([])}>Clear All</span>
                    </div>
                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="notification-empty">
                                No new notifications
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    className={`notification-item ${notif.type}`}
                                    onClick={() => handleNotificationClick(notif.link)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="notification-icon">{notif.icon}</div>
                                    <div className="notification-content">
                                        <div className="notification-title">{notif.title}</div>
                                        <div className="notification-message">{notif.message}</div>
                                        <div className="notification-time">{notif.time}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notification;
