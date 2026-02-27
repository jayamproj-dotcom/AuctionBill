import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getVendorNotifications } from '../../api/vendorApi';
import './Notification.css';
import { Bell } from 'lucide-react';

const Notification = ({ expiryDate: propsExpiryDate }) => {
    const { vendorId } = useSelector((state) => state.vendorAuth);
    const [dbNotifications, setDbNotifications] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    useEffect(() => {
        const fetchDbNotifications = async () => {
            if (vendorId) {
                try {
                    const data = await getVendorNotifications();
                    if (data && data.status && data.notifications) {
                        const formatted = data.notifications.map(n => {
                            let icon = '🔔';
                            let typeClass = 'info';
                            if(n.type === 'plan_upgrade') { icon = '⭐'; typeClass='success'; }
                            else if(n.type === 'asset_upgrade') { icon = '💎'; typeClass='primary'; }
                            else if(n.type === 'new_registration') { icon = '🎉'; typeClass='success'; }
                            else if(n.type === 'subscription_alert') { icon = '⚠️'; typeClass='warning'; }
                            else if(n.type === 'other') { icon = 'ℹ️'; typeClass='info'; }
                            
                            if (n.title === 'Subscription Expired') {
                                icon = '🚫'; typeClass = 'danger';
                            }
                            
                            return {
                                id: n._id,
                                type: typeClass,
                                icon,
                                title: n.title,
                                message: n.message,
                                time: new Date(n.createdAt).toLocaleDateString(),
                                link: null,
                                fromDb: true
                            };
                        });
                        setDbNotifications(formatted);
                        setNotifications(formatted);
                        setUnreadCount(formatted.length);
                    }
                } catch(error) {
                    console.error("Failed to fetch DB notifications:", error);
                }
            }
        };

        fetchDbNotifications();
    }, [vendorId]);

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
